import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { Vehicle, VehicleType } from '../../types/user.types';
import { User, Phone, Mail, Car, Plus, Trash2, Shield, Lock, CheckCircle2 } from 'lucide-react';

export const DriverProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: 'veh-1',
      make: 'Hyundai',
      model: 'Creta',
      plateNumber: 'HR26 DK 4421',
      type: 'suv',
      color: 'Polar White',
      isDefault: true,
    },
    {
      id: 'veh-2',
      make: 'Honda',
      model: 'City',
      plateNumber: 'DL3C BB 1092',
      type: 'car',
      color: 'Silver',
      isDefault: false,
    },
  ]);

  // New vehicle form
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newMake, setNewMake] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newPlate, setNewPlate] = useState('');
  const [newType, setNewType] = useState<VehicleType>('car');

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlate || !newMake) return;
    const newVeh: Vehicle = {
      id: `veh-${Date.now()}`,
      make: newMake,
      model: newModel,
      plateNumber: newPlate.toUpperCase(),
      type: newType,
      color: 'Standard',
      isDefault: false,
    };
    setVehicles([...vehicles, newVeh]);
    setShowAddVehicle(false);
    setNewMake('');
    setNewModel('');
    setNewPlate('');
    showToast('success', 'Vehicle Added', 'New vehicle registered to your profile.');
  };

  const handleRemoveVehicle = (id: string) => {
    setVehicles(vehicles.filter((v) => v.id !== id));
    showToast('info', 'Vehicle Removed', 'Vehicle was removed from your profile.');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Driver Profile & Vehicles</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal details and registered vehicles for quick parking checkout.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="p-6 md:col-span-1 text-center">
          <div className="w-20 h-20 rounded-full bg-brand-100 border-2 border-brand-500 mx-auto flex items-center justify-center text-brand-700 text-2xl font-bold mb-3 overflow-hidden">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              user?.name?.charAt(0) || 'D'
            )}
          </div>
          <h3 className="text-base font-bold text-slate-900">{user?.name}</h3>
          <p className="text-xs text-slate-500 mb-2 truncate">{user?.email}</p>
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-700 px-2.5 py-0.5 rounded-full border border-brand-200">
            Verified Driver
          </span>

          <div className="mt-6 pt-6 border-t border-slate-100 text-left text-xs space-y-3">
            <div>
              <span className="text-slate-400 block font-medium">Account ID</span>
              <span className="font-mono text-slate-700">{user?.id}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Phone Number</span>
              <span className="font-semibold text-slate-800">{user?.phone || '+91 98765 43210'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Account Status</span>
              <span className="font-semibold text-emerald-600 capitalize">
                {user?.accountStatus || 'Active'}
              </span>
            </div>
          </div>
        </Card>

        {/* Vehicles & Settings Right Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Registered Vehicles */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Registered Vehicles</h3>
                <p className="text-xs text-slate-500">Your vehicles saved for automatic plate filling</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setShowAddVehicle(!showAddVehicle)}
              >
                Add Vehicle
              </Button>
            </div>

            {showAddVehicle && (
              <form onSubmit={handleAddVehicle} className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-4 space-y-3 text-xs">
                <h4 className="font-bold text-slate-800">Add New Vehicle</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Plate Number"
                    placeholder="e.g. DL10 AB 1234"
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value)}
                    required
                  />
                  <Input
                    label="Make (Brand)"
                    placeholder="e.g. Tata, Hyundai"
                    value={newMake}
                    onChange={(e) => setNewMake(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Model"
                    placeholder="e.g. Nexon, i20"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                  />
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Type
                    </label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as VehicleType)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium bg-white"
                    >
                      <option value="car">Car (Sedan/Hatch)</option>
                      <option value="suv">SUV</option>
                      <option value="motorcycle">Motorcycle</option>
                      <option value="ev">Electric Vehicle (EV)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" size="sm" variant="ghost" onClick={() => setShowAddVehicle(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" variant="primary">
                    Save Vehicle
                  </Button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {vehicles.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                      <Car className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {v.plateNumber}
                        </span>
                        {v.isDefault && (
                          <span className="text-[10px] bg-brand-50 text-brand-700 px-2 py-0.5 rounded font-bold border border-brand-200">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {v.make} {v.model} ({v.type.toUpperCase()})
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveVehicle(v.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* Direct Settlement Security Notice */}
          <Card className="p-6 border-brand-200 bg-brand-50/20">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 leading-relaxed">
                <h4 className="font-bold text-slate-900 mb-1">Direct Settlement Architecture</h4>
                <p>
                  ParkZee does not store credit card or banking information. You pay property owners directly upon arrival in cash or via UPI QR scan, retaining complete financial control over every transaction.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
