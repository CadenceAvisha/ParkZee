import { Request, Response, NextFunction } from 'express';
import { parkingService } from './parking.service.js';
import { uploadImageToCloudinary } from '../../config/cloudinary.js';
import { AppError } from '../../middleware/errorHandler.js';
import { UserRole } from '../../types/index.js';

export class ParkingController {
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const results = await parkingService.searchParking({
        locationQuery: (req.query.locationQuery || req.query.q) as string,
        latitude: req.query.latitude ? Number(req.query.latitude) : undefined,
        longitude: req.query.longitude ? Number(req.query.longitude) : undefined,
        radiusKm: req.query.radiusKm ? Number(req.query.radiusKm) : undefined,
        vehicleType: (req.query.vehicleType || req.query.vehicle) as string,
        parkingType: req.query.parkingType as string,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        amenities: req.query.amenities as any,
        sortBy: req.query.sortBy as any,
        date: req.query.date as string,
        startTime: req.query.startTime as string,
        endTime: req.query.endTime as string,
      });

      res.status(200).json({
        success: true,
        count: results.length,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const listing = await parkingService.getParkingById(req.params.id);
      res.status(200).json({
        success: true,
        data: listing,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const listing = await parkingService.createListing(
        req.user!.id,
        req.user!.name,
        undefined,
        req.body
      );
      res.status(201).json({
        success: true,
        message: 'Parking facility submitted for verification',
        data: listing,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isAdmin = req.user!.role === UserRole.ADMIN;
      const listing = await parkingService.updateListing(
        req.params.id,
        req.user!.id,
        isAdmin,
        req.body
      );
      res.status(200).json({
        success: true,
        message: 'Parking facility updated successfully',
        data: listing,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isAdmin = req.user!.role === UserRole.ADMIN;
      await parkingService.deleteListing(req.params.id, req.user!.id, isAdmin);
      res.status(200).json({
        success: true,
        message: 'Parking facility deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getOwnerListings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ownerId = req.params.ownerId || req.user!.id;

      // IDOR Guard: non-admins can only view their own listings
      const isAdmin = req.user?.role?.toUpperCase() === UserRole.ADMIN;
      if (!isAdmin && req.user?.id !== ownerId) {
        throw new AppError('Unauthorized: You can only view your own facility listings.', 403);
      }

      const listings = await parkingService.getOwnerListings(ownerId);
      res.status(200).json({
        success: true,
        count: listings.length,
        data: listings,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllListings(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const listings = await parkingService.getAllListings();
      res.status(200).json({
        success: true,
        count: listings.length,
        data: listings,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const listing = await parkingService.updateVerificationStatus(
        req.params.id,
        req.body.status,
        req.body.rejectionReason
      );
      res.status(200).json({
        success: true,
        message: `Listing verification status updated to ${req.body.status}`,
        data: listing,
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadPhoto(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new AppError('No image file uploaded.', 400);
      }
      const imageUrl = await uploadImageToCloudinary(req.file.buffer);
      res.status(200).json({
        success: true,
        data: { url: imageUrl },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const parkingController = new ParkingController();
