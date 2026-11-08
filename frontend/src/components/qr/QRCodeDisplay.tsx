import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Booking } from '../../types/booking.types';
import { ShieldAlert, ShieldCheck, Lock, Clock, MapPin, AlertCircle } from 'lucide-react';
import { BookingStatusBadge, PaymentStatusBadge } from '../booking/BookingStatusBadge';

interface QRCodeDisplayProps {
  booking: Booking;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ booking }) => {
  const isPaymentConfirmed = booking.paymentStatus === 'PAID_CONFIRMED_BY_OWNER';
  const isCancelled = booking.bookingStatus === 'CANCELLED';
  const isExpired = booking.bookingStatus === 'EXPIRED';

  // Core Business Rule Check
  if (isCancelled) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h4 className="text-sm font-bold text-rose-900 mb-1">Reservation Cancelled</h4>
        <p className="text-xs text-rose-700 max-w-sm mx-auto">
          This booking has been cancelled. Entry QR code is permanently invalid and revoked.
        </p>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="bg-slate-100 border border-slate-300 rounded-2xl p-6 text-center">
        <Clock className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h4 className="text-sm font-bold text-slate-800 mb-1">Reservation Expired</h4>
        <p className="text-xs text-slate-600 max-w-sm mx-auto">
          The reserved time slot has passed. This QR code has expired.
        </p>
      </div>
    );
  }

  // Not confirmed yet: QR Code is locked
  if (!isPaymentConfirmed) {
    return (
      <div className="bg-white border-2 border-dashed border-amber-300 rounded-2xl p-6 sm:p-8 text-center shadow-subtle">
        <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto mb-4">
          <Lock className="w-8 h-8" />
        </div>

        <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-3 py-1 rounded-full mb-3">
          QR Code Locked (Awaiting Owner Confirmation)
        </span>

        <h3 className="text-base font-bold text-slate-900 mb-2">
          Direct Payment Required at Parking Location
        </h3>

        <div className="max-w-md mx-auto text-xs text-slate-600 space-y-2 mb-6 text-left bg-amber-50/70 p-4 rounded-xl border border-amber-200/60">
          <p className="flex items-start gap-2">
            <span className="font-bold text-amber-800 shrink-0">Step 1:</span>
            <span>Drive to <strong>{booking.parkingName}</strong> ({booking.parkingAddress}).</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="font-bold text-amber-800 shrink-0">Step 2:</span>
            <span>Show your Booking Ref <strong className="font-mono text-slate-900">{booking.bookingReference}</strong> to the parking owner/attendant.</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="font-bold text-amber-800 shrink-0">Step 3:</span>
            <span>Pay <strong>₹{booking.totalAmount}</strong> directly via Cash or Owner's UPI.</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="font-bold text-amber-800 shrink-0">Step 4:</span>
            <span>Once the owner confirms receipt on their device, your active Entry QR Code unlocks automatically right here!</span>
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>Status updates in real-time once confirmed.</span>
        </div>
      </div>
    );
  }

  // Active confirmed QR code
  const qrPayload = booking.verificationToken || booking.bookingReference;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 text-center shadow-premium relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />

      <div className="flex items-center justify-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold w-fit mx-auto mb-4">
        <ShieldCheck className="w-4 h-4" />
        <span>Payment Confirmed & Verified</span>
      </div>

      <h3 className="text-lg font-bold text-slate-900 mb-1">
        Official Entry Pass
      </h3>
      <p className="text-xs text-slate-500 mb-6">
        Scan this QR code at the parking gate or attendant booth for entry.
      </p>

      {/* QR Code Graphic */}
      <div className="bg-white p-4 rounded-2xl border-2 border-slate-900 shadow-md inline-block mb-4">
        <QRCodeSVG
          value={qrPayload}
          size={200}
          level="H"
          includeMargin={true}
          imageSettings={{
            src: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png',
            x: undefined,
            y: undefined,
            height: 32,
            width: 32,
            excavate: true,
          }}
        />
      </div>

      <div className="space-y-1">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
          Verification Code
        </p>
        <p className="font-mono text-sm font-bold text-slate-800 bg-slate-100 py-1 px-3 rounded-lg inline-block">
          {booking.bookingReference}
        </p>
      </div>

      {booking.paymentConfirmedAt && (
        <div className="mt-4 pt-4 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-center gap-2">
          <span>Confirmed by owner at:</span>
          <span className="font-semibold text-slate-700">
            {new Date(booking.paymentConfirmedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {booking.paymentMethod && (
            <span className="uppercase text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              {booking.paymentMethod}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
