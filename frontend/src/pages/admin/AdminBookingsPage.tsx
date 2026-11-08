import React, { useState, useEffect } from 'react';
import { bookingService } from '../../services/booking.service';
import { Booking } from '../../types/booking.types';
import { Card } from '../../components/common/Card';
import { BookingStatusBadge, PaymentStatusBadge } from '../../components/booking/BookingStatusBadge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Calendar, Search, Clock, MapPin, DollarSign } from 'lucide-react';

export const AdminBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const data = await bookingService.getAllBookings();
        setBookings(data);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.bookingReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.parkingName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || b.bookingStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Reservations</h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete audit ledger of all driver reservations, owner direct payment confirmations, and entry events.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Status Dropdown Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold uppercase">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 font-medium bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="all">All Statuses ({bookings.length})</option>
            <option value="RESERVED_AWAITING_OWNER_CONFIRMATION">Awaiting Payment Confirmation</option>
            <option value="CONFIRMED">Confirmed Active</option>
            <option value="CHECKED_IN">Checked In</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search booking ref, driver, parking..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <LoadingSkeleton count={4} className="h-14 w-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-4">Driver</th>
                  <th className="py-3 px-4">Parking Facility</th>
                  <th className="py-3 px-4">Schedule</th>
                  <th className="py-3 px-4">Direct Amount</th>
                  <th className="py-3 px-4">Booking Status</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4">Verification Token</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {b.bookingReference}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{b.driverName}</td>
                    <td className="py-3 px-4 text-slate-600 truncate max-w-[160px]">
                      {b.parkingName}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">₹{b.totalAmount}</td>
                    <td className="py-3 px-4">
                      <BookingStatusBadge status={b.bookingStatus} />
                    </td>
                    <td className="py-3 px-4">
                      <PaymentStatusBadge status={b.paymentStatus} />
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-500 truncate max-w-[120px]">
                      {b.verificationToken || 'Locked (Awaiting Conf.)'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
