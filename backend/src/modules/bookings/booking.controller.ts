import { Request, Response, NextFunction } from 'express';
import { bookingService } from './booking.service.js';
import { AppError } from '../../middleware/errorHandler.js';
import { UserRole } from '../../types/index.js';

export class BookingController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = req.user?.id || req.body.driverId;
      const driverName = req.user?.name || req.body.driverName || 'Driver';
      const driverEmail = req.user?.email || req.body.driverEmail;
      const driverPhone = req.body.driverPhone;

      if (!driverId) {
        throw new AppError('Driver identification required.', 401);
      }

      const booking = await bookingService.createBooking(
        driverId,
        driverName,
        driverEmail,
        driverPhone,
        req.body
      );

      res.status(201).json({
        success: true,
        message: 'Reservation created successfully awaiting direct owner payment confirmation',
        data: booking,
        ...booking,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDriverBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = req.params.driverId || req.user?.id;
      if (!driverId) {
        throw new AppError('Driver ID parameter missing.', 400);
      }

      // IDOR Guard: non-admins can only view their own booking history
      const isAdmin = req.user?.role?.toUpperCase() === UserRole.ADMIN;
      if (!isAdmin && req.user?.id !== driverId) {
        throw new AppError('Unauthorized: You can only view your own booking history.', 403);
      }

      const bookings = await bookingService.getDriverBookings(driverId);
      res.status(200).json(bookings);
    } catch (error) {
      next(error);
    }
  }

  async getOwnerBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ownerId = req.params.ownerId || req.user?.id;
      if (!ownerId) {
        throw new AppError('Owner ID parameter missing.', 400);
      }

      // IDOR Guard: non-admins can only view reservations for their own facilities
      const isAdmin = req.user?.role?.toUpperCase() === UserRole.ADMIN;
      if (!isAdmin && req.user?.id !== ownerId) {
        throw new AppError('Unauthorized: You can only view reservations for your own facilities.', 403);
      }

      const bookings = await bookingService.getOwnerBookings(ownerId);
      res.status(200).json(bookings);
    } catch (error) {
      next(error);
    }
  }

  async getAllBookings(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bookings = await bookingService.getAllBookings();
      res.status(200).json(bookings);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const booking = await bookingService.getBookingById(
        req.params.bookingId,
        req.user!.id,
        req.user!.role
      );

      res.status(200).json({
        success: true,
        data: booking,
        ...booking,
      });
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await bookingService.cancelBooking(
        req.params.bookingId,
        req.user!.id,
        req.user!.role,
        req.body.reason
      );

      res.status(200).json({
        success: true,
        message: 'Booking cancelled successfully',
        data: updated,
        ...updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await bookingService.updateBookingStatus(
        req.params.bookingId,
        req.body.status,
        req.user!.id,
        req.user!.role
      );

      res.status(200).json({
        success: true,
        message: 'Status updated successfully',
        data: updated,
        ...updated,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const bookingController = new BookingController();
