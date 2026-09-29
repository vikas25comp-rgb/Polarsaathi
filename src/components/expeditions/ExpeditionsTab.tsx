import React, { useState } from 'react';
import { Compass, Plus, Calendar, Users, Package, DollarSign, Building2, CheckCircle, Clock } from 'lucide-react';
import { dataStore } from '../../lib/dataStore';
import { Expedition, ExpeditionStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const ExpeditionsTab: React.FC = () => {
  const { user } = useAuth();
  const [expeditions, setExpeditions] = useState<Expedition[]>(dataStore.getExpeditions());
  const [selectedExpedition, setSelectedExpedition] = useState<Expedition | null>(expeditions[0] || null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formLeader, setFormLeader] = useState('');
  const [formStationId, setFormStationId] = useState('st-bharati');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formStatus, setFormStatus] = useState<ExpeditionStatus>('Preparing');
  const [formBudget, setFormBudget] = useState(25000000);
  const [formPersonnelCount, setFormPersonnelCount] = useState(30);
  const [formCargoWeight, setFormCargoWeight] = useState(45000);
  const [formDescription, setFormDescription] = useState('');

  const stations = dataStore.getStations();
  const cargoList = dataStore.getCargo();
  const personnelList = dataStore.getPersonnel();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode || !formName || !formLeader) return;

    const newExp = dataStore.createExpedition(
      {
        code: formCode,
        name: formName,
        leaderName: formLeader,
        stationId: formStationId,
        startDate: formStartDate || new Date().toISOString().split('T')[0],
        endDate: formEndDate || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
        status: formStatus,
        budgetAllocated: Number(formBudget),
        personnelCount: Number(formPersonnelCount),
        cargoWeightKg: Number(formCargoWeight),
        description: formDescription,
      },
      user?.fullName || 'Expedition Manager'
    );

    const updated = dataStore.getExpeditions();
    setExpeditions(updated);
    setSelectedExpedition(newExp);
    setIsModalOpen(false);

    // Reset Form
    setFormCode('');
    setFormName('');
    setFormLeader('');
    setFormDescription('');
  };

  const handleUpdateStatus = (id: string, newStatus: ExpeditionStatus) => {
    const updated = dataStore.updateExpedition(id, { status: newStatus }, user?.fullName || 'Expedition Manager');
    const list = dataStore.getExpeditions();
    setExpeditions(list);
    if (selectedExpedition?.id === id) {
      setSelectedExpedition(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            <span>Polar Expedition Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Planning, staffing, scientific scheduling and resource deployment for Antarctic &amp; Arctic campaigns.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-cyan-900/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Plan New Expedition</span>
        </button>
      </div>

      {/* Main Grid: Expedition List + Details View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Expedition Roster Cards */}
        <div className="lg:col-span-5 space-y-3">
          {expeditions.map((exp) => {
            const station = stations.find((s) => s.id === exp.stationId);
            const isSelected = selectedExpedition?.id === exp.id;
            return (
              <div
                key={exp.id}
                onClick={() => setSelectedExpedition(exp)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-500/60 shadow-lg shadow-cyan-950/40'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-cyan-300">{exp.code}</span>
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                          exp.status === 'Active'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : exp.status === 'Preparing'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : exp.status === 'Completed'
                            ? 'bg-slate-800 text-slate-300'
                            : 'bg-amber-950 text-amber-300'
                        }`}
                      >
                        {exp.status}
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm text-slate-100 mt-1">{exp.name}</h3>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs font-mono text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{station?.name.replace(' Station', '') || 'Multi-Station'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{exp.personnelCount} Personnel</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[11px] text-slate-400">
                      {exp.startDate} to {exp.endDate}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Expedition Detailed Command View */}
        <div className="lg:col-span-7">
          {selectedExpedition ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-800">
                      {selectedExpedition.code}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Lead: <strong className="text-slate-200">{selectedExpedition.leaderName}</strong>
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 mt-1.5">{selectedExpedition.name}</h3>
                </div>

                {/* Status Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Status:</span>
                  <select
                    value={selectedExpedition.status}
                    onChange={(e) => handleUpdateStatus(selectedExpedition.id, e.target.value as ExpeditionStatus)}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Planned">Planned</option>
                    <option value="Preparing">Preparing</option>
                    <option value="Active">Active</option>
                    <option value="Returning">Returning</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Scientific Objectives &amp; Mission Scope
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                  {selectedExpedition.description || 'No detailed scope recorded.'}
                </p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-sans">Budget Allocated</span>
                  <span className="text-sm font-bold text-slate-100">
                    ₹{(selectedExpedition.budgetAllocated / 10000000).toFixed(2)} Cr
                  </span>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-sans">Scientists / Crew</span>
                  <span className="text-sm font-bold text-cyan-300">{selectedExpedition.personnelCount}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-sans">Manifested Cargo</span>
                  <span className="text-sm font-bold text-slate-100">
                    {(selectedExpedition.cargoWeightKg / 1000).toFixed(1)} MT
                  </span>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-sans">Primary Base</span>
                  <span className="text-sm font-bold text-slate-100">
                    {stations.find((s) => s.id === selectedExpedition.stationId)?.name.replace(' Station', '') || 'Antarctica'}
                  </span>
                </div>
              </div>

              {/* Manifested Cargo & Personnel Lists for this Expedition */}
              <div className="space-y-4 pt-2">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                    <span>Associated Cargo Shipments ({cargoList.filter((c) => c.expeditionId === selectedExpedition.id).length})</span>
                    <span className="text-[11px] text-cyan-400 font-mono">Live Tracking</span>
                  </h4>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {cargoList
                      .filter((c) => c.expeditionId === selectedExpedition.id)
                      .map((c) => (
                        <div
                          key={c.id}
                          className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-mono text-cyan-400 font-semibold">{c.trackingNumber}</span> —{' '}
                            <span className="text-slate-200">{c.name}</span>
                          </div>
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {c.status}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                    <span>Assigned Personnel ({personnelList.filter((p) => p.expeditionId === selectedExpedition.id).length})</span>
                  </h4>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {personnelList
                      .filter((p) => p.expeditionId === selectedExpedition.id)
                      .map((p) => (
                        <div
                          key={p.id}
                          className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="text-slate-100 font-semibold">{p.name}</span>
                            <span className="text-slate-400 text-[11px] ml-2 font-mono">({p.role})</span>
                          </div>
                          <span className="text-[11px] font-mono text-cyan-400">{p.currentLocation}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-xl">
              Select an expedition to inspect mission parameters.
            </div>
          )}
        </div>
      </div>

      {/* Plan New Expedition Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Compass className="w-5 h-5 text-cyan-400" />
                <span>Plan New Polar Scientific Expedition</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Expedition Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ISEA-45 or AWE-2027"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Expedition Leader *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. A. K. Sengupta"
                    value={formLeader}
                    onChange={(e) => setFormLeader(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Full Expedition Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 45th Indian Scientific Expedition to Antarctica"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Assigned Polar Base</label>
                  <select
                    value={formStationId}
                    onChange={(e) => setFormStationId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    {stations.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.region})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Initial Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ExpeditionStatus)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Planned">Planned</option>
                    <option value="Preparing">Preparing</option>
                    <option value="Active">Active</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Planned End Date</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Budget Allocated (INR)</label>
                  <input
                    type="number"
                    value={formBudget}
                    onChange={(e) => setFormBudget(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Personnel Deployed</label>
                  <input
                    type="number"
                    value={formPersonnelCount}
                    onChange={(e) => setFormPersonnelCount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Description &amp; Objectives</label>
                  <textarea
                    rows={3}
                    placeholder="Enter scientific objectives, ice-coring parameters, climate monitoring mandates..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold shadow"
                >
                  Confirm &amp; Register Expedition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
