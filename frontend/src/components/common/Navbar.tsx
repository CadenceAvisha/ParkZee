import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Compass,
  MapPin,
  Calendar,
  Shield,
  Building,
  UserCheck,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Car,
  QrCode,
  DollarSign,
  PlusCircle,
  BarChart3,
  Users,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, role, logout, switchDemoRole, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSwitchRole = async (targetRole: 'driver' | 'owner' | 'admin') => {
    await switchDemoRole(targetRole);
    navigate(`/${targetRole}/dashboard`);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <Car className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-brand-600 transition-colors">
                  Park<span className="text-brand-600">Zee</span>
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-600 -mt-1">
                  Smart Marketplace
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                to="/search"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/search')
                    ? 'text-brand-700 bg-brand-50/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                Find Parking
              </Link>

              {role === 'driver' && (
                <>
                  <Link
                    to="/driver/dashboard"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/driver/dashboard')
                        ? 'text-brand-700 bg-brand-50/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/driver/bookings"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/driver/bookings')
                        ? 'text-brand-700 bg-brand-50/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    My Bookings
                  </Link>
                </>
              )}

              {role === 'owner' && (
                <>
                  <Link
                    to="/owner/dashboard"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/owner/dashboard')
                        ? 'text-brand-700 bg-brand-50/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    Owner Portal
                  </Link>
                  <Link
                    to="/owner/listings"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/owner/listings')
                        ? 'text-brand-700 bg-brand-50/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    Listings
                  </Link>
                  <Link
                    to="/owner/bookings"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/owner/bookings')
                        ? 'text-brand-700 bg-brand-50/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    Reservations
                  </Link>
                  <Link
                    to="/owner/scanner"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/owner/scanner')
                        ? 'text-brand-700 bg-brand-50/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    QR Scanner
                  </Link>
                </>
              )}

              {role === 'admin' && (
                <>
                  <Link
                    to="/admin/dashboard"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/admin/dashboard')
                        ? 'text-brand-700 bg-brand-50/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    Admin Portal
                  </Link>
                  <Link
                    to="/admin/listings"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/admin/listings')
                        ? 'text-brand-700 bg-brand-50/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    Approvals
                  </Link>
                  <Link
                    to="/admin/users"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/admin/users')
                        ? 'text-brand-700 bg-brand-50/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    Users
                  </Link>
                  <Link
                    to="/admin/analytics"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/admin/analytics')
                        ? 'text-brand-700 bg-brand-50/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    Analytics
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Right Action Section */}
          <div className="hidden md:flex items-center gap-3">
            {/* Perspective / Demo Switcher Pill */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase px-2">Role:</span>
              <button
                type="button"
                onClick={() => handleSwitchRole('driver')}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                  role === 'driver'
                    ? 'bg-white text-brand-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Driver
              </button>
              <button
                type="button"
                onClick={() => handleSwitchRole('owner')}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                  role === 'owner'
                    ? 'bg-white text-brand-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Owner
              </button>
              <button
                type="button"
                onClick={() => handleSwitchRole('admin')}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                  role === 'admin'
                    ? 'bg-white text-brand-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Admin
              </button>
            </div>

            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-full hover:bg-slate-100 transition-colors border border-slate-200/60"
                >
                  <img
                    src={
                      user.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=10b981&color=fff`
                    }
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-brand-500/20"
                  />
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-semibold text-slate-800 leading-none">{user.name}</p>
                    <p className="text-[10px] text-slate-500 capitalize leading-none mt-1">{user.role}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-premium border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      <div className="mt-1">
                        <span className="inline-block text-[10px] font-medium bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full border border-brand-200 uppercase tracking-wider">
                          {user.role}
                        </span>
                      </div>
                    </div>

                    <Link
                      to={role === 'owner' ? '/owner/profile' : '/driver/profile'}
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    >
                      <UserCheck className="w-4 h-4 text-slate-400" />
                      Account Profile
                    </Link>

                    {role === 'owner' && (
                      <Link
                        to="/owner/listings/new"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <PlusCircle className="w-4 h-4 text-slate-400" />
                        Add New Parking
                      </Link>
                    )}

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger menu */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-500">Active View:</span>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  handleSwitchRole('driver');
                  setMobileMenuOpen(false);
                }}
                className={`text-xs px-2.5 py-1 rounded-md font-medium ${
                  role === 'driver' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Driver
              </button>
              <button
                onClick={() => {
                  handleSwitchRole('owner');
                  setMobileMenuOpen(false);
                }}
                className={`text-xs px-2.5 py-1 rounded-md font-medium ${
                  role === 'owner' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Owner
              </button>
              <button
                onClick={() => {
                  handleSwitchRole('admin');
                  setMobileMenuOpen(false);
                }}
                className={`text-xs px-2.5 py-1 rounded-md font-medium ${
                  role === 'admin' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <Link
              to="/search"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Compass className="w-4 h-4 text-slate-400" />
              Find Parking
            </Link>

            {role === 'driver' && (
              <>
                <Link
                  to="/driver/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Car className="w-4 h-4 text-slate-400" />
                  Driver Dashboard
                </Link>
                <Link
                  to="/driver/bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Calendar className="w-4 h-4 text-slate-400" />
                  My Bookings
                </Link>
              </>
            )}

            {role === 'owner' && (
              <>
                <Link
                  to="/owner/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Building className="w-4 h-4 text-slate-400" />
                  Owner Overview
                </Link>
                <Link
                  to="/owner/listings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <MapPin className="w-4 h-4 text-slate-400" />
                  Manage Listings
                </Link>
                <Link
                  to="/owner/bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  Reservations & Payments
                </Link>
                <Link
                  to="/owner/scanner"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <QrCode className="w-4 h-4 text-slate-400" />
                  QR Scanner
                </Link>
              </>
            )}

            {role === 'admin' && (
              <>
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Shield className="w-4 h-4 text-slate-400" />
                  Admin Overview
                </Link>
                <Link
                  to="/admin/listings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <MapPin className="w-4 h-4 text-slate-400" />
                  Listing Approvals
                </Link>
                <Link
                  to="/admin/users"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Users className="w-4 h-4 text-slate-400" />
                  Users Management
                </Link>
                <Link
                  to="/admin/analytics"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <BarChart3 className="w-4 h-4 text-slate-400" />
                  Analytics
                </Link>
              </>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-rose-600 font-medium"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-sm font-medium text-white bg-brand-600 rounded-lg"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
