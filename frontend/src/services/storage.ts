import { ParkingLocation } from '../types/parking.types';
import { Booking } from '../types/booking.types';
import { User } from '../types/user.types';
import { Report } from '../types/report.types';
import { PaymentConfirmationRecord } from '../types/payment.types';
import { INITIAL_USERS, INITIAL_PARKING_LOCATIONS, INITIAL_BOOKINGS, INITIAL_REPORTS } from './mockData';

const STORAGE_KEYS = {
  USERS: 'parkzee_users',
  PARKING: 'parkzee_parking_locations',
  BOOKINGS: 'parkzee_bookings',
  PAYMENTS: 'parkzee_payments',
  REPORTS: 'parkzee_reports',
};

// Initialize default storage if empty
export const initializeStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PARKING)) {
    localStorage.setItem(STORAGE_KEYS.PARKING, JSON.stringify(INITIAL_PARKING_LOCATIONS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(INITIAL_BOOKINGS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.REPORTS)) {
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(INITIAL_REPORTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PAYMENTS)) {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify([]));
  }
};

export const getStoredUsers = (): User[] => {
  initializeStorage();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
};

export const saveStoredUsers = (users: User[]) => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const getStoredParkingLocations = (): ParkingLocation[] => {
  initializeStorage();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.PARKING) || '[]');
};

export const saveStoredParkingLocations = (locations: ParkingLocation[]) => {
  localStorage.setItem(STORAGE_KEYS.PARKING, JSON.stringify(locations));
};

export const getStoredBookings = (): Booking[] => {
  initializeStorage();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS) || '[]');
};

export const saveStoredBookings = (bookings: Booking[]) => {
  localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
};

export const getStoredPayments = (): PaymentConfirmationRecord[] => {
  initializeStorage();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.PAYMENTS) || '[]');
};

export const saveStoredPayments = (payments: PaymentConfirmationRecord[]) => {
  localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
};

export const getStoredReports = (): Report[] => {
  initializeStorage();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.REPORTS) || '[]');
};

export const saveStoredReports = (reports: Report[]) => {
  localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
};
