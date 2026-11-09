import apiClient from './api';
import {
  ParkingLocation,
  ParkingSearchFilters,
  ListingVerificationStatus,
} from '../types/parking.types';
import { ParkingListingFormData } from '../schemas/parking.schema';

export const parkingService = {
  searchParking: async (filters: ParkingSearchFilters): Promise<ParkingLocation[]> => {
    try {
      const response = await apiClient.get<any>('/parking/search', { params: filters });
      return response.data?.data ?? response.data ?? [];
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to search parking locations';
      throw new Error(msg);
    }
  },

  getParkingById: async (id: string): Promise<ParkingLocation | null> => {
    try {
      const response = await apiClient.get<any>(`/parking/${id}`);
      return response.data?.data ?? response.data ?? null;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Parking location not found';
      throw new Error(msg);
    }
  },

  getOwnerListings: async (ownerId: string): Promise<ParkingLocation[]> => {
    try {
      const response = await apiClient.get<any>(`/parking/owner/${ownerId}`);
      return response.data?.data ?? response.data ?? [];
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch owner listings';
      throw new Error(msg);
    }
  },

  getAllListings: async (): Promise<ParkingLocation[]> => {
    try {
      const response = await apiClient.get<any>('/parking/admin/all');
      return response.data?.data ?? response.data ?? [];
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch all listings';
      throw new Error(msg);
    }
  },

  createListing: async (
    ownerId: string,
    ownerName: string,
    data: ParkingListingFormData
  ): Promise<ParkingLocation> => {
    try {
      const response = await apiClient.post<any>('/parking', { ...data, ownerId, ownerName });
      return response.data?.data ?? response.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to create listing';
      throw new Error(msg);
    }
  },

  updateListing: async (
    id: string,
    data: Partial<ParkingLocation> & Record<string, any>
  ): Promise<ParkingLocation> => {
    try {
      const response = await apiClient.put<any>(`/parking/${id}`, data);
      return response.data?.data ?? response.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update listing';
      throw new Error(msg);
    }
  },

  deleteListing: async (id: string): Promise<boolean> => {
    try {
      const response = await apiClient.delete<any>(`/parking/${id}`);
      return response.data?.success ?? true;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete listing';
      throw new Error(msg);
    }
  },

  updateListingVerificationStatus: async (
    id: string,
    status: ListingVerificationStatus,
    rejectionReason?: string
  ): Promise<ParkingLocation> => {
    try {
      const response = await apiClient.patch<any>(`/parking/${id}/verification`, {
        status,
        rejectionReason,
      });
      return response.data?.data ?? response.data;
    } catch (err: any) {
      const msg =
        err.response?.data?.message || err.message || 'Failed to update listing verification status';
      throw new Error(msg);
    }
  },
};
