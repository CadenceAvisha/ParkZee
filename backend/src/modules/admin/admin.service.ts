import { User } from '../users/user.model.js';
import { ParkingLocationModel } from '../parking/parking.model.js';
import { BookingModel } from '../bookings/booking.model.js';
import {
  UserRole,
  ListingVerificationStatus,
  BookingStatus,
  PaymentStatus,
} from '../../types/index.js';

export interface PlatformStats {
  totalUsers: number;
  totalDrivers: number;
  totalOwners: number;
  totalParkingLocations: number;
  pendingApprovals: number;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalDirectRevenueConfirmed: number;
}

export class AdminService {
  async getPlatformStats(): Promise<PlatformStats> {
    const [
      totalUsers,
      totalDrivers,
      totalOwners,
      totalParkingLocations,
      pendingApprovals,
      activeBookings,
      completedBookings,
      cancelledBookings,
      paidConfirmedBookings,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: UserRole.DRIVER }),
      User.countDocuments({ role: UserRole.OWNER }),
      ParkingLocationModel.countDocuments(),
      ParkingLocationModel.countDocuments({
        verificationStatus: ListingVerificationStatus.PENDING,
      }),
      BookingModel.countDocuments({
        bookingStatus: {
          $in: [
            BookingStatus.RESERVED_AWAITING_OWNER_CONFIRMATION,
            BookingStatus.CONFIRMED,
            BookingStatus.CHECKED_IN,
          ],
        },
      }),
      BookingModel.countDocuments({ bookingStatus: BookingStatus.COMPLETED }),
      BookingModel.countDocuments({ bookingStatus: BookingStatus.CANCELLED }),
      BookingModel.find({
        paymentStatus: PaymentStatus.PAID_CONFIRMED_BY_OWNER,
      }).select('totalAmount'),
    ]);

    const totalDirectRevenueConfirmed = paidConfirmedBookings.reduce(
      (sum, b) => sum + (b.totalAmount || 0),
      0
    );

    return {
      totalUsers,
      totalDrivers,
      totalOwners,
      totalParkingLocations,
      pendingApprovals,
      activeBookings,
      completedBookings,
      cancelledBookings,
      totalDirectRevenueConfirmed,
    };
  }
}

export const adminService = new AdminService();
