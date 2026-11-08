import mongoose from 'mongoose';
import { ReviewModel } from './review.model.js';
import { BookingModel } from '../bookings/booking.model.js';
import { ParkingLocationModel } from '../parking/parking.model.js';
import { BookingStatus } from '../../types/index.js';
import { AppError } from '../../middleware/errorHandler.js';

export class ReviewService {
  async createReview(
    driverId: string,
    driverName: string,
    data: {
      bookingId: string;
      rating: number;
      comment?: string;
    }
  ): Promise<any> {
    const booking = await BookingModel.findById(data.bookingId);
    if (!booking) {
      throw new AppError('Booking not found.', 404);
    }

    if (booking.driverId.toString() !== driverId) {
      throw new AppError('Unauthorized: You can only review your own reservations.', 403);
    }

    if (booking.bookingStatus !== BookingStatus.COMPLETED) {
      throw new AppError(
        'Reviews are only eligible after a booking has successfully completed checkout.',
        400
      );
    }

    const existingReview = await ReviewModel.findOne({ bookingId: booking._id });
    if (existingReview) {
      throw new AppError('A review has already been submitted for this booking.', 409);
    }

    const review = await ReviewModel.create({
      bookingId: booking._id,
      driverId: new mongoose.Types.ObjectId(driverId),
      driverName,
      parkingLocationId: booking.parkingLocationId,
      rating: data.rating,
      comment: data.comment,
    });

    // Recalculate average rating & count on parking location
    const allReviews = await ReviewModel.find({
      parkingLocationId: booking.parkingLocationId,
    });
    const total = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const avg = Number((total / allReviews.length).toFixed(1));

    await ParkingLocationModel.findByIdAndUpdate(booking.parkingLocationId, {
      rating: avg,
      reviewCount: allReviews.length,
    });

    return review.toJSON();
  }

  async getParkingReviews(parkingLocationId: string): Promise<any[]> {
    const reviews = await ReviewModel.find({ parkingLocationId })
      .sort({ createdAt: -1 })
      .lean();

    return reviews.map((r: any) => ({
      ...r,
      id: r._id.toString(),
    }));
  }
}

export const reviewService = new ReviewService();
