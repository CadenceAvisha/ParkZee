import mongoose, { Document, Schema, Model } from 'mongoose';

export type ReportTargetType = 'parking_location' | 'booking' | 'user' | 'payment_dispute';
export type ReportStatus = 'pending' | 'in_review' | 'resolved' | 'dismissed';

export interface IReport extends Document {
  reportReference: string;
  reportedBy: {
    id: mongoose.Types.ObjectId;
    name: string;
    role: string;
    email: string;
  };
  targetType: ReportTargetType;
  targetId: string;
  targetTitle: string;
  reason: string;
  description: string;
  status: ReportStatus;
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    reportReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    reportedBy: {
      id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      name: { type: String, required: true },
      role: { type: String, required: true },
      email: { type: String, required: true },
    },
    targetType: {
      type: String,
      enum: ['parking_location', 'booking', 'user', 'payment_dispute'],
      required: true,
      index: true,
    },
    targetId: {
      type: String,
      required: true,
      index: true,
    },
    targetTitle: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_review', 'resolved', 'dismissed'],
      default: 'pending',
      index: true,
    },
    resolutionNotes: {
      type: String,
    },
    resolvedBy: {
      type: String,
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const ReportModel: Model<IReport> = mongoose.model<IReport>(
  'Report',
  reportSchema
);
