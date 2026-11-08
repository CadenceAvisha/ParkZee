import apiClient from './api';
import { ParkingLocation, ParkingSearchFilters, ListingVerificationStatus } from '../types/parking.types';
import { ParkingListingFormData } from '../schemas/parking.schema';
import { getStoredParkingLocations, saveStoredParkingLocations } from './storage';

export const parkingService = {
  searchParking: async (filters: ParkingSearchFilters): Promise<ParkingLocation[]> => {
    try {
      const response = await apiClient.get<ParkingLocation[]>('/parking/search', { params: filters });
      return response.data;
    } catch (err) {
      console.warn('Backend unavailable, querying local parking catalog', err);
      let list = getStoredParkingLocations().filter(
        (item) => item.verificationStatus === 'approved' && item.isActive
      );

      if (filters.locationQuery) {
        const query = filters.locationQuery.toLowerCase();
        list = list.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.address.toLowerCase().includes(query) ||
            p.city.toLowerCase().includes(query)
        );
      }

      if (filters.vehicleType) {
        list = list.filter((p) => p.supportedVehicleTypes.includes(filters.vehicleType!));
      }

      if (filters.parkingType) {
        list = list.filter((p) => p.parkingType === filters.parkingType);
      }

      if (filters.maxPrice) {
        list = list.filter((p) => p.pricePerHour <= filters.maxPrice!);
      }

      if (filters.amenities && filters.amenities.length > 0) {
        list = list.filter((p) =>
          filters.amenities!.every((amenity) => p.amenities.includes(amenity))
        );
      }

      if (filters.sortBy === 'price_asc') {
        list.sort((a, b) => a.pricePerHour - b.pricePerHour);
      } else if (filters.sortBy === 'price_desc') {
        list.sort((a, b) => b.pricePerHour - a.pricePerHour);
      } else if (filters.sortBy === 'rating') {
        list.sort((a, b) => b.rating - a.rating);
      } else if (filters.sortBy === 'capacity') {
        list.sort((a, b) => b.availableCapacity - a.availableCapacity);
      }

      return list;
    }
  },

  getParkingById: async (id: string): Promise<ParkingLocation | null> => {
    try {
      const response = await apiClient.get<ParkingLocation>(`/parking/${id}`);
      return response.data;
    } catch (err) {
      const list = getStoredParkingLocations();
      return list.find((p) => p.id === id) || null;
    }
  },

  getOwnerListings: async (ownerId: string): Promise<ParkingLocation[]> => {
    try {
      const response = await apiClient.get<ParkingLocation[]>(`/parking/owner/${ownerId}`);
      return response.data;
    } catch (err) {
      const list = getStoredParkingLocations();
      return list.filter((p) => p.ownerId === ownerId);
    }
  },

  getAllListings: async (): Promise<ParkingLocation[]> => {
    try {
      const response = await apiClient.get<ParkingLocation[]>('/parking/admin/all');
      return response.data;
    } catch (err) {
      return getStoredParkingLocations();
    }
  },

  createListing: async (ownerId: string, ownerName: string, data: ParkingListingFormData): Promise<ParkingLocation> => {
    try {
      const response = await apiClient.post<ParkingLocation>('/parking', { ...data, ownerId });
      return response.data;
    } catch (err) {
      const list = getStoredParkingLocations();
      const newListing: ParkingLocation = {
        id: `pkg-${Date.now()}`,
        ownerId,
        ownerName,
        name: data.name,
        description: data.description,
        address: data.address,
        city: data.city,
        postalCode: data.postalCode,
        location: {
          latitude: data.latitude,
          longitude: data.longitude,
        },
        supportedVehicleTypes: data.supportedVehicleTypes,
        parkingType: data.parkingType,
        totalCapacity: data.totalCapacity,
        availableCapacity: data.totalCapacity,
        pricePerHour: data.pricePerHour,
        pricingUnit: 'hour',
        operatingHours: {
          openTime: data.openTime,
          closeTime: data.closeTime,
          is24x7: data.is24x7,
          openDays: data.openDays,
        },
        amenities: data.amenities,
        photos: data.photos,
        verificationStatus: 'pending', // Requires admin review
        isActive: false,
        rating: 0,
        reviewCount: 0,
        createdAt: new Date().toISOString(),
      };

      list.unshift(newListing);
      saveStoredParkingLocations(list);
      return newListing;
    }
  },

  updateListing: async (id: string, data: Partial<ParkingLocation>): Promise<ParkingLocation> => {
    try {
      const response = await apiClient.put<ParkingLocation>(`/parking/${id}`, data);
      return response.data;
    } catch (err) {
      const list = getStoredParkingLocations();
      const index = list.findIndex((p) => p.id === id);
      if (index === -1) throw new Error('Parking location not found');
      list[index] = { ...list[index], ...data, updatedAt: new Date().toISOString() };
      saveStoredParkingLocations(list);
      return list[index];
    }
  },

  updateListingVerificationStatus: async (
    id: string,
    status: ListingVerificationStatus,
    rejectionReason?: string
  ): Promise<ParkingLocation> => {
    try {
      const response = await apiClient.patch<ParkingLocation>(`/parking/${id}/verification`, {
        status,
        rejectionReason,
      });
      return response.data;
    } catch (err) {
      const list = getStoredParkingLocations();
      const index = list.findIndex((p) => p.id === id);
      if (index === -1) throw new Error('Listing not found');
      list[index].verificationStatus = status;
      list[index].isActive = status === 'approved';
      if (rejectionReason) {
        list[index].rejectionReason = rejectionReason;
      }
      saveStoredParkingLocations(list);
      return list[index];
    }
  },
};
