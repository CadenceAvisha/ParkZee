import bcrypt from 'bcryptjs';
import { User } from '../modules/users/user.model.js';
import { ParkingLocationModel } from '../modules/parking/parking.model.js';
import {
  UserRole,
  AccountStatus,
  ListingVerificationStatus,
  ParkingType,
  VehicleType,
} from '../types/index.js';

export const seedDatabase = async (): Promise<void> => {
  try {
    const adminExists = await User.findOne({ email: 'admin@parkzee.com' });

    if (!adminExists) {
      console.log('[ParkZee Seeder] Seeding default platform users...');
      const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

      const adminUser = await User.create({
        name: 'Priya Sundaram',
        email: 'admin@parkzee.com',
        phone: '+91 99887 76655',
        role: UserRole.ADMIN,
        accountStatus: AccountStatus.ACTIVE,
        passwordHash: defaultPasswordHash,
      });

      const ownerUser = await User.create({
        name: 'Vikramaditya Rao',
        email: 'owner@parkzee.com',
        phone: '+91 91234 56789',
        role: UserRole.OWNER,
        accountStatus: AccountStatus.ACTIVE,
        passwordHash: defaultPasswordHash,
      });

      const driverUser = await User.create({
        name: 'Rahul Sharma',
        email: 'driver@parkzee.com',
        phone: '+91 98765 43210',
        role: UserRole.DRIVER,
        accountStatus: AccountStatus.ACTIVE,
        passwordHash: defaultPasswordHash,
      });

      console.log('[ParkZee Seeder] Default accounts created:');
      console.log(' - Admin  : admin@parkzee.com  / Password123!');
      console.log(' - Owner  : owner@parkzee.com  / Password123!');
      console.log(' - Driver : driver@parkzee.com / Password123!');

      // Check if parking locations exist
      const parkingCount = await ParkingLocationModel.countDocuments();
      if (parkingCount === 0) {
        console.log('[ParkZee Seeder] Seeding initial approved parking facilities...');
        await ParkingLocationModel.create([
          {
            ownerId: ownerUser._id,
            name: 'Cyber City Commercial Valet & Parking',
            description:
              'Covered, 24/7 guarded multi-level parking facility situated right opposite Gateway Tower. Features dedicated EV rapid charging stations, round-the-clock CCTV surveillance, wide ramp access, and automated fire suppression.',
            address: 'DLF Cyber City, Tower B Access Road',
            city: 'Gurugram',
            postalCode: '122002',
            location: {
              type: 'Point',
              coordinates: [77.0878, 28.4986], // [lng, lat]
            },
            supportedVehicleTypes: [
              VehicleType.CAR,
              VehicleType.SUV,
              VehicleType.EV,
              VehicleType.MOTORCYCLE,
            ],
            parkingType: ParkingType.COVERED,
            totalCapacity: 25,
            availableCapacity: 25,
            pricePerHour: 50,
            pricingUnit: 'hour',
            operatingHours: {
              openTime: '00:00',
              closeTime: '23:59',
              is24x7: true,
              openDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            },
            amenities: [
              'CCTV Surveillance',
              '24/7 Security Guard',
              'Covered Roof',
              'EV Fast Charging',
              'Elevator Access',
              'Gated Entry',
            ],
            photos: [
              'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=900&q=80',
              'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=900&q=80',
            ],
            verificationStatus: ListingVerificationStatus.APPROVED,
            isActive: true,
            rating: 4.8,
            reviewCount: 42,
          },
          {
            ownerId: ownerUser._id,
            name: 'Sector 29 Leisure Valley Open Bay Lot',
            description:
              'Expansive open-air paved parking space located directly adjacent to Leisure Valley Park and the Kingdom of Dreams culinary zone. Ideal for weekend gatherings and dining commuters.',
            address: 'Plot 14, Leisure Valley Park Outer Ring, Sector 29',
            city: 'Gurugram',
            postalCode: '122001',
            location: {
              type: 'Point',
              coordinates: [77.0655, 28.4682], // [lng, lat]
            },
            supportedVehicleTypes: [
              VehicleType.CAR,
              VehicleType.SUV,
              VehicleType.MOTORCYCLE,
              VehicleType.TRUCK,
            ],
            parkingType: ParkingType.UNCOVERED,
            totalCapacity: 40,
            availableCapacity: 40,
            pricePerHour: 30,
            pricingUnit: 'hour',
            operatingHours: {
              openTime: '06:00',
              closeTime: '23:30',
              is24x7: false,
              openDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            },
            amenities: [
              'CCTV Surveillance',
              'Security Guard',
              'Paved Surface',
              'Water Wash Available',
            ],
            photos: [
              'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=900&q=80',
            ],
            verificationStatus: ListingVerificationStatus.APPROVED,
            isActive: true,
            rating: 4.6,
            reviewCount: 29,
          },
          {
            ownerId: ownerUser._id,
            name: 'DLF Phase 5 Underground Secured Bays',
            description:
              'Exclusive basement parking beneath Horizon Centre on Golf Course Road. Climate-controlled subterranean access, automated license plate recognition cameras, and round-the-clock patrol guards.',
            address: 'Horizon Plaza Sub-Basement B2, Golf Course Road, DLF Phase 5',
            city: 'Gurugram',
            postalCode: '122009',
            location: {
              type: 'Point',
              coordinates: [77.0984, 28.4485], // [lng, lat]
            },
            supportedVehicleTypes: [
              VehicleType.CAR,
              VehicleType.SUV,
              VehicleType.EV,
            ],
            parkingType: ParkingType.UNDERGROUND,
            totalCapacity: 15,
            availableCapacity: 15,
            pricePerHour: 70,
            pricingUnit: 'hour',
            operatingHours: {
              openTime: '00:00',
              closeTime: '23:59',
              is24x7: true,
              openDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            },
            amenities: [
              'CCTV Surveillance',
              '24/7 Security Guard',
              'Covered Roof',
              'EV Fast Charging',
              'Elevator Access',
              'Gated Entry',
              'Disabled Access',
            ],
            photos: [
              'https://images.unsplash.com/photo-1542314831-c6a4d2720d20?auto=format&fit=crop&w=900&q=80',
            ],
            verificationStatus: ListingVerificationStatus.APPROVED,
            isActive: true,
            rating: 4.9,
            reviewCount: 56,
          },
        ]);
        console.log('[ParkZee Seeder] 3 approved parking facilities seeded successfully.');
      }
    }
  } catch (error) {
    console.error('[ParkZee Seeder] Seeding error:', error);
  }
};
