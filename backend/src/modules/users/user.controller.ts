import { Request, Response, NextFunction } from 'express';
import { userService } from './user.service.js';
import { AppError } from '../../middleware/errorHandler.js';
import { UserRole } from '../../types/index.js';

export class UserController {
  async getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await userService.getAllUsers({
        role: req.query.role as string,
        status: req.query.status as string,
      });
      res.status(200).json({
        success: true,
        count: users.length,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.id !== req.params.id && req.user?.role !== UserRole.ADMIN) {
        throw new AppError('You can only view your own profile.', 403);
      }
      const user = await userService.getUserById(req.params.id);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.updateUserStatus(req.params.id, req.body.status);
      res.status(200).json({
        success: true,
        message: 'User account status updated successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.updateProfile(req.user!.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
