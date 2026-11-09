import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from '../components/layout/PublicLayout';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Public Pages
import { LandingPage } from '../pages/public/LandingPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';

// Driver Pages
import { DriverDashboardPage } from '../pages/driver/DriverDashboardPage';
import { ParkingSearchPage } from '../pages/driver/ParkingSearchPage';
import { ParkingDetailsPage } from '../pages/driver/ParkingDetailsPage';
import { BookingCheckoutPage } from '../pages/driver/BookingCheckoutPage';
import { MyBookingsPage } from '../pages/driver/MyBookingsPage';
import { DriverBookingDetailPage } from '../pages/driver/DriverBookingDetailPage';
import { DriverProfilePage } from '../pages/driver/DriverProfilePage';

// Owner Pages
import { OwnerDashboardPage } from '../pages/owner/OwnerDashboardPage';
import { ManageListingsPage } from '../pages/owner/ManageListingsPage';
import { AddEditListingPage } from '../pages/owner/AddEditListingPage';
import { OwnerBookingsPage } from '../pages/owner/OwnerBookingsPage';
import { OwnerScannerPage } from '../pages/owner/OwnerScannerPage';
import { OwnerProfilePage } from '../pages/owner/OwnerProfilePage';

// Admin Pages
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { AdminListingsPage } from '../pages/admin/AdminListingsPage';
import { AdminBookingsPage } from '../pages/admin/AdminBookingsPage';
import { AdminReportsPage } from '../pages/admin/AdminReportsPage';
import { AdminAnalyticsPage } from '../pages/admin/AdminAnalyticsPage';
import { AdminProfilePage } from '../pages/admin/AdminProfilePage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages with Standard Header/Footer */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/search" element={<ParkingSearchPage />} />
        <Route path="/parking/:id" element={<ParkingDetailsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/booking/:parkingId"
          element={
            <ProtectedRoute allowedRoles={['driver']}>
              <BookingCheckoutPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Driver Workspace (Dashboard Layout) */}
      <Route
        path="/driver"
        element={
          <ProtectedRoute allowedRoles={['driver']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<DriverDashboardPage />} />
        <Route path="bookings" element={<MyBookingsPage />} />
        <Route path="bookings/:id" element={<DriverBookingDetailPage />} />
        <Route path="profile" element={<DriverProfilePage />} />
      </Route>

      {/* Owner Workspace (Dashboard Layout) */}
      <Route
        path="/owner"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<OwnerDashboardPage />} />
        <Route path="listings" element={<ManageListingsPage />} />
        <Route path="listings/new" element={<AddEditListingPage />} />
        <Route path="listings/edit/:id" element={<AddEditListingPage />} />
        <Route path="bookings" element={<OwnerBookingsPage />} />
        <Route path="scanner" element={<OwnerScannerPage />} />
        <Route path="profile" element={<OwnerProfilePage />} />
      </Route>

      {/* Administrator Workspace (Dashboard Layout) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="listings" element={<AdminListingsPage />} />
        <Route path="bookings" element={<AdminBookingsPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
        <Route path="profile" element={<AdminProfilePage />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
