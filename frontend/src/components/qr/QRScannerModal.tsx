import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { qrService } from '../../services/qr.service';
import { QRScanVerificationResult } from '../../types/payment.types';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal';
import { useNotification } from '../../context/NotificationContext';
import {
  Camera,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  LogIn,
  LogOut,
  Car,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownerParkingId?: string;
  onCheckActionComplete?: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  ownerParkingId,
  onCheckActionComplete,
}) => {
  const { showToast } = useNotification();
  const [manualToken, setManualToken] = useState('');
  const [scanning, setScanning] = useState(false);
  const [verificationResult, setVerificationResult] = useState<QRScanVerificationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'parkzee-qr-reader-viewport';

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setVerificationResult(null);
      setManualToken('');
    }
  }, [isOpen]);

  const startCamera = async () => {
    setScanning(true);
    setVerificationResult(null);
    try {
      const html5QrCode = new Html5Qrcode(scannerContainerId);
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          stopCamera();
          await handleVerify(decodedText);
        },
        () => {
          // Frame error (silenced for smooth scanning)
        }
      );
    } catch (err) {
      console.warn('Camera access denied or unavailable', err);
      showToast('info', 'Camera Not Accessible', 'Please use manual reservation code verification below.');
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current
        .stop()
        .then(() => {
          html5QrCodeRef.current?.clear();
          html5QrCodeRef.current = null;
        })
        .catch(() => {})
        .finally(() => setScanning(false));
    }
  };

  const handleVerify = async (token: string) => {
    if (!token.trim()) return;
    setIsProcessing(true);
    try {
      const result = await qrService.verifyQRToken(token, ownerParkingId);
      setVerificationResult(result);
      if (result.valid) {
        showToast('success', 'QR Verified', result.message);
      } else {
        showToast('error', 'Verification Failed', result.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to verify QR';
      showToast('error', 'Error', msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify(manualToken);
  };

  const handleCheckIn = async (bookingId: string) => {
    setIsProcessing(true);
    try {
      await qrService.recordCheckIn(bookingId);
      showToast('success', 'Driver Checked-In', 'Vehicle entry has been officially registered.');
      if (onCheckActionComplete) onCheckActionComplete();
      // Re-verify to update state
      if (verificationResult?.booking) {
        setVerificationResult({
          ...verificationResult,
          booking: {
            ...verificationResult.booking,
            bookingStatus: 'CHECKED_IN',
            alreadyCheckedIn: true,
            checkInTime: new Date().toISOString(),
          },
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Check-in failed';
      showToast('error', 'Error', msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckOut = async (bookingId: string) => {
    setIsProcessing(true);
    try {
      await qrService.recordCheckOut(bookingId);
      showToast('success', 'Driver Checked-Out', 'Parking session completed. Capacity released.');
      if (onCheckActionComplete) onCheckActionComplete();
      setVerificationResult({
        valid: true,
        message: 'Parking session successfully completed and checked out.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Check-out failed';
      showToast('error', 'Error', msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="QR Access Verification & Scanner"
      description="Scan driver QR entry code or enter the reservation reference to record entry/exit."
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Verification Result Display */}
        {verificationResult ? (
          <div className="space-y-4">
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                verificationResult.valid
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}
            >
              {verificationResult.valid ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="text-xs">
                <h4 className="font-bold uppercase tracking-wider mb-0.5">
                  {verificationResult.valid ? 'Authorized Entry' : 'Verification Rejected'}
                </h4>
                <p className="leading-relaxed">{verificationResult.message}</p>
              </div>
            </div>

            {verificationResult.booking && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Reservation Ref:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {verificationResult.booking.bookingReference}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Driver:</span>
                    <span className="font-semibold text-slate-800">
                      {verificationResult.booking.driverName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Vehicle Plate:</span>
                    <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 inline-block">
                      {verificationResult.booking.vehiclePlate}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Payment Status:</span>
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block">
                      Owner Confirmed (₹{verificationResult.booking.amount})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Booking Status:</span>
                    <span className="font-bold text-slate-900 capitalize">
                      {verificationResult.booking.bookingStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Entry / Exit Actions */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                  {!verificationResult.booking.alreadyCheckedIn ? (
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={isProcessing}
                      leftIcon={<LogIn className="w-4 h-4" />}
                      onClick={() => handleCheckIn(verificationResult.booking!.id)}
                    >
                      Authorize Entry & Check-In
                    </Button>
                  ) : (
                    <Button
                      variant="danger"
                      size="sm"
                      isLoading={isProcessing}
                      leftIcon={<LogOut className="w-4 h-4" />}
                      onClick={() => handleCheckOut(verificationResult.booking!.id)}
                    >
                      Record Check-Out & Release Slot
                    </Button>
                  )}
                </div>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={() => {
                setVerificationResult(null);
                setManualToken('');
              }}
            >
              Scan Another Code
            </Button>
          </div>
        ) : (
          <>
            {/* Camera Viewport */}
            <div className="bg-slate-900 rounded-xl overflow-hidden min-h-[220px] relative flex flex-col items-center justify-center text-white">
              <div id={scannerContainerId} className="w-full" />
              {!scanning && (
                <div className="text-center p-6 space-y-3">
                  <Camera className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-300 max-w-xs">
                    Allow camera access to scan physical or smartphone QR codes directly.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={startCamera}
                    leftIcon={<Camera className="w-4 h-4" />}
                  >
                    Start Camera Scanner
                  </Button>
                </div>
              )}
            </div>

            {/* Manual Token Verification Section */}
            <div className="pt-2 border-t border-slate-100">
              <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Or Verify with Code Manually
              </span>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="e.g. PKZ-2026-8941 or PKZ-SEC-TOKEN..."
                  className="flex-1 px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 uppercase font-mono"
                />
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  isLoading={isProcessing}
                  disabled={!manualToken.trim()}
                >
                  Verify
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
