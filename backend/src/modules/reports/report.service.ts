import mongoose from 'mongoose';
import { ReportModel, ReportStatus, ReportTargetType } from './report.model.js';
import { AppError } from '../../middleware/errorHandler.js';

export class ReportService {
  async createReport(
    reporter: { id: string; name: string; role: string; email: string },
    data: {
      targetType: ReportTargetType;
      targetId: string;
      targetTitle: string;
      reason: string;
      description: string;
    }
  ): Promise<any> {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const reportReference = `RPT-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;

    const report = await ReportModel.create({
      reportReference,
      reportedBy: {
        id: new mongoose.Types.ObjectId(reporter.id),
        name: reporter.name,
        role: reporter.role,
        email: reporter.email,
      },
      targetType: data.targetType,
      targetId: data.targetId,
      targetTitle: data.targetTitle,
      reason: data.reason,
      description: data.description,
      status: 'pending',
    });

    return report.toJSON();
  }

  async getAllReports(status?: ReportStatus): Promise<any[]> {
    const query: Record<string, any> = {};
    if (status) query.status = status;

    const reports = await ReportModel.find(query).sort({ createdAt: -1 }).lean();
    return reports.map((r: any) => ({
      ...r,
      id: r._id.toString(),
    }));
  }

  async resolveReport(
    reportId: string,
    adminName: string,
    status: ReportStatus,
    resolutionNotes: string
  ): Promise<any> {
    const report = await ReportModel.findById(reportId);
    if (!report) {
      throw new AppError('Report ticket not found.', 404);
    }

    report.status = status;
    report.resolutionNotes = resolutionNotes;
    report.resolvedBy = adminName;
    report.resolvedAt = new Date();

    await report.save();
    return report.toJSON();
  }
}

export const reportService = new ReportService();
