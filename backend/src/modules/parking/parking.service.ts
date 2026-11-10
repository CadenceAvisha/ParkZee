import { ParkingLocationModel, IParkingLocation } from './parking.model.js';
import { ListingVerificationStatus, VehicleType, BookingStatus } from '../../types/index.js';
import { AppError } from '../../middleware/errorHandler.js';
import { BookingModel } from '../bookings/booking.model.js';

export class ParkingService {
  async searchParking(filters: {
    locationQuery?: string;
    latitude?: number;
    longitude?: number;
    radiusKm?: number;
    vehicleType?: string;
    parkingType?: string;
    maxPrice?: number;
    amenities?: string[] | string;
    sortBy?: 'distance' | 'price_asc' | 'price_desc' | 'rating' | 'capacity';
    date?: string;
    startTime?: string;
    endTime?: string;
  }): Promise<any[]> {
    const query: Record<string, any> = {
      verificationStatus: ListingVerificationStatus.APPROVED,
      isActive: true,
    };

    // Text search filter
    if (filters.locationQuery) {
      const regex = new RegExp(filters.locationQuery, 'i');
      query.$or = [{ name: regex }, { address: regex }, { city: regex }];
    }

    // Vehicle Type filter
    if (filters.vehicleType) {
      query.supportedVehicleTypes = filters.vehicleType.toLowerCase();
    }

    // Parking Type filter
    if (filters.parkingType) {
      query.parkingType = filters.parkingType.toLowerCase();
    }

    // Max Price filter
    if (filters.maxPrice) {
      query.pricePerHour = { $lte: Number(filters.maxPrice) };
    }

    // Amenities filter
    if (filters.amenities) {
      const amenitiesList = Array.isArray(filters.amenities)
        ? filters.amenities
        : [filters.amenities];
      query.amenities = { $all: amenitiesList };
    }

    // Geospatial filter if coordinates are provided
    const hasCoordinates = filters.latitude !== undefined && filters.longitude !== undefined;
    const radiusMeters = (filters.radiusKm ?? 5) * 1000;
    if (hasCoordinates) {
      query.location = {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [filters.longitude, filters.latitude], // GeoJSON order: [lng, lat]
          },
          $maxDistance: radiusMeters,
        },
      };
    }

    // Mongo's 2dsphere query excludes records with missing/invalid GeoJSON coordinates.
    const listings = await ParkingLocationModel.find(query);

    const requestedStart = filters.date && filters.startTime ? new Date(`${filters.date}T${filters.startTime}`) : new Date();
    const requestedEnd = filters.date && filters.endTime ? new Date(`${filters.date}T${filters.endTime}`) : new Date(requestedStart.getTime() + 60 * 60 * 1000);
    const startTime = requestedStart;
    const endTime = requestedEnd;
    const validWindow = Number.isFinite(startTime.getTime()) && Number.isFinite(endTime.getTime()) && endTime > startTime;
    const occupancy = validWindow && listings.length
      ? await BookingModel.aggregate([
          { $match: {
            parkingLocationId: { $in: listings.map((listing) => listing._id) },
            bookingStatus: { $in: [BookingStatus.RESERVED_AWAITING_OWNER_CONFIRMATION, BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
            startTime: { $lt: endTime },
            endTime: { $gt: startTime },
          } },
          { $group: { _id: '$parkingLocationId', count: { $sum: 1 } } },
        ])
      : [];
    const occupiedById = new Map(occupancy.map((item: { _id: any; count: number }) => [item._id.toString(), item.count]));

    // Compute approximate distance if user coordinates provided
    const results: Record<string, any>[] = listings.map((l) => {
      const json: Record<string, any> = l.toJSON();
      if (hasCoordinates && (l.location as any)?.coordinates?.length === 2) {
        const lat1 = filters.latitude!;
        const lon1 = filters.longitude!;
        const lat2 = (l.location as any).coordinates[1];
        const lon2 = (l.location as any).coordinates[0];
        json.distanceKm = this.calculateHaversineDistance(lat1, lon1, lat2, lon2);
      }
      const activeBookings = occupiedById.get(l._id.toString()) ?? 0;
      json.availableCapacity = Math.max(0, l.totalCapacity - activeBookings);
      json.availableForBooking = validWindow && json.availableCapacity > 0 && this.isWithinOperatingHours(l.operatingHours, startTime, endTime);
      return json;
    }).filter((item) => item.availableForBooking);

    // Sorting
    if (filters.sortBy === 'price_asc') {
      results.sort((a, b) => a.pricePerHour - b.pricePerHour);
    } else if (filters.sortBy === 'price_desc') {
      results.sort((a, b) => b.pricePerHour - a.pricePerHour);
    } else if (filters.sortBy === 'rating') {
      results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (filters.sortBy === 'capacity') {
      results.sort((a, b) => b.availableCapacity - a.availableCapacity);
    } else if (filters.sortBy === 'distance') {
      results.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    }

    return results;
  }

  async getParkingById(id: string): Promise<any> {
    const listing = await ParkingLocationModel.findById(id);
    if (!listing) {
      throw new AppError('Parking facility not found.', 404);
    }
    return listing.toJSON();
  }

  async createListing(
    ownerId: string,
    ownerName: string,
    ownerPhone: string | undefined,
    data: any
  ): Promise<any> {
    const newListing = await ParkingLocationModel.create({
      ownerId,
      ownerName,
      ownerPhone,
      name: data.name,
      description: data.description,
      address: data.address,
      city: data.city,
      postalCode: data.postalCode,
      location: {
        type: 'Point',
        coordinates: [data.longitude, data.latitude], // GeoJSON: [lng, lat]
      },
      entranceLocation:
        data.entranceLongitude !== undefined && data.entranceLatitude !== undefined
          ? {
              type: 'Point',
              coordinates: [data.entranceLongitude, data.entranceLatitude],
            }
          : undefined,
      supportedVehicleTypes: data.supportedVehicleTypes,
      parkingType: data.parkingType,
      totalCapacity: data.totalCapacity,
      availableCapacity: data.totalCapacity,
      pricePerHour: data.pricePerHour,
      pricingUnit: data.pricingUnit || 'hour',
      operatingHours: {
        openTime: data.openTime || '00:00',
        closeTime: data.closeTime || '23:59',
        is24x7: data.is24x7 ?? false,
        openDays: data.openDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      },
      amenities: data.amenities || [],
      photos: data.photos || [],
      verificationStatus: ListingVerificationStatus.PENDING,
      isActive: false, // Requires administrator approval
    });

    return newListing.toJSON();
  }

  async updateListing(
    id: string,
    userId: string,
    isAdmin: boolean,
    data: any
  ): Promise<any> {
    const listing = await ParkingLocationModel.findById(id);
    if (!listing) {
      throw new AppError('Parking facility not found.', 404);
    }

    // IDOR Protection: Owner can only modify their own listing
    if (!isAdmin && listing.ownerId.toString() !== userId) {
      throw new AppError('Unauthorized: You do not own this parking listing.', 403);
    }

    if (data.latitude !== undefined && data.longitude !== undefined) {
      listing.location = {
        type: 'Point',
        coordinates: [data.longitude, data.latitude],
      };
    }
    if ((data.latitude === undefined) !== (data.longitude === undefined)) {
      throw new AppError('Latitude and longitude must be updated together.', 400);
    }

    if (data.name) listing.name = data.name;
    if (data.description) listing.description = data.description;
    if (data.address) listing.address = data.address;
    if (data.city) listing.city = data.city;
    if (data.postalCode !== undefined) listing.postalCode = data.postalCode;
    if (data.parkingType) listing.parkingType = data.parkingType;
    if (data.supportedVehicleTypes) listing.supportedVehicleTypes = data.supportedVehicleTypes;
    if (data.totalCapacity !== undefined) {
      const diff = data.totalCapacity - listing.totalCapacity;
      listing.totalCapacity = data.totalCapacity;
      listing.availableCapacity = Math.max(0, listing.availableCapacity + diff);
    }
    if (data.pricePerHour !== undefined) listing.pricePerHour = data.pricePerHour;
    if (data.operatingHours || data.openTime || data.is24x7 !== undefined) {
      listing.operatingHours = {
        openTime: data.openTime ?? listing.operatingHours.openTime,
        closeTime: data.closeTime ?? listing.operatingHours.closeTime,
        is24x7: data.is24x7 ?? listing.operatingHours.is24x7,
        openDays: data.openDays ?? listing.operatingHours.openDays,
      };
    }
    if (data.amenities) listing.amenities = data.amenities;
    if (data.photos) listing.photos = data.photos;

    await listing.save();
    return listing.toJSON();
  }

  async deleteListing(id: string, userId: string, isAdmin: boolean): Promise<boolean> {
    const listing = await ParkingLocationModel.findById(id);
    if (!listing) {
      throw new AppError('Parking facility not found.', 404);
    }

    if (!isAdmin && listing.ownerId.toString() !== userId) {
      throw new AppError('Unauthorized: You do not own this parking listing.', 403);
    }

    await listing.deleteOne();
    return true;
  }

  async getOwnerListings(ownerId: string): Promise<any[]> {
    const listings = await ParkingLocationModel.find({ ownerId }).sort({ createdAt: -1 });
    return listings.map((l) => l.toJSON());
  }

  async getAllListings(): Promise<any[]> {
    const listings = await ParkingLocationModel.find().sort({ createdAt: -1 });
    return listings.map((l) => l.toJSON());
  }

  async updateVerificationStatus(
    id: string,
    status: ListingVerificationStatus,
    rejectionReason?: string
  ): Promise<any> {
    const listing = await ParkingLocationModel.findById(id);
    if (!listing) {
      throw new AppError('Parking facility not found.', 404);
    }

    listing.verificationStatus = status;
    listing.isActive = status === ListingVerificationStatus.APPROVED;
    if (rejectionReason) {
      listing.rejectionReason = rejectionReason;
    }

    await listing.save();
    return listing.toJSON();
  }

  private calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  }

  private isWithinOperatingHours(hours: any, startTime: Date, endTime: Date): boolean {
    if (!hours || hours.is24x7) return true;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    if (hours.openDays?.length && (!hours.openDays.includes(days[startTime.getDay()]) || !hours.openDays.includes(days[endTime.getDay()]))) return false;
    const format = (date: Date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    return (!hours.openTime || format(startTime) >= hours.openTime) && (!hours.closeTime || format(endTime) <= hours.closeTime);
  }
}

export const parkingService = new ParkingService();
