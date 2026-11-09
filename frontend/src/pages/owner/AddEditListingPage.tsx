import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { parkingListingSchema, ParkingListingFormData } from '../../schemas/parking.schema';
import { parkingService } from '../../services/parking.service';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { LocationPickerMap } from '../../components/maps/LocationPickerMap';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { VehicleType } from '../../types/user.types';
import { ParkingType } from '../../types/parking.types';
import {
  Building,
  MapPin,
  Clock,
  Car,
  Image as ImageIcon,
  CheckCircle2,
  ChevronLeft,
  DollarSign,
  Plus,
  Trash2,
} from 'lucide-react';

export const AddEditListingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoInput, setPhotoInput] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ParkingListingFormData>({
    resolver: zodResolver(parkingListingSchema),
    defaultValues: {
      name: '',
      description: '',
      address: '',
      city: 'Gurugram',
      postalCode: '',
      latitude: 28.4986,
      longitude: 77.0878,
      parkingType: 'covered',
      supportedVehicleTypes: ['car', 'suv'],
      totalCapacity: 10,
      pricePerHour: 50,
      is24x7: true,
      openTime: '06:00',
      closeTime: '23:00',
      openDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      amenities: ['CCTV Surveillance', 'Security Guard', 'Covered Roof'],
      photos: [
        'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=900&q=80',
      ],
    },
  });

  const watchedLat = watch('latitude');
  const watchedLng = watch('longitude');
  const watchedPhotos = watch('photos') || [];
  const watchedAmenities = watch('amenities') || [];
  const watchedVehicles = watch('supportedVehicleTypes') || [];
  const watchedIs24x7 = watch('is24x7');

  // Load listing if editing
  useEffect(() => {
    if (isEditing && id) {
      const loadListing = async () => {
        const item = await parkingService.getParkingById(id);
        if (item) {
          reset({
            name: item.name,
            description: item.description,
            address: item.address,
            city: item.city,
            postalCode: item.postalCode || '',
            latitude: item.location.latitude,
            longitude: item.location.longitude,
            parkingType: item.parkingType,
            supportedVehicleTypes: item.supportedVehicleTypes,
            totalCapacity: item.totalCapacity,
            pricePerHour: item.pricePerHour,
            is24x7: item.operatingHours.is24x7,
            openTime: item.operatingHours.openTime,
            closeTime: item.operatingHours.closeTime,
            openDays: item.operatingHours.openDays,
            amenities: item.amenities,
            photos: item.photos,
          });
        }
      };
      loadListing();
    }
  }, [isEditing, id, reset]);

  const handleCoordsChange = (coords: { latitude: number; longitude: number }) => {
    setValue('latitude', coords.latitude);
    setValue('longitude', coords.longitude);
  };

  const handleToggleAmenity = (amenity: string) => {
    if (watchedAmenities.includes(amenity)) {
      setValue(
        'amenities',
        watchedAmenities.filter((a) => a !== amenity)
      );
    } else {
      setValue('amenities', [...watchedAmenities, amenity]);
    }
  };

  const handleToggleVehicle = (v: VehicleType) => {
    if (watchedVehicles.includes(v)) {
      setValue(
        'supportedVehicleTypes',
        watchedVehicles.filter((t) => t !== v)
      );
    } else {
      setValue('supportedVehicleTypes', [...watchedVehicles, v]);
    }
  };

  const handleAddPhoto = () => {
    if (!photoInput.trim()) return;
    setValue('photos', [...watchedPhotos, photoInput.trim()]);
    setPhotoInput('');
  };

  const handleRemovePhoto = (index: number) => {
    setValue(
      'photos',
      watchedPhotos.filter((_, i) => i !== index)
    );
  };

  const onSubmit = async (data: ParkingListingFormData) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      if (isEditing && id) {
        await parkingService.updateListing(id, {
          name: data.name,
          description: data.description,
          address: data.address,
          city: data.city,
          postalCode: data.postalCode,
          latitude: data.latitude,
          longitude: data.longitude,
          location: { latitude: data.latitude, longitude: data.longitude },
          parkingType: data.parkingType,
          supportedVehicleTypes: data.supportedVehicleTypes,
          totalCapacity: data.totalCapacity,
          pricePerHour: data.pricePerHour,
          operatingHours: {
            openTime: data.openTime,
            closeTime: data.closeTime,
            is24x7: data.is24x7,
            openDays: data.openDays,
          },
          amenities: data.amenities,
          photos: data.photos,
        });
        showToast('success', 'Listing Updated', 'Parking details saved successfully.');
      } else {
        await parkingService.createListing(user.id, user.name, data);
        showToast(
          'success',
          'Listing Submitted for Review',
          'Your parking listing has been submitted for admin verification.'
        );
      }
      navigate('/owner/listings');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save listing';
      showToast('error', 'Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const ALL_AMENITIES = [
    'CCTV Surveillance',
    '24/7 Security Guard',
    'Covered Roof',
    'EV Fast Charging',
    'Disabled Access',
    'Elevator Access',
    'Water Wash Available',
    'Paved Surface',
    'Gated Entry',
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <button
          onClick={() => navigate('/owner/listings')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-3"
        >
          <ChevronLeft className="w-4 h-4" /> Back to My Listings
        </button>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          {isEditing ? 'Edit Parking Facility' : 'Register New Parking Location'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Provide accurate location coordinates, capacity, pricing, and operating rules.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Section 1: Facility Basics */}
        <Card className="p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">1. Basic Facility Information</h3>
            <p className="text-xs text-slate-500">Name and comprehensive description for drivers</p>
          </div>

          <Input
            label="Parking Facility Name"
            placeholder="e.g. Cyber City Commercial Valet & Parking"
            error={errors.name?.message}
            {...register('name')}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Description & Access Instructions *
            </label>
            <textarea
              rows={3}
              placeholder="Describe access gate, security clearance, entry landmarks, ramp incline, etc..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-brand-200 focus:border-brand-500 focus:outline-none"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-rose-600 mt-1">{errors.description.message}</p>
            )}
          </div>
        </Card>

        {/* Section 2: Precise Map Location */}
        <Card className="p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">2. Address & Exact Map Pin Coordinates</h3>
            <p className="text-xs text-slate-500">Click on the map to place the exact entrance pin for drivers</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input
                label="Street Address / Gate Access"
                placeholder="e.g. DLF Cyber City, Tower B Access Road"
                error={errors.address?.message}
                {...register('address')}
              />
            </div>
            <div>
              <Input
                label="City"
                placeholder="e.g. Gurugram"
                error={errors.city?.message}
                {...register('city')}
              />
            </div>
          </div>

          {/* Map Location Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Position Entrance Pin on Map *
            </label>
            <LocationPickerMap
              initialLat={watchedLat || 28.4986}
              initialLng={watchedLng || 77.0878}
              onChange={handleCoordsChange}
            />
          </div>
        </Card>

        {/* Section 3: Capacity, Types & Pricing */}
        <Card className="p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">3. Capacity, Vehicle Types & Pricing</h3>
            <p className="text-xs text-slate-500">Define parking structure, capacity slots, and hourly rates</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Parking Type *
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium bg-white"
                {...register('parkingType')}
              >
                <option value="covered">Covered</option>
                <option value="uncovered">Uncovered</option>
                <option value="multi-level">Multi-Level</option>
                <option value="underground">Underground / Basement</option>
                <option value="driveway">Private Driveway</option>
              </select>
            </div>

            <Input
              label="Total Slot Capacity"
              type="number"
              min={1}
              error={errors.totalCapacity?.message}
              {...register('totalCapacity', { valueAsNumber: true })}
            />

            <Input
              label="Price per Hour (₹)"
              type="number"
              min={1}
              error={errors.pricePerHour?.message}
              {...register('pricePerHour', { valueAsNumber: true })}
            />
          </div>

          {/* Supported Vehicle Types */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Supported Vehicles *
            </label>
            <div className="flex flex-wrap gap-2">
              {(['car', 'suv', 'motorcycle', 'ev', 'truck'] as VehicleType[]).map((v) => {
                const isSelected = watchedVehicles.includes(v);
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => handleToggleVehicle(v)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50 text-brand-800 ring-1 ring-brand-300'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Car className="w-3.5 h-3.5" />
                    <span className="capitalize">{v}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Section 4: Operating Hours */}
        <Card className="p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">4. Operating Hours & Schedule</h3>
            <p className="text-xs text-slate-500">Configure when drivers are allowed to park</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                {...register('is24x7')}
              />
              <span>Open 24 Hours / 7 Days a Week</span>
            </label>
          </div>

          {!watchedIs24x7 && (
            <div className="grid grid-cols-2 gap-4">
              <Input label="Opening Time" type="time" {...register('openTime')} />
              <Input label="Closing Time" type="time" {...register('closeTime')} />
            </div>
          )}
        </Card>

        {/* Section 5: Amenities */}
        <Card className="p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">5. Amenities & Facilities</h3>
            <p className="text-xs text-slate-500">Select security and convenience features available</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {ALL_AMENITIES.map((amenity) => {
              const isSelected = watchedAmenities.includes(amenity);
              return (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => handleToggleAmenity(amenity)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs text-left font-medium transition-all ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50 text-brand-800 font-semibold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 ${isSelected ? 'text-brand-600' : 'text-slate-300'}`}
                  />
                  <span>{amenity}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Section 6: Photos */}
        <Card className="p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">6. Parking Images</h3>
            <p className="text-xs text-slate-500">Add clear photo URLs of your parking area and entrance</p>
          </div>

          <div className="flex gap-2">
            <input
              type="url"
              value={photoInput}
              onChange={(e) => setPhotoInput(e.target.value)}
              placeholder="Paste photo image URL (e.g. https://...)"
              className="flex-1 px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleAddPhoto}
            >
              Add URL
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {watchedPhotos.map((photo, i) => (
              <div key={i} className="relative rounded-xl overflow-hidden h-28 border border-slate-200 group">
                <img src={photo} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(i)}
                  className="absolute top-2 right-2 p-1 bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Button type="button" variant="outline" size="lg" onClick={() => navigate('/owner/listings')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="lg" isLoading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Submit Listing for Verification'}
          </Button>
        </div>
      </form>
    </div>
  );
};
