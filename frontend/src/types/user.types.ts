export type UserRole = 'driver' | 'owner' | 'admin';

export type AccountStatus = 'active' | 'suspended' | 'pending';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  accountStatus: AccountStatus;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  plateNumber: string;
  type: VehicleType;
  color: string;
  isDefault?: boolean;
}

export type VehicleType = 'car' | 'suv' | 'motorcycle' | 'ev' | 'truck';
