import apiClient from './api';
import { User, AccountStatus } from '../types/user.types';
import { Report, ReportStatus } from '../types/report.types';
import {
  getStoredUsers,
  saveStoredUsers,
  getStoredParkingLocations,
  getStoredBookings,
  getStoredReports,
  saveStoredReports,
} from './storage';

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
      const response = await apiClient.get<PlatformStats>('/admin/stats');
      return (response.data as any)?.data ?? response.data;
    } catch (err) {
      const users = getStoredUsers();
      const locations = getStoredParkingLocations();
      const bookings = getStoredBookings();

      const totalDrivers = users.filter((u) => u.role === 'driver').length;
      const totalOwners = users.filter((u) => u.role === 'owner').length;
      const pendingApprovals = locations.filter((l) => l.verificationStatus === 'pending').length;
      const activeBookings = bookings.filter((b) =>
        ['RESERVED_AWAITING_OWNER_CONFIRMATION', 'CONFIRMED', 'CHECKED_IN'].includes(b.bookingStatus)
      ).length;
      const completedBookings = bookings.filter((b) => b.bookingStatus === 'COMPLETED').length;
      const cancelledBookings = bookings.filter((b) => b.bookingStatus === 'CANCELLED').length;

      const totalDirectRevenueConfirmed = bookings
        .filter((b) => b.paymentStatus === 'PAID_CONFIRMED_BY_OWNER')
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

      return {
        totalUsers: users.length,
        totalDrivers,
        totalOwners,
        totalParkingLocations: locations.length,
        pendingApprovals,
        activeBookings,
        completedBookings,
        cancelledBookings,
        totalDirectRevenueConfirmed,
      };
    }
  },

  getUsers: async (): Promise<User[]> => {
    try {
      const response = await apiClient.get<User[]>('/admin/users');
      return (response.data as any)?.data ?? response.data;
    } catch (err) {
      return getStoredUsers();
    }
  },

  updateUserStatus: async (userId: string, status: AccountStatus): Promise<User> => {
    try {
      const response = await apiClient.patch<User>(`/admin/users/${userId}/status`, { status });
      return (response.data as any)?.data ?? response.data;
    } catch (err) {
      const users = getStoredUsers();
      const idx = users.findIndex((u) => u.id === userId);
      if (idx === -1) throw new Error('User not found');
      users[idx].accountStatus = status;
      saveStoredUsers(users);
      return users[idx];
    }
  },

  getReports: async (): Promise<Report[]> => {
    try {
      const response = await apiClient.get<Report[]>('/admin/reports');
      return (response.data as any)?.data ?? response.data;
    } catch (err) {
      return getStoredReports();
    }
  },

  resolveReport: async (
    reportId: string,
    status: ReportStatus,
    resolutionNotes: string,
    adminId: string
  ): Promise<Report> => {
    try {
      const response = await apiClient.patch<Report>(`/admin/reports/${reportId}/resolve`, {
        status,
        resolutionNotes,
        adminId,
      });
      return (response.data as any)?.data ?? response.data;
    } catch (err) {
      const reports = getStoredReports();
      const idx = reports.findIndex((r) => r.id === reportId);
      if (idx === -1) throw new Error('Report not found');
      reports[idx].status = status;
      reports[idx].resolutionNotes = resolutionNotes;
      reports[idx].resolvedBy = adminId;
      reports[idx].resolvedAt = new Date().toISOString();
      saveStoredReports(reports);
      return reports[idx];
    }
  },
};
