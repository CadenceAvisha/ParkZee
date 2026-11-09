import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingService } from '../../services/booking.service';
import { reviewService } from '../../services/review.service';
import { reportService } from '../../services/report.service';
import { Booking } from '../../types/booking.types';
import { QRCodeDisplay } from '../../components/qr/QRCodeDisplay';
import { BookingStatusBadge, PaymentStatusBadge } from '../../components/booking/BookingStatusBadge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { useNotification } from '../../context/NotificationContext';
import {
  ChevronLeft,
  Calendar,
  Clock,
  Car,
  MapPin,
  ShieldCheck,
  Ban,
  Receipt,
  AlertCircle,
  Star,
  Flag,
} from 'lucide-react';

export const DriverBookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  // Review modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  // Report modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Payment Discrepancy');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await bookingService.getBookingById(id);
        setBooking(data);
      } catch (err) {
        showToast('error', 'Error', 'Failed to retrieve booking details.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBooking();
  }, [id, showToast]);

  const handleCancelBooking = async () => {
    if (!booking) return;
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;

    setIsCancelling(true);
    try {
      const updated = await bookingService.cancelBooking(booking.id, 'Cancelled by driver');
      setBooking(updated);
      showToast('info', 'Booking Cancelled', 'Your reservation was cancelled successfully.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cancellation failed';
      showToast('error', 'Error', msg);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;

    setIsSubmittingReview(true);
    try {
      await reviewService.createReview({
        bookingId: booking.id,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      setHasReviewed(true);
      setIsReviewModalOpen(false);
      showToast('success', 'Review Submitted', 'Thank you for rating your parking experience!');
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : 'Failed to submit review';
      showToast('error', 'Review Error', msg);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking || !reportDescription.trim()) return;

    setIsSubmittingReport(true);
    try {
      await reportService.createReport({
        targetType: 'booking',
        targetId: booking.id,
        targetTitle: `Reservation ${booking.bookingReference} (${booking.parkingName})`,
        reason: reportReason,
        description: reportDescription.trim(),
      });
      setIsReportModalOpen(false);
      setReportDescription('');
      showToast('success', 'Report Filed', 'Your issue has been submitted to platform moderators.');
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : 'Failed to submit report';
      showToast('error', 'Report Error', msg);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <LoadingSkeleton count={3} className="h-44 w-full" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 px-4">
        <h2 className="text-lg font-bold text-slate-900 mb-2">Booking Record Not Found</h2>
        <Button variant="primary" onClick={() => navigate('/driver/bookings')}>
          Back to My Bookings
        </Button>
      </div>
    );
  }

  const canCancel = ['RESERVED_AWAITING_OWNER_CONFIRMATION', 'CONFIRMED'].includes(
    booking.bookingStatus
  );
  const isCompleted = booking.bookingStatus === 'COMPLETED';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div>
        <button
          onClick={() => navigate('/driver/bookings')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to My Bookings
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                {booking.bookingReference}
              </span>
              <BookingStatusBadge status={booking.bookingStatus} />
              <PaymentStatusBadge status={booking.paymentStatus} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {booking.parkingName}
            </h1>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {booking.parkingAddress}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {isCompleted && !hasReviewed && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Star className="w-3.5 h-3.5 fill-current text-amber-300" />}
                onClick={() => setIsReviewModalOpen(true)}
              >
                Rate & Review
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              leftIcon={<Flag className="w-3.5 h-3.5 text-slate-500" />}
              onClick={() => setIsReportModalOpen(true)}
              className="text-slate-600 hover:bg-slate-50"
            >
              Report Issue
            </Button>

            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                isLoading={isCancelling}
                leftIcon={<Ban className="w-3.5 h-3.5 text-rose-500" />}
                onClick={handleCancelBooking}
                className="text-rose-600 hover:bg-rose-50 hover:border-rose-300"
              >
                Cancel Reservation
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Left QR Display (5 cols), Right Lifecycle & Summary (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* QR Section */}
        <div className="lg:col-span-5">
          <QRCodeDisplay booking={booking} />
        </div>

        {/* Detailed Information */}
        <div className="lg:col-span-7 space-y-5">
          {/* Timeline & Schedule */}
          <Card className="p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-600" /> Reservation Schedule
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Arrival Time:</span>
                <span className="font-semibold text-slate-800 text-sm">
                  {new Date(booking.startTime).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Departure Time:</span>
                <span className="font-semibold text-slate-800 text-sm">
                  {new Date(booking.endTime).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Total Duration:</span>
                <span className="font-bold text-slate-900">{booking.durationHours} Hours</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Entry Status:</span>
                <span className="font-bold text-slate-900">
                  {booking.checkInTime ? (
                    <span className="text-blue-600">
                      Checked In at{' '}
                      {new Date(booking.checkInTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  ) : (
                    'Not Checked In Yet'
                  )}
                </span>
              </div>
            </div>
          </Card>

          {/* Vehicle Information */}
          <Card className="p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-brand-600" /> Registered Vehicle
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Number Plate:</span>
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block text-sm">
                  {booking.vehicleDetails.plateNumber}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Make & Model:</span>
                <span className="font-semibold text-slate-800">
                  {booking.vehicleDetails.makeModel}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Category:</span>
                <span className="font-semibold text-slate-800 capitalize">
                  {booking.vehicleDetails.vehicleType}
                </span>
              </div>
            </div>
          </Card>

          {/* Payment & Audit Breakdown */}
          <Card className="p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-brand-600" /> Settlement & Direct Payment Details
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Parking Base Rate:</span>
                <span className="font-semibold text-slate-900">₹{booking.pricePerHour} / hour</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Platform Convenience Fee:</span>
                <span className="font-semibold text-emerald-600">₹0 (Free Marketplace)</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-sm font-bold text-slate-900">
                <span>Total Amount:</span>
                <span className="text-lg font-black text-brand-700">₹{booking.totalAmount}</span>
              </div>
            </div>

            {booking.paymentStatus === 'PAID_CONFIRMED_BY_OWNER' ? (
              <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Direct Payment Confirmed by Parking Host</span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Method: <strong className="uppercase">{booking.paymentMethod}</strong> | Confirmed
                  by: {booking.paymentConfirmedBy}
                </p>
                {booking.paymentNotes && (
                  <p className="text-[11px] text-emerald-800 italic">
                    Note: "{booking.paymentNotes}"
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Offline Settlement on Arrival</span>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Pay ₹{booking.totalAmount} directly to the parking owner at the location via Cash
                    or UPI. The host will record the receipt to unlock your gate QR pass.
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Review Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Rate & Review Parking Experience"
        description="Share your feedback to help fellow drivers discover great parking facilities."
      >
        <form onSubmit={handleSubmitReview} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Rating
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setReviewRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= reviewRating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm font-bold text-slate-700">
                {reviewRating} out of 5 stars
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Your Review (Optional)
            </label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="How was the parking access, security, and host communication?"
              rows={4}
              className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsReviewModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmittingReview}
            >
              Submit Review
            </Button>
          </div>
        </form>
      </Modal>

      {/* Report Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Report an Issue or Dispute"
        description="Submit a discrepancy or incident ticket regarding this reservation."
      >
        <form onSubmit={handleSubmitReport} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Reason
            </label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-500 focus:outline-none bg-white font-medium"
            >
              <option value="Payment Discrepancy">Payment Discrepancy (Host asked different amount)</option>
              <option value="Facility Inaccessible">Facility Inaccessible / Gate Locked</option>
              <option value="Overstay Fee Conflict">Overstay Fee Conflict</option>
              <option value="Vehicle Safety Concern">Vehicle Safety Concern</option>
              <option value="Incorrect Facility Details">Incorrect Facility Details</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Details & Description
            </label>
            <textarea
              required
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              placeholder="Describe what occurred with exact details..."
              rows={4}
              className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsReportModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmittingReport}
            >
              Submit Ticket
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
