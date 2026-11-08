import React, { useState, useEffect } from 'react';
import { parkingService } from '../../services/parking.service';
import { ParkingLocation, ListingVerificationStatus } from '../../types/parking.types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { useNotification } from '../../context/NotificationContext';
import {
  MapPin,
  CheckCircle2,
  XCircle,
  Eye,
  ShieldCheck,
  AlertOctagon,
  Clock,
  Car,
} from 'lucide-react';

export const AdminListingsPage: React.FC = () => {
  const { showToast } = useNotification();
  const [listings, setListings] = useState<ParkingLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Rejection modal
  const [rejectingListing, setRejectingListing] = useState<ParkingLocation | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadListings = async () => {
    setIsLoading(true);
    try {
      const data = await parkingService.getAllListings();
      setListings(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  const handleApprove = async (listing: ParkingLocation) => {
    try {
      const updated = await parkingService.updateListingVerificationStatus(listing.id, 'approved');
      setListings((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      showToast('success', 'Listing Approved', `"${listing.name}" is now live and bookable by drivers.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Approval failed';
      showToast('error', 'Error', msg);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingListing || !rejectionReason.trim()) return;

    setIsSubmitting(true);
    try {
      const updated = await parkingService.updateListingVerificationStatus(
        rejectingListing.id,
        'rejected',
        rejectionReason.trim()
      );
      setListings((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      showToast('info', 'Listing Rejected', `"${rejectingListing.name}" was rejected.`);
      setRejectingListing(null);
      setRejectionReason('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Rejection failed';
      showToast('error', 'Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredListings = listings.filter((l) => {
    if (filterTab === 'pending') return l.verificationStatus === 'pending';
    if (filterTab === 'approved') return l.verificationStatus === 'approved';
    if (filterTab === 'rejected') return l.verificationStatus === 'rejected';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Parking Listing Approvals & Quality Control
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review host submissions, verify accurate geographical coordinates, and approve spaces for public discovery.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setFilterTab('all')}
          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
            filterTab === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Listings ({listings.length})
        </button>
        <button
          onClick={() => setFilterTab('pending')}
          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
            filterTab === 'pending'
              ? 'bg-amber-600 text-white'
              : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
          }`}
        >
          <span>Pending Approvals</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
            {listings.filter((l) => l.verificationStatus === 'pending').length}
          </span>
        </button>
        <button
          onClick={() => setFilterTab('approved')}
          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
            filterTab === 'approved' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Approved Live ({listings.filter((l) => l.verificationStatus === 'approved').length})
        </button>
        <button
          onClick={() => setFilterTab('rejected')}
          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
            filterTab === 'rejected' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Rejected ({listings.filter((l) => l.verificationStatus === 'rejected').length})
        </button>
      </div>

      {/* Listings Table / Cards */}
      {isLoading ? (
        <LoadingSkeleton count={3} className="h-28 w-full" />
      ) : filteredListings.length === 0 ? (
        <Card className="p-12 text-center text-xs text-slate-500">
          No parking spaces in this review status category.
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredListings.map((item) => (
            <Card key={item.id} className="p-5 hoverable">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <img
                    src={item.photos[0]}
                    alt=""
                    className="w-20 h-20 rounded-xl object-cover shrink-0 bg-slate-100 border border-slate-200"
                  />
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">{item.name}</span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          item.verificationStatus === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : item.verificationStatus === 'pending'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {item.verificationStatus}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {item.address}, {item.city} (Lat: {item.location.latitude.toFixed(4)}, Lng:{' '}
                      {item.location.longitude.toFixed(4)})
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
                      <span>
                        Host: <strong>{item.ownerName || item.ownerId}</strong>
                      </span>
                      <span>
                        Capacity: <strong>{item.totalCapacity} slots</strong>
                      </span>
                      <span>
                        Rate: <strong>₹{item.pricePerHour}/hr</strong>
                      </span>
                      <span className="capitalize">
                        Structure: <strong>{item.parkingType}</strong>
                      </span>
                    </div>

                    {item.rejectionReason && (
                      <p className="text-xs text-rose-600 font-medium pt-1">
                        Rejection Reason: {item.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  {item.verificationStatus !== 'approved' && (
                    <Button
                      size="sm"
                      variant="primary"
                      leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      onClick={() => handleApprove(item)}
                    >
                      Approve Listing
                    </Button>
                  )}

                  {item.verificationStatus !== 'rejected' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-rose-600 hover:bg-rose-50 border-rose-200"
                      leftIcon={<XCircle className="w-3.5 h-3.5" />}
                      onClick={() => {
                        setRejectingListing(item);
                        setRejectionReason('');
                      }}
                    >
                      Reject with Reason
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Listing Modal */}
      <Modal
        isOpen={Boolean(rejectingListing)}
        onClose={() => setRejectingListing(null)}
        title="Reject Parking Listing"
        description="Provide a clear reason explaining why this parking location cannot be approved."
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Rejection Reason *
            </label>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Coordinates placed in middle of roadway, or blurry property photos..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-rose-200 focus:border-rose-500 focus:outline-none"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRejectingListing(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              isLoading={isSubmitting}
              disabled={!rejectionReason.trim()}
            >
              Submit Rejection
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
