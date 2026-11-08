import { Request, Response, NextFunction } from 'express';
import { reportService } from './report.service.js';
import { AppError } from '../../middleware/errorHandler.js';

export class ReportController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Authentication required to submit report.', 401);
      }

      const report = await reportService.createReport(
        {
          id: req.user.id,
          name: req.user.name,
          role: req.user.role,
          email: req.user.email,
        },
        req.body
      );

      res.status(201).json({
        success: true,
        message: 'Report submitted successfully for administrative review',
        data: report,
        ...report,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as any;
      const reports = await reportService.getAllReports(status);
      res.status(200).json(reports);
    } catch (error) {
      next(error);
    }
  }

  async resolve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reportId } = req.params;
      const { status, resolutionNotes } = req.body;
      const adminName = req.user?.name || 'Administrator';

      const updated = await reportService.resolveReport(
        reportId,
        adminName,
        status,
        resolutionNotes
      );

      res.status(200).json({
        success: true,
        message: 'Report resolved successfully',
        data: updated,
        ...updated,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const reportController = new ReportController();
