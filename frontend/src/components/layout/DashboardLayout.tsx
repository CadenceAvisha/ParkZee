import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ToastContainer } from '../common/Toast';
import {
  Car,
  Compass,
  Calendar,
  UserCheck,
  Building,
  PlusCircle,
  DollarSign,
  QrCode,
  Shield,
  Users,
  BarChart3,
  LogOut,
  ChevronRight,
  Menu,
  X,
  MapPin,
  Clock,
  AlertOctagon,
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { user, role, logout, switchDemoRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/driver/dashboard' || path === '/owner/dashboard' || path === '/admin/dashboard') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Nav items per role
  const driverNav = [
    { name: 'Dashboard Overview', path: '/driver/dashboard', icon: Car },
    { name: 'Search & Book Parking', path: '/search', icon: Compass },
    { name: 'My Reservations', path: '/driver/bookings', icon: Calendar },
    { name: 'Driver Profile & Vehicles', path: '/driver/profile', icon: UserCheck },
  ];

  const ownerNav = [
    { name: 'Owner Overview', path: '/owner/dashboard', icon: Building },
    { name: 'Manage Parking Listings', path: '/owner/listings', icon: MapPin },
    { name: 'Add New Parking', path: '/owner/listings/new', icon: PlusCircle },
    { name: 'Bookings & Direct Payments', path: '/owner/bookings', icon: DollarSign },
    { name: 'QR Entry & Checkout Scanner', path: '/owner/scanner', icon: QrCode },
    { name: 'Owner Profile & Settings', path: '/owner/profile', icon: UserCheck },
  ];

  const adminNav = [
    { name: 'Admin Overview', path: '/admin/dashboard', icon: Shield },
    { name: 'Listing Approvals', path: '/admin/listings', icon: MapPin },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Platform Bookings', path: '/admin/bookings', icon: Calendar },
    { name: 'Disputes & Reports', path: '/admin/reports', icon: AlertOctagon },
    { name: 'Analytics & Trends', path: '/admin/analytics', icon: BarChart3 },
  ];

  const currentNav = role === 'admin' ? adminNav : role === 'owner' ? ownerNav : driverNav;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Mobile Top Header */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
            <Car className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-900 tracking-tight">
            Park<span className="text-brand-600">Zee</span>
          </span>
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col justify-between ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-0 hidden lg:flex'
        }`}
      >
        <div>
          {/* Logo */}
          <div className="p-6 border-b border-slate-800">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold text-white tracking-tight">
                  Park<span className="text-brand-400">Zee</span>
                </span>
                <span className="block text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                  {role} Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Role Switching Shortcut for rapid demonstration */}
          <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-950/40">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
              <span>View Mode</span>
              <span className="text-[9px] text-brand-400 font-mono">Instant Switch</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => {
                  switchDemoRole('driver');
                  navigate('/driver/dashboard');
                }}
                className={`text-[11px] py-1 rounded font-medium transition-colors ${
                  role === 'driver' ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Driver
              </button>
              <button
                type="button"
                onClick={() => {
                  switchDemoRole('owner');
                  navigate('/owner/dashboard');
                }}
                className={`text-[11px] py-1 rounded font-medium transition-colors ${
                  role === 'owner' ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Owner
              </button>
              <button
                type="button"
                onClick={() => {
                  switchDemoRole('admin');
                  navigate('/admin/dashboard');
                }}
                className={`text-[11px] py-1 rounded font-medium transition-colors ${
                  role === 'admin' ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="px-3 py-4 space-y-1">
            {currentNav.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? 'bg-brand-600/90 text-white shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </div>
                  {active && <ChevronRight className="w-3.5 h-3.5 text-brand-200" />}
                </Link>
              );
            })}
          </div>
        </div>

        {/* User Card & Logout in Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3 mb-3">
            <img
              src={
                user?.avatarUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=10b981&color=fff`
              }
              alt={user?.name || 'User'}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors border border-slate-800"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="hidden lg:flex bg-white border-b border-slate-200 h-16 items-center justify-between px-8">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="capitalize">{role} Portal</span>
            <span>/</span>
            <span className="font-semibold text-slate-900 capitalize">
              {location.pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/search"
              className="text-xs font-medium text-brand-700 hover:text-brand-800 flex items-center gap-1.5 bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-200"
            >
              <Compass className="w-3.5 h-3.5" />
              Live Parking Map
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Offline Direct Settlement Mode</span>
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  );
};
