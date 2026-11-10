import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import {
  registerValidationSchema,
  loginValidationSchema,
  forgotPasswordValidationSchema,
  resetPasswordValidationSchema,
} from './auth.validation.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authRateLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

router.post(
  '/register',
  authRateLimiter,
  validate(registerValidationSchema),
  authController.register
);

router.post(
  '/login',
  authRateLimiter,
  validate(loginValidationSchema),
  authController.login
);

router.post('/refresh', authRateLimiter, (req, res, next) => {
  if (typeof req.body?.refreshToken !== 'string' || !req.body.refreshToken) {
    res.status(400).json({ success: false, message: 'Refresh token is required.' });
    return;
  }
  authController.refresh(req, res, next);
});

router.get('/me', authenticate, authController.me);

router.post(
  '/forgot-password',
  authRateLimiter,
  validate(forgotPasswordValidationSchema),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  authRateLimiter,
  validate(resetPasswordValidationSchema),
  authController.resetPassword
);

export const authRoutes = router;
