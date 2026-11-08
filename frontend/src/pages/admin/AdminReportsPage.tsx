import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/admin.service';
import { Report, ReportStatus } from '../../types/report.types';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { AlertOctagon, CheckCircle2, Clock, User, ShieldCheck } from 'lucide-react';

export const AdminReportsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getReports();
      setReports(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport || !resolutionNotes.trim()) return;

    setIsSubmitting(true);
    try {
      const updated = await adminService.resolveReport(
        selectedReport.id,
        'resolved',
        resolutionNotes.trim(),
        user?.id || 'admin-1'
      );
      setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      showToast('success', 'Report Resolved', 'Resolution notes recorded successfully.');
      setSelectedReport(null);
      setResolutionNotes('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resolve report';
      showToast('error', 'Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          User Reports & Dispute Resolution
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review tickets submitted regarding parking discrepancies, direct payment queries, or overstay issues.
        </p>
      </div>

      {isLoading ? (
        <LoadingSkeleton count={3} className="h-28 w-full" />
      ) : reports.length === 0 ? (
        <Card className="p-12 text-center text-xs text-slate-500">
          No reports or user disputes filed.
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id} className="p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {report.reportReference}
                    </span>
                    <Badge variant={report.status === 'resolved' ? 'emerald' : 'amber'} dot>
                      {report.status === 'resolved' ? 'Resolved' : 'Pending Investigation'}
                    </Badge>
                    <span className="text-[11px] text-slate-500 capitalize bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      Target: {report.targetType.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{report.reason}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{report.description}</p>

                  <div className="text-[11px] text-slate-400 pt-1 flex items-center gap-2">
                    <span>Filed by: {report.reportedBy.name} ({report.reportedBy.role})</span>
                    <span>•</span>
                    <span>Date: {new Date(report.createdAt).toLocaleDateString()}</span>
                  </div>

                  {report.resolutionNotes && (
                    <div className="mt-2 p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-900">
                      <strong>Resolution:</strong> {report.resolutionNotes}
                    </div>
                  )}
                </div>

                {report.status !== 'resolved' && (
                  <Button
                    size="sm"
                    variant="primary"
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    onClick={() => {
                      setSelectedReport(report);
                      setResolutionNotes('');
                    }}
                  >
                    Resolve Dispute
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Resolution Modal */}
      <Modal
        isOpen={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
        title="Record Dispute Resolution"
        description="Document how this issue was mediated and resolved."
      >
        <form onSubmit={handleResolveSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Resolution Audit Notes *
            </label>
            <textarea
              rows={3}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="e.g. Host verified that driver paid difference on site without penalty..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-brand-200 focus:border-brand-500 focus:outline-none"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedReport(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              disabled={!resolutionNotes.trim()}
            >
              Mark as Resolved
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
