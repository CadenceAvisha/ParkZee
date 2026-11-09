import apiClient from './api';
import { User, AccountStatus } from '../types/user.types';
import { Report, ReportStatus } from '../types/report.types';

export interface PlatformStats {
  totalUsers: number;
  totalDrivers: number;
  totalOwners: number;
  totalParkingLocations: number;
  pendingApprovals: number;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalDirectRevenueConfirmed: number;
}

export const adminService = {
  getPlatformStats: async (): Promise<PlatformStats> => {
    try {
      const response = await apiClient.get<any>('/admin/stats');
      return response.data?.data ?? response.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch platform stats';
      throw new Error(msg);
    }
  },

  getUsers: async (): Promise<User[]> => {
    try {
      const response = await apiClient.get<any>('/admin/users');
      return response.data?.data ?? response.data ?? [];
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch platform users';
      throw new Error(msg);
    }
  },

  updateUserStatus: async (userId: string, status: AccountStatus): Promise<User> => {
    try {
      const response = await apiClient.patch<any>(`/admin/users/${userId}/status`, { status });
      return response.data?.data ?? response.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update user status';
      throw new Error(msg);
    }
  },

  getReports: async (): Promise<Report[]> => {
    try {
      const response = await apiClient.get<any>('/admin/reports');
      return response.data?.data ?? response.data ?? [];
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch reports';
      throw new Error(msg);
    }
  },

  resolveReport: async (
    reportId: string,
    status: ReportStatus,
    resolutionNotes: string,
    adminId: string
  ): Promise<Report> => {
    try {
      const response = await apiClient.patch<any>(`/admin/reports/${reportId}/resolve`, {
        status,
        resolutionNotes,
        adminId,
      });
      return response.data?.data ?? response.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to resolve report';
      throw new Error(msg);
    }
  },
};
