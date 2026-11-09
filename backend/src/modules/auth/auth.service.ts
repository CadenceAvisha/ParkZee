import bcrypt from 'bcryptjs';
import { User, IUser } from '../users/user.model.js';
import { PasswordResetToken } from './passwordResetToken.model.js';
import {
  generateAccessToken,
  generateRefreshToken,
  generateRandomToken,
  hashToken,
} from '../../utils/token.js';
import { AppError } from '../../middleware/errorHandler.js';
import { sendEmail } from '../../config/mail.js';
import { AccountStatus, UserRole } from '../../types/index.js';

export class AuthService {
  async register(data: {
    name: string;
    email: string;
    phone?: string;
    role: UserRole;
    password: string;
  }): Promise<{ user: any; token: string; refreshToken: string }> {
    if (data.role !== UserRole.DRIVER && data.role !== UserRole.OWNER) {
      throw new AppError('Public registration is limited to driver and owner accounts.', 400);
    }
    const existing = await User.findOne({ email: data.email });
    if (existing) {
      throw new AppError('An account with this email address already exists.', 409);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await User.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      passwordHash,
      accountStatus: AccountStatus.ACTIVE,
    });

    const token = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const refreshToken = generateRefreshToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    // Send welcome email asynchronously
    sendEmail({
      to: user.email,
      subject: 'Welcome to ParkZee Smart Parking Marketplace',
      text: `Hello ${user.name},\n\nWelcome to ParkZee! Your account as ${user.role} has been created successfully.`,
    });

    return {
      user: user.toJSON(),
      token,
      refreshToken,
    };
  }

  async login(credentials: {
    email: string;
    password: string;
  }): Promise<{ user: any; token: string; refreshToken: string }> {
    const user = await User.findOne({ email: credentials.email });
    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    if (user.accountStatus === AccountStatus.SUSPENDED) {
      throw new AppError(
        'Your account has been suspended by an administrator. Please contact support.',
        403
      );
    }

    const isMatch = await user.comparePassword(credentials.password);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    const token = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const refreshToken = generateRefreshToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return {
      user: user.toJSON(),
      token,
      refreshToken,
    };
  }

  async getCurrentUser(userId: string): Promise<any> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User profile not found.', 404);
    }
    return user.toJSON();
  }

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const user = await User.findOne({ email });
    if (!user) {
      // Don't disclose account non-existence for security
      return {
        success: true,
        message: 'If an account exists with this email, password reset instructions have been sent.',
      };
    }

    const rawToken = generateRandomToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await PasswordResetToken.create({
      userId: user._id,
      tokenHash,
      expiresAt,
    });

    await sendEmail({
      to: user.email,
      subject: 'ParkZee Password Reset Request',
      text: `You requested a password reset. Use the following reset token: ${rawToken}\n\nThis token will expire in 1 hour.`,
    });

    return {
      success: true,
      message: 'If an account exists with this email, password reset instructions have been sent.',
    };
  }

  async resetPassword(token: string, newPass: string): Promise<{ success: boolean; message: string }> {
    const tokenHash = hashToken(token);
    const resetRecord = await PasswordResetToken.findOne({
      tokenHash,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!resetRecord) {
      throw new AppError('Invalid or expired password reset token.', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPass, salt);

    await User.findByIdAndUpdate(resetRecord.userId, { passwordHash });
    resetRecord.used = true;
    await resetRecord.save();

    return {
      success: true,
      message: 'Your password has been reset successfully. You may now log in.',
    };
  }
}

export const authService = new AuthService();
