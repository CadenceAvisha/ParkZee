import React, { useState } from 'react';
import { Booking, PaymentMethod } from '../../types/booking.types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { paymentService } from '../../services/payment.service';
import { ShieldCheck, Banknote, QrCode, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DirectPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onPaymentConfirmed: (updatedBooking: Booking) => void;
}

export const DirectPaymentModal: React.FC<DirectPaymentModalProps> = ({
  isOpen,
  onClose,
  booking,
  onPaymentConfirmed,
}) => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [amountReceived, setAmountReceived] = useState<number>(booking?.totalAmount || 0);
  const [notes, setNotes] = useState<string>('');
  const [confirmedByOwner, setConfirmedByOwner] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);

  // Sync amount when booking opens
  React.useEffect(() => {
    if (booking) {
      setAmountReceived(booking.totalAmount);
      setConfirmedByOwner(false);
      setShowConfirmDialog(false);
    }
  }, [booking]);

  if (!booking) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmedByOwner) {
      showToast('error', 'Confirmation Required', 'You must verify receipt of payment from the driver.');
      return;
    }
    setShowConfirmDialog(true);
  };

  const executeConfirmation = async () => {
    setIsSubmitting(true);
    try {
      const res = await paymentService.confirmDirectPayment(
        user?.id || 'usr-owner-1',
        user?.name || 'Parking Owner',
        {
          bookingId: booking.id,
          paymentMethod,
          amountReceived: Number(amountReceived),
          notes,
        }
      );

      showToast(
        'success',
        'Direct Payment Confirmed',
        `Booking ${booking.bookingReference} is now confirmed. Entry QR code is active for the driver.`
      );
      onPaymentConfirmed(res.booking);
      setShowConfirmDialog(false);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to confirm payment';
      showToast('error', 'Confirmation Error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Direct Payment Receipt"
      description="The application records your confirmation of direct settlement received from the driver."
      maxWidth="lg"
    >
      {showConfirmDialog ? (
        <div className="space-y-4 py-2">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <p className="font-semibold mb-1">Final Attestation Confirmation</p>
              Are you sure you have received <span className="font-bold">₹{amountReceived}</span> via{' '}
              <span className="font-bold uppercase">{paymentMethod}</span> for reservation{' '}
              <span className="font-mono font-bold">{booking.bookingReference}</span>?
              <p className="mt-1 text-amber-700">
                Once confirmed, the driver's QR entry code will be activated and your confirmation will be permanently recorded in the audit trail.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={isSubmitting}
              onClick={() => setShowConfirmDialog(false)}
            >
              Back to Edit
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
              onClick={executeConfirmation}
            >
              Confirm & Activate QR
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reservation Summary Banner */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Reservation Ref</span>
              <span className="font-mono font-bold text-slate-900">{booking.bookingReference}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Driver & Vehicle</span>
              <span className="font-semibold text-slate-900 truncate block">
                {booking.driverName} ({booking.vehicleDetails.plateNumber})
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Total Booking Amount</span>
              <span className="font-bold text-base text-slate-900">₹{booking.totalAmount}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Reserved Duration</span>
              <span className="text-slate-700 font-medium">{booking.durationHours} hours</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Payment Method Received *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                  paymentMethod === 'upi'
                    ? 'border-brand-500 bg-brand-50/80 text-brand-800 ring-2 ring-brand-200'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <QrCode className="w-5 h-5 mb-1 text-brand-600" />
                <span>UPI / QR Scan</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-brand-500 bg-brand-50/80 text-brand-800 ring-2 ring-brand-200'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-5 h-5 mb-1 text-emerald-600" />
                <span>Cash on Arrival</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                  paymentMethod === 'bank_transfer'
                    ? 'border-brand-500 bg-brand-50/80 text-brand-800 ring-2 ring-brand-200'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck className="w-5 h-5 mb-1 text-blue-600" />
                <span>Bank / Other</span>
              </button>
            </div>
          </div>

          {/* Amount Received Input */}
          <Input
            label="Amount Received (₹)"
            type="number"
            min={1}
            value={amountReceived}
            onChange={(e) => setAmountReceived(Number(e.target.value))}
            required
            helperText={`Agreed parking fee is ₹${booking.totalAmount}.`}
          />

          {/* Optional Reference Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Reference / Note (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. UPI Ref #40889212 or cash handed to attendant Amit"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-brand-200 focus:border-brand-500 focus:outline-none"
            />
          </div>

          {/* Attestation Checkbox */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmedByOwner}
                onChange={(e) => setConfirmedByOwner(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500"
                required
              />
              <span className="text-xs text-slate-700 leading-snug">
                I confirm that I have physically or digitally received the payment of{' '}
                <span className="font-bold">₹{amountReceived}</span> from driver{' '}
                <span className="font-semibold">{booking.driverName}</span>.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!confirmedByOwner}
              leftIcon={<ShieldCheck className="w-4 h-4" />}
            >
              Verify & Record
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
