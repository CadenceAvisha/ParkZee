import { User } from './user.model.js';
import { AccountStatus, UserRole } from '../../types/index.js';
import { AppError } from '../../middleware/errorHandler.js';

export class UserService {
  async getAllUsers(filters?: { role?: string; status?: string }): Promise<any[]> {
    const query: Record<string, any> = {};
    if (filters?.role) {
      query.role = filters.role.toUpperCase();
    }
    if (filters?.status) {
      query.accountStatus = filters.status.toUpperCase();
    }
    const users = await User.find(query).sort({ createdAt: -1 });
    return users.map((u) => u.toJSON());
  }

  async getUserById(id: string): Promise<any> {
    const user = await User.findById(id);
    if (!user) {
      throw new AppError('User not found.', 404);
    }
    return user.toJSON();
  }

  async updateUserStatus(id: string, status: string): Promise<any> {
    const normalizedStatus = status.toUpperCase() as AccountStatus;
    if (!Object.values(AccountStatus).includes(normalizedStatus)) {
      throw new AppError('Invalid account status value.', 400);
    }

    const user = await User.findByIdAndUpdate(
      id,
      { accountStatus: normalizedStatus },
      { new: true }
    );

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    return user.toJSON();
  }

  async updateProfile(id: string, data: { name?: string; phone?: string; profileImage?: string }): Promise<any> {
    const user = await User.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!user) {
      throw new AppError('User not found.', 404);
    }
    return user.toJSON();
  }
}

export const userService = new UserService();
