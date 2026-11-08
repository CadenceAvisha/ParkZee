import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { qrService } from '../../services/qr.service';
import { QRScanVerificationResult } from '../../types/payment.types';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { useNotification } from '../../context/NotificationContext';
import {
  Camera,
  CheckCircle2,
  XCircle,
  LogIn,
  LogOut,
  RotateCcw,
  ShieldCheck,
  Clock,
  Car,
  AlertTriangle,
  StopCircle,
} from 'lucide-react';

export const OwnerScannerPage: React.FC = () => {
  const { showToast } = useNotification();
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [verificationResult, setVerificationResult] = useState<QRScanVerificationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'owner-full-qr-scanner-element';

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setIsScanning(true);
    setVerificationResult(null);
    try {
      const html5QrCode = new Html5Qrcode(readerElementId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 260, height: 260 },
        },
        async (decodedText) => {
          stopCamera();
          await handleVerifyToken(decodedText);
        },
        () => {}
      );
    } catch (err) {
      console.warn('Camera failed to initialize', err);
      showToast('info', 'Camera Not Accessible', 'Please use manual code verification below.');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (scannerRef.current) {
      scannerRef.current
        .stop()
        .then(() => {
          scannerRef.current?.clear();
          scannerRef.current = null;
        })
        .catch(() => {})
        .finally(() => setIsScanning(false));
    }
  };

  const handleVerifyToken = async (token: string) => {
    if (!token.trim()) return;
    setIsProcessing(true);
    try {
      const result = await qrService.verifyQRToken(token);
      setVerificationResult(result);
      if (result.valid) {
        showToast('success', 'Verified Successfully', result.message);
      } else {
        showToast('error', 'Verification Failed', result.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      showToast('error', 'Error', msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerifyToken(manualCode);
  };

  const handleCheckIn = async (bookingId: string) => {
    setIsProcessing(true);
    try {
      await qrService.recordCheckIn(bookingId);
      showToast('success', 'Check-In Complete', 'Driver entry officially registered.');
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
      showToast('success', 'Check-Out Finalized', 'Vehicle checkout completed and slot released.');
      setVerificationResult({
        valid: true,
        message: 'Vehicle checkout completed successfully.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Check-out failed';
      showToast('error', 'Error', msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          QR Verification & Gate Scanner
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Scan driver booking passes to authenticate entry clearance and record exit checkouts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Scanner Viewport (7 cols) */}
        <div className="md:col-span-7 space-y-4">
          <Card className="p-5 overflow-hidden">
            <div className="bg-slate-950 rounded-2xl overflow-hidden min-h-[300px] relative flex flex-col items-center justify-center text-white border border-slate-800">
              <div id={readerElementId} className="w-full" />

              {!isScanning && (
                <div className="text-center p-8 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-brand-400">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Live Camera Scanner</h3>
                    <p className="text-xs text-slate-400 max-w-xs mt-1">
                      Point camera towards the driver's active QR code on their smartphone.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={startCamera}
                    leftIcon={<Camera className="w-4 h-4" />}
                  >
                    Activate Camera
                  </Button>
                </div>
              )}

              {isScanning && (
                <div className="absolute bottom-4 z-20">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={stopCamera}
                    leftIcon={<StopCircle className="w-4 h-4" />}
                  >
                    Stop Camera
                  </Button>
                </div>
              )}
            </div>

            {/* Manual Code Fallback */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Manual Reference Verification
              </label>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. PKZ-2026-8941"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-mono uppercase focus:ring-1 focus:ring-brand-500 focus:outline-none"
                />
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  isLoading={isProcessing}
                  disabled={!manualCode.trim()}
                >
                  Verify Code
                </Button>
              </form>
            </div>
          </Card>
        </div>

        {/* Verification Result Display (5 cols) */}
        <div className="md:col-span-5 space-y-4">
          {verificationResult ? (
            <Card className="p-6 space-y-4 shadow-premium">
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  verificationResult.valid
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}
              >
                {verificationResult.valid ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-0.5">
                    {verificationResult.valid ? 'Verified Entry Ticket' : 'Entry Rejected'}
                  </h4>
                  <p className="text-xs leading-relaxed">{verificationResult.message}</p>
                </div>
              </div>

              {verificationResult.booking && (
                <div className="space-y-3 pt-2 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between border-b border-slate-200 pb-1.5">
                      <span className="text-slate-400 font-medium">Booking Ref:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {verificationResult.booking.bookingReference}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Driver Name:</span>
                      <span className="font-semibold text-slate-800">
                        {verificationResult.booking.driverName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Plate Number:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {verificationResult.booking.vehiclePlate}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Vehicle Category:</span>
                      <span className="font-semibold text-slate-800 capitalize">
                        {verificationResult.booking.vehicleType}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Direct Payment:</span>
                      <span className="font-bold text-emerald-700">Confirmed (₹{verificationResult.booking.amount})</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    {!verificationResult.booking.alreadyCheckedIn ? (
                      <Button
                        variant="primary"
                        size="md"
                        className="w-full"
                        isLoading={isProcessing}
                        leftIcon={<LogIn className="w-4 h-4" />}
                        onClick={() => handleCheckIn(verificationResult.booking!.id)}
                      >
                        Authorize & Record Check-In
                      </Button>
                    ) : (
                      <Button
                        variant="danger"
                        size="md"
                        className="w-full"
                        isLoading={isProcessing}
                        leftIcon={<LogOut className="w-4 h-4" />}
                        onClick={() => handleCheckOut(verificationResult.booking!.id)}
                      >
                        Record Check-Out (Release Slot)
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
                  setManualCode('');
                }}
              >
                Scan Next Ticket
              </Button>
            </Card>
          ) : (
            <Card className="p-6 text-center text-xs text-slate-500 space-y-3">
              <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">Awaiting Scanner Input</h4>
              <p className="leading-relaxed">
                Scan a driver's QR ticket or enter their booking reference to authenticate entry permissions.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
