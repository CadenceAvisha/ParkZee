import { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service.js';
import { userService } from '../users/user.service.js';
import { reportService } from '../reports/report.service.js';

export class AdminController {
  async getStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await adminService.getPlatformStats();
      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  }

  async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await userService.getAllUsers({
        role: req.query.role as string,
        status: req.query.status as string,
      });
      res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  }

  async updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await userService.updateUserStatus(req.params.userId, req.body.status);
      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  }

  async getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reports = await reportService.getAllReports(req.query.status as any);
      res.status(200).json(reports);
    } catch (error) {
      next(error);
    }
  }

  async resolveReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminName = req.user?.name || 'Administrator';
      const updated = await reportService.resolveReport(
        req.params.reportId,
        adminName,
        req.body.status,
        req.body.resolutionNotes
      );
      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
