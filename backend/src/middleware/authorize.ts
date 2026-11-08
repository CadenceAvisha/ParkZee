import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/index.js';

export const authorize = (allowedRoles: (UserRole | string)[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required prior to authorization check.',
      });
      return;
    }

    const normalizedUserRole = req.user.role.toUpperCase();
    const normalizedAllowedRoles = allowedRoles.map((r) => r.toUpperCase());

    if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
      res.status(403).json({
        success: false,
        message: `Access forbidden: Required role [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
      });
      return;
    }

    next();
  };
};
