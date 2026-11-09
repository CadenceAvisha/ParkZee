import bcrypt from 'bcryptjs';
import { User } from '../modules/users/user.model.js';
import { AccountStatus, UserRole } from '../types/index.js';

/** Provision an administrator only from trusted server configuration. */
export const ensureBootstrapAdmin = async (config: {
  email?: string;
  password?: string;
  name?: string;
}): Promise<void> => {
  if (!config.email || !config.password) return;

  const existing = await User.findOne({ email: config.email });
  if (existing) {
    if (existing.role !== UserRole.ADMIN) {
      throw new Error('ADMIN_BOOTSTRAP_EMAIL is already used by a non-admin account.');
    }
    // Replace the synthetic identity left by the old sample seeder, without
    // changing an existing admin's password or any other administrator data.
    if (existing.name === 'Priya Sundaram') {
      existing.name = config.name || 'ParkZee Administrator';
      existing.phone = undefined;
      await existing.save();
    }
    console.log(`[ParkZee] Administrator account is ready: ${config.email}`);
    return;
  }

  await User.create({
    name: config.name || 'ParkZee Administrator',
    email: config.email,
    role: UserRole.ADMIN,
    accountStatus: AccountStatus.ACTIVE,
    passwordHash: await bcrypt.hash(config.password, 12),
  });
  console.log(`[ParkZee] Administrator account created: ${config.email}`);
};

/** No sample users, listings, bookings, or other demo records are seeded. */
export const seedDatabase = async (): Promise<void> => {
  await ensureBootstrapAdmin({
    email: process.env.ADMIN_BOOTSTRAP_EMAIL,
    password: process.env.ADMIN_BOOTSTRAP_PASSWORD,
    name: process.env.ADMIN_BOOTSTRAP_NAME,
  });
};
