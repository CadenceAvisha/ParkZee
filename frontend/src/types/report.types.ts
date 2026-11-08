export type ReportTargetType = 'parking_location' | 'booking' | 'user' | 'payment_dispute';

export type ReportStatus = 'pending' | 'in_review' | 'resolved' | 'dismissed';

export interface Report {
  id: string;
  reportReference: string;
  reportedBy: {
    id: string;
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
  createdAt: string;
  resolvedAt?: string;
}
