import mongoose, { Document, Schema, Model } from 'mongoose';
import {
  ParkingType,
  VehicleType,
  ListingVerificationStatus,
  OperatingHours,
  GeoJSONPoint,
} from '../../types/index.js';

export interface IParkingLocation extends Document {
  ownerId: mongoose.Types.ObjectId;
  ownerName?: string;
  ownerPhone?: string;
  name: string;
  description: string;
  address: string;
  city: string;
  postalCode?: string;
  location: GeoJSONPoint;
  entranceLocation?: GeoJSONPoint;
  supportedVehicleTypes: VehicleType[];
  parkingType: ParkingType;
  totalCapacity: number;
  availableCapacity: number;
  pricePerHour: number;
  pricingUnit: 'hour' | 'day';
  operatingHours: OperatingHours;
  amenities: string[];
  photos: string[];
  verificationStatus: ListingVerificationStatus;
  rejectionReason?: string;
  isActive: boolean;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const parkingLocationSchema = new Schema<IParkingLocation>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ownerName: {
      type: String,
      trim: true,
    },
    ownerPhone: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Parking facility name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    address: {
      type: String,
      required: [true, 'Street address is required'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      index: true,
    },
    postalCode: {
      type: String,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        validate: {
          validator: (coordinates: number[]) => Array.isArray(coordinates) && coordinates.length === 2 && Number.isFinite(coordinates[0]) && Number.isFinite(coordinates[1]) && Math.abs(coordinates[0]) <= 180 && Math.abs(coordinates[1]) <= 90,
          message: 'Location coordinates must be [longitude, latitude] within valid ranges.',
        },
      },
    },
    entranceLocation: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
      },
    },
    supportedVehicleTypes: {
      type: [String],
      enum: Object.values(VehicleType),
      default: [VehicleType.CAR, VehicleType.SUV],
    },
    parkingType: {
      type: String,
      enum: Object.values(ParkingType),
      required: true,
    },
    totalCapacity: {
      type: Number,
      required: true,
      min: [1, 'Capacity must be at least 1 slot'],
    },
    availableCapacity: {
      type: Number,
      required: true,
      min: 0,
    },
    pricePerHour: {
      type: Number,
      required: true,
      min: [1, 'Hourly price must be at least 1'],
    },
    pricingUnit: {
      type: String,
      enum: ['hour', 'day'],
      default: 'hour',
    },
    operatingHours: {
      openTime: { type: String, default: '00:00' },
      closeTime: { type: String, default: '23:59' },
      is24x7: { type: Boolean, default: true },
      openDays: {
        type: [String],
        default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      },
    },
    amenities: {
      type: [String],
      default: [],
    },
    photos: {
      type: [String],
      default: [],
    },
    verificationStatus: {
      type: String,
      enum: Object.values(ListingVerificationStatus),
      default: ListingVerificationStatus.PENDING,
      index: true,
    },
    rejectionReason: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        // Convert GeoJSON [longitude, latitude] to { latitude, longitude } for frontend compatibility
        if (ret.location?.coordinates) {
          ret.location = {
            latitude: ret.location.coordinates[1],
            longitude: ret.location.coordinates[0],
          };
        }
        if (ret.entranceLocation?.coordinates) {
          ret.entranceLocation = {
            latitude: ret.entranceLocation.coordinates[1],
            longitude: ret.entranceLocation.coordinates[0],
          };
        }
        delete ret.__v;
        return ret;
      },
    },
  }
);

// 2dsphere index for real geospatial queries
parkingLocationSchema.index({ location: '2dsphere' });
parkingLocationSchema.index({ verificationStatus: 1, isActive: 1 });

export const ParkingLocationModel: Model<IParkingLocation> =
  mongoose.model<IParkingLocation>('ParkingLocation', parkingLocationSchema);
