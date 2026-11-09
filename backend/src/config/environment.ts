import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/parkzee'),
  JWT_ACCESS_SECRET: z.string().min(32),
JWT_REFRESH_SECRET: z.string().min(32),
  ADMIN_BOOTSTRAP_EMAIL: z.string().email().optional(),
  ADMIN_BOOTSTRAP_PASSWORD: z.string().min(12).optional(),
  ADMIN_BOOTSTRAP_NAME: z.string().min(2).max(100).optional(),
  JWT_ACCESS_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3000'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().default('no-reply@parkzee.com'),
  RESERVATION_GRACE_PERIOD_MINUTES: z.coerce.number().default(15),
}).superRefine((values, context) => {
  if (Boolean(values.ADMIN_BOOTSTRAP_EMAIL) !== Boolean(values.ADMIN_BOOTSTRAP_PASSWORD)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Set both ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD to provision an administrator.' });
  }
  if (values.NODE_ENV === 'production') {
    if (values.JWT_ACCESS_SECRET === 'parkzee-jwt-super-secret-access-token-key-2026' || values.JWT_ACCESS_SECRET.toLowerCase().startsWith('replace-with-') || values.JWT_ACCESS_SECRET.length < 32) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['JWT_ACCESS_SECRET'], message: 'Production requires a unique JWT_ACCESS_SECRET of at least 32 characters.' });
    }
    if (values.JWT_REFRESH_SECRET === 'parkzee-jwt-super-secret-refresh-token-key-2026' || values.JWT_REFRESH_SECRET.toLowerCase().startsWith('replace-with-') || values.JWT_REFRESH_SECRET.length < 32) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['JWT_REFRESH_SECRET'], message: 'Production requires a unique JWT_REFRESH_SECRET of at least 32 characters.' });
    }
    if (values.JWT_ACCESS_SECRET === values.JWT_REFRESH_SECRET) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['JWT_REFRESH_SECRET'], message: 'JWT access and refresh secrets must be different.' });
    }
  }
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment configuration:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
