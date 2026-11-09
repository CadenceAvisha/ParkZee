import apiClient from './api';

export interface ParkingReview {
  id: string;
  bookingId: string;
  driverId: string;
  driverName: string;
  parkingLocationId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export const reviewService = {
  createReview: async (data: {
    bookingId: string;
    rating: number;
    comment?: string;
  }): Promise<ParkingReview> => {
    try {
      const response = await apiClient.post<any>('/reviews', data);
      return response.data?.data ?? response.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit review';
      throw new Error(msg);
    }
  },

  getParkingReviews: async (parkingId: string): Promise<ParkingReview[]> => {
    try {
      const response = await apiClient.get<any>(`/reviews/parking/${parkingId}`);
      return response.data?.data ?? response.data ?? [];
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch reviews';
      throw new Error(msg);
    }
  },
};
