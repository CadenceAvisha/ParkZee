import apiClient from './api';
import { Report } from '../types/report.types';

export const reportService = {
  createReport: async (data: {
    targetType: 'parking_location' | 'booking' | 'user' | 'payment_dispute';
    targetId: string;
    targetTitle: string;
    reason: string;
    description: string;
  }): Promise<Report> => {
    try {
      const response = await apiClient.post<any>('/reports', data);
      return response.data?.data ?? response.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit report';
      throw new Error(msg);
    }
  },
};
