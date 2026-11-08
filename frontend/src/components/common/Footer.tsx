import React from 'react';
import { Link } from 'react-router-dom';
import { Car, ShieldCheck, HeartHandshake, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white">
                <Car className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Park<span className="text-brand-400">Zee</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Commercial-grade smart parking discovery and direct reservation marketplace. Connects drivers with vetted parking facilities with zero payment gateway intermediaries.
            </p>
            <div className="flex items-center gap-2 text-xs text-brand-400 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Direct Driver-to-Owner Settlement. Pay upon arrival.</span>
            </div>
          </div>

          {/* Quick links for Drivers */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">
              For Drivers
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/search" className="hover:text-white transition-colors">
                  Find & Compare Parking
                </Link>
              </li>
              <li>
                <Link to="/driver/bookings" className="hover:text-white transition-colors">
                  Active Reservations
                </Link>
              </li>
              <li>
                <Link to="/driver/dashboard" className="hover:text-white transition-colors">
                  Driver Dashboard
                </Link>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  How Direct Booking Works
                </a>
              </li>
            </ul>
          </div>

          {/* Quick links for Owners */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">
              For Parking Owners
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/owner/listings/new" className="hover:text-white transition-colors">
                  List Your Space
                </Link>
              </li>
              <li>
                <Link to="/owner/dashboard" className="hover:text-white transition-colors">
                  Owner Management Portal
                </Link>
              </li>
              <li>
                <Link to="/owner/bookings" className="hover:text-white transition-colors">
                  Direct Payment Approvals
                </Link>
              </li>
              <li>
                <Link to="/owner/scanner" className="hover:text-white transition-colors">
                  QR Scanner App
                </Link>
              </li>
            </ul>
          </div>

          {/* Direct Settlement & Compliance */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">
              Direct Settlement Policy
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              ParkZee does not process online credit card transactions. Drivers pay owners directly in cash, UPI, or local transfer. Entry QR codes activate immediately upon owner confirmation.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <HeartHandshake className="w-4 h-4 text-brand-400" />
              <span>100% Retained Revenue for Property Owners</span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} ParkZee Marketplace. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-400" /> OpenStreetMap & Leaflet Powered
            </span>
            <span className="text-slate-400">Enterprise Verified</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
