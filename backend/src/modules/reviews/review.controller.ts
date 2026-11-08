import { Request, Response, NextFunction } from 'express';
import { reviewService } from './review.service.js';
import { AppError } from '../../middleware/errorHandler.js';

export class ReviewController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Authentication required to submit review.', 401);
      }

      const review = await reviewService.createReview(
        req.user.id,
        req.user.name,
        req.body
      );

      res.status(201).json({
        success: true,
        message: 'Review submitted successfully',
        data: review,
        ...review,
      });
    } catch (error) {
      next(error);
    }
  }

  async getByParking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reviews = await reviewService.getParkingReviews(req.params.parkingId);
      res.status(200).json(reviews);
    } catch (error) {
      next(error);
    }
  }
}

export const reviewController = new ReviewController();
