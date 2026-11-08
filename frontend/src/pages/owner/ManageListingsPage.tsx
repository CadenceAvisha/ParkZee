import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { parkingService } from '../../services/parking.service';
import { ParkingLocation } from '../../types/parking.types';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { useNotification } from '../../context/NotificationContext';
import {
  Building,
  PlusCircle,
  MapPin,
  Clock,
  Car,
  Edit,
  Eye,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';

export const ManageListingsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const [locations, setLocations] = useState<ParkingLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const list = await parkingService.getOwnerListings(user.id);
        setLocations(list);
      } catch (err) {
        showToast('error', 'Error', 'Failed to load your parking listings.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchListings();
  }, [user, showToast]);

  const renderStatusBadge = (status: ParkingLocation['verificationStatus']) => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="emerald" dot>
            Approved & Live
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="amber" dot>
            Pending Admin Review
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="rose" dot>
            Rejected
          </Badge>
        );
      case 'suspended':
        return (
          <Badge variant="slate" dot>
            Suspended
          </Badge>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Manage Parking Locations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure hourly rates, total slot capacity, operating hours, and track listing verification.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<PlusCircle className="w-4 h-4" />}
          onClick={() => navigate('/owner/listings/new')}
        >
          Add Parking Location
        </Button>
      </div>

      {isLoading ? (
        <LoadingSkeleton count={3} className="h-44 w-full" />
      ) : locations.length === 0 ? (
        <EmptyState
          icon={Building}
          title="No Parking Spaces Listed"
          description="Register your driveway, commercial garage, or private parking bay to start earning."
          actionText="Add Your First Parking Space"
          onAction={() => navigate('/owner/listings/new')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {locations.map((loc) => (
            <Card key={loc.id} className="overflow-hidden flex flex-col justify-between">
              <div>
                <div className="h-44 w-full bg-slate-100 relative overflow-hidden">
                  <img
                    src={loc.photos[0] || 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=600&q=80'}
                    alt={loc.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">{renderStatusBadge(loc.verificationStatus)}</div>
                  <div className="absolute bottom-3 right-3 bg-slate-900/90 text-white font-bold text-xs px-2.5 py-1 rounded-lg backdrop-blur-xs">
                    ₹{loc.pricePerHour}/hr
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{loc.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {loc.address}, {loc.city}
                    </p>
                  </div>

                  {loc.verificationStatus === 'pending' && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        Under administrative review. Once approved, this listing will be bookable by all drivers.
                      </span>
                    </div>
                  )}

                  {loc.verificationStatus === 'rejected' && (
                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Listing Rejected:</strong> {loc.rejectionReason || 'Incomplete address specifications.'}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 block font-medium">Slots / Capacity:</span>
                      <span className="font-bold text-slate-800">
                        {loc.availableCapacity} / {loc.totalCapacity} available
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Structure:</span>
                      <span className="font-bold text-slate-800 capitalize">{loc.parkingType}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <Link
                  to={`/parking/${loc.id}`}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> Public Preview
                </Link>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<Edit className="w-3.5 h-3.5" />}
                    onClick={() => navigate(`/owner/listings/edit/${loc.id}`)}
                  >
                    Edit Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
