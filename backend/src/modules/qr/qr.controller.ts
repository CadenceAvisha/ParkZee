import { Request, Response, NextFunction } from 'express';
import { qrService } from './qr.service.js';

export class QRController {
  async verify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await qrService.verifyQRToken(
        req.body.token,
        req.user!.id,
        req.user!.role,
        req.body.ownerParkingId
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async checkIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await qrService.recordCheckIn(
        req.body.bookingId,
        req.user!.id,
        req.user!.role
      );

      res.status(200).json({
        success: true,
        message: 'Driver successfully checked in',
        data: result,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async checkOut(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await qrService.recordCheckOut(
        req.body.bookingId,
        req.user!.id,
        req.user!.role
      );

      res.status(200).json({
        success: true,
        message: 'Driver checkout recorded and capacity released',
        data: result,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const qrController = new QRController();
