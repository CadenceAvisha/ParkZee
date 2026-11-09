import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { Building, Phone, Mail, QrCode, Banknote, Shield, CheckCircle2, User } from 'lucide-react';

export const OwnerProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const settingsKey = `parkzee_host_settings_${user?.id || 'default'}`;

  const initialSettings = (() => {
    try {
      const saved = localStorage.getItem(settingsKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      upiId: 'vikramaditya@oksbi',
      acceptCash: true,
      acceptUpi: true,
      phone: user?.phone || '+91 91234 56789',
    };
  })();

  const [upiId, setUpiId] = useState(initialSettings.upiId);
  const [acceptCash, setAcceptCash] = useState(initialSettings.acceptCash);
  const [acceptUpi, setAcceptUpi] = useState(initialSettings.acceptUpi);
  const [phone, setPhone] = useState(initialSettings.phone);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(
        settingsKey,
        JSON.stringify({ upiId, acceptCash, acceptUpi, phone })
      );
    } catch {}
    showToast('success', 'Settings Saved', 'Host preferences and settlement methods updated.');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Property Host Profile & Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure direct settlement preferences, on-site UPI IDs, and attendant notifications.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="p-6 md:col-span-1 text-center">
          <div className="w-20 h-20 rounded-full bg-teal-100 border-2 border-teal-500 mx-auto flex items-center justify-center text-teal-700 text-2xl font-bold mb-3 overflow-hidden">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              user?.name?.charAt(0) || 'O'
            )}
          </div>
          <h3 className="text-base font-bold text-slate-900">{user?.name}</h3>
          <p className="text-xs text-slate-500 mb-2 truncate">{user?.email}</p>
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-full border border-teal-200">
            Verified Parking Host
          </span>

          <div className="mt-6 pt-6 border-t border-slate-100 text-left text-xs space-y-3">
            <div>
              <span className="text-slate-400 block font-medium">Host ID</span>
              <span className="font-mono text-slate-700">{user?.id}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Contact Phone</span>
              <span className="font-semibold text-slate-800">{phone}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Settlement Architecture</span>
              <span className="font-semibold text-emerald-600">100% Direct Driver Payment</span>
            </div>
          </div>
        </Card>

        {/* Settings Right Column */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <Card className="p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                Accepted Direct Settlement Methods
              </h3>
              <p className="text-xs text-slate-500">
                Specify which payment modes you accept directly from drivers at your parking lot.
              </p>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <QrCode className="w-5 h-5 text-brand-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">UPI / QR Code Scan</p>
                      <p className="text-[11px] text-slate-500">Driver scans your UPI QR code upon arrival</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={acceptUpi}
                    onChange={(e) => setAcceptUpi(e.target.checked)}
                    className="w-4 h-4 text-brand-600 rounded border-slate-300"
                  />
                </label>

                {acceptUpi && (
                  <div className="pl-2">
                    <Input
                      label="Host UPI Virtual ID"
                      placeholder="e.g. mobile@upi"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      helperText="Displayed to drivers after direct reservation placement."
                    />
                  </div>
                )}

                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Banknote className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Cash Settlement</p>
                      <p className="text-[11px] text-slate-500">Driver hands cash directly to parking attendant</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={acceptCash}
                    onChange={(e) => setAcceptCash(e.target.checked)}
                    className="w-4 h-4 text-brand-600 rounded border-slate-300"
                  />
                </label>
              </div>

              <div className="pt-2">
                <Input
                  label="Attendant Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="pt-3 flex justify-end">
                <Button type="submit" variant="primary" size="md">
                  Save Host Preferences
                </Button>
              </div>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
};
