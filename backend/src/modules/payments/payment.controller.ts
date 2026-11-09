import { Request, Response, NextFunction } from 'express';
import { paymentService } from './payment.service.js';
import { AppError } from '../../middleware/errorHandler.js';
import { UserRole } from '../../types/index.js';

export class PaymentController {
  async confirmDirectPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ownerId = req.user?.id || req.body.ownerId;
      const ownerName = req.user?.name || 'Parking Host';
      const userRole = req.user?.role || 'OWNER';

      if (!ownerId) {
        throw new AppError('Host identification required for payment confirmation.', 401);
      }

      const result = await paymentService.confirmDirectPayment(
        ownerId,
        ownerName,
        userRole,
        req.body
      );

      res.status(200).json({
        success: true,
        message: 'Direct payment confirmed by host. Entry QR pass activated.',
        booking: result.booking,
        paymentRecord: result.paymentRecord,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // IDOR Guard: non-admins can only view their own payment history
      const isAdmin = req.user?.role?.toUpperCase() === UserRole.ADMIN;
      const ownerId = isAdmin && req.query.ownerId ? (req.query.ownerId as string) : req.user?.id;
      const userRole = req.user?.role;
      const history = await paymentService.getPaymentHistory(ownerId, userRole);
      res.status(200).json(history);
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
