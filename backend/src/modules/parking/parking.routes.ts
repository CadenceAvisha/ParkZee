import { Router } from 'express';
import { parkingController } from './parking.controller.js';
import { validate } from '../../middleware/validate.js';
import {
  createParkingValidationSchema,
  updateParkingValidationSchema,
  parkingSearchQuerySchema,
  updateVerificationValidationSchema,
} from './parking.validation.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { uploadSingleImage } from '../../middleware/upload.js';
import { UserRole } from '../../types/index.js';

const router = Router();

// Public routes
router.get('/search', validate(parkingSearchQuerySchema, 'query'), parkingController.search);
router.get('/admin/all', authenticate, authorize([UserRole.ADMIN]), parkingController.getAllListings);
router.get('/owner/:ownerId', authenticate, authorize([UserRole.OWNER, UserRole.ADMIN]), parkingController.getOwnerListings);
router.get('/:id', parkingController.getById);

// Protected routes (Owner / Admin)
router.post(
  '/',
  authenticate,
  authorize([UserRole.OWNER, UserRole.ADMIN]),
  validate(createParkingValidationSchema),
  parkingController.create
);

router.put(
  '/:id',
  authenticate,
  authorize([UserRole.OWNER, UserRole.ADMIN]),
  validate(updateParkingValidationSchema),
  parkingController.update
);

router.delete(
  '/:id',
  authenticate,
  authorize([UserRole.OWNER, UserRole.ADMIN]),
  parkingController.delete
);

router.patch(
  '/:id/verification',
  authenticate,
  authorize([UserRole.ADMIN]),
  validate(updateVerificationValidationSchema),
  parkingController.updateVerification
);

router.post(
  '/upload',
  authenticate,
  authorize([UserRole.OWNER, UserRole.ADMIN]),
  uploadSingleImage,
  parkingController.uploadPhoto
);

export const parkingRoutes = router;
