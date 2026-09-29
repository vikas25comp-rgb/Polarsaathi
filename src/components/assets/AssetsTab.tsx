import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  Calendar,
  Search,
  Filter,
  ShieldAlert,
} from 'lucide-react';
import { dataStore } from '../../lib/dataStore';
import { Asset, AssetCondition, AssetMaintenance } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const AssetsTab: React.FC = () => {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>(dataStore.getAssets());
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(assets[0] || null);
  const [maintenanceHistory, setMaintenanceHistory] = useState<AssetMaintenance[]>(
    selectedAsset ? dataStore.getAssetMaintenance(selectedAsset.id) : []
  );

  // Filters
  const [stationFilter, setStationFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCommissionModalOpen, setIsCommissionModalOpen] = useState(false);
  const [isLogMaintModalOpen, setIsLogMaintModalOpen] = useState(false);

  // Maintenance Form State
  const [maintType, setMaintType] = useState<AssetMaintenance['maintenanceType']>('Routine Scheduled');
  const [maintFindings, setMaintFindings] = useState('');
  const [maintParts, setMaintParts] = useState('');
  const [operatingHoursAtService, setOperatingHoursAtService] = useState<number>(0);
  const [nextDueDate, setNextDueDate] = useState('');

  // Commission Form State
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<Asset['category']>('Power & Heating');
  const [formSerial, setFormSerial] = useState('');
  const [formStationId, setFormStationId] = useState('st-bharati');
  const [formOperatingHours, setFormOperatingHours] = useState(1200);
  const [formCriticality, setFormCriticality] = useState<Asset['criticality']>('Primary Operational');
  const [formAssignedTeam, setFormAssignedTeam] = useState('Electrical & Power Engineering Team');
  const [formSparesNotes, setFormSparesNotes] = useState('Oil filters and belt spares staged in workshop.');

  const stations = dataStore.getStations();

  const handleSelectAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setMaintenanceHistory(dataStore.getAssetMaintenance(asset.id));
  };

  const handleCommissionAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;

    const code = formCode || `AST-${formCategory.substring(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;
    const serial = formSerial || `SN-${Math.floor(100000 + Math.random() * 900000)}`;

    const created = dataStore.createAsset(
      {
        code,
        name: formName,
        category: formCategory,
        serialNumber: serial,
        stationId: formStationId,
        operationalStatus: 'Operational',
        operatingHours: Number(formOperatingHours),
        criticality: formCriticality,
        commissionDate: new Date().toISOString().split('T')[0],
        lastMaintenanceDate: new Date().toISOString().split('T')[0],
        nextScheduledMaintenance: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().split('T')[0],
        assignedTeam: formAssignedTeam,
        sparePartsNotes: formSparesNotes,
      },
      user?.fullName || 'Station Engineer'
    );

    const list = dataStore.getAssets();
    setAssets(list);
    setSelectedAsset(created);
    setMaintenanceHistory([]);
    setIsCommissionModalOpen(false);

    // Reset Form
    setFormCode('');
    setFormName('');
  };

  const handleLogMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;

    const nextDue = nextDueDate || new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().split('T')[0];

    dataStore.recordAssetMaintenance(
      selectedAsset.id,
      {
        maintenanceType: maintType,
        status: 'Completed',
        technicianName: user?.fullName || 'Station Technician',
        performedDate: new Date().toISOString().split('T')[0],
        operatingHoursAtService: Number(operatingHoursAtService || selectedAsset.operatingHours),
        findings: maintFindings || 'Routine inspection completed with zero faults.',
        partsReplaced: maintParts,
        nextDueDate: nextDue,
      },
      user?.fullName || 'Station Technician'
    );

    const updatedList = dataStore.getAssets();
    setAssets(updatedList);
    const updatedSelected = updatedList.find((a) => a.id === selectedAsset.id) || null;
    setSelectedAsset(updatedSelected);
    if (updatedSelected) {
      setMaintenanceHistory(dataStore.getAssetMaintenance(updatedSelected.id));
    }
    setIsLogMaintModalOpen(false);
    setMaintFindings('');
    setMaintParts('');
  };

  const getMaintenanceHealthBadge = (asset: Asset) => {
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = asset.nextScheduledMaintenance < today || asset.operationalStatus === 'Faulty';
    const isDueSoon = asset.operationalStatus === 'Maintenance Due';

    if (isOverdue) {
      return (
        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-800 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
          🔴 Overdue
        </span>
      );
    }
    if (isDueSoon) {
      return (
        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1">
          🟡 Due Soon
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
        🟢 Normal
      </span>
    );
  };

  const filteredAssets = assets.filter((a) => {
    if (stationFilter !== 'all' && a.stationId !== stationFilter) return false;
    if (statusFilter !== 'all' && a.operationalStatus !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q) ||
        a.serialNumber.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-cyan-400" />
            <span>Polar Asset &amp; Mission Equipment Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Vital life-support generators, snowcats, tracked vehicles, scientific instruments, and scheduled polar maintenance overhauls.
          </p>
        </div>

        <button
          onClick={() => {
            setFormCode(`AST-NEW-${Math.floor(10 + Math.random() * 90)}`);
            setIsCommissionModalOpen(true);
          }}
          className="flex items-center gap-2 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-cyan-900/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Commission New Asset</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-cyan-400" />
          <input
            type="text"
            placeholder="Search asset name, code, serial number, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none"
            >
              <option value="all">All Stations</option>
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none"
          >
            <option value="all">All Operational Statuses</option>
            <option value="Operational">Operational</option>
            <option value="Maintenance Due">Maintenance Due</option>
            <option value="Under Maintenance">Under Maintenance</option>
            <option value="Faulty">Faulty</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Asset List + Asset Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Asset Cards Roster */}
        <div className="lg:col-span-5 space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
          {filteredAssets.map((asset) => {
            const isSelected = selectedAsset?.id === asset.id;
            const station = stations.find((s) => s.id === asset.stationId);
            return (
              <div
                key={asset.id}
                onClick={() => handleSelectAsset(asset)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-500/60 shadow-lg shadow-cyan-950/40'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-cyan-400">{asset.code}</span>
                      <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-800 text-slate-300">
                        {asset.category}
                      </span>
                      {asset.isSeedDemo && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-400">
                          Demo
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-semibold text-slate-100 mt-1">{asset.name}</h4>
                  </div>

                  {getMaintenanceHealthBadge(asset)}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                  <div>
                    Hours: <strong className="text-slate-200">{asset.operatingHours.toLocaleString()} hrs</strong>
                  </div>
                  <div className="text-right text-slate-300">
                    Base: <strong className="text-slate-100">{station?.name.replace(' Station', '')}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Asset Details & Maintenance Logger */}
        <div className="lg:col-span-7">
          {selectedAsset ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-800">
                      {selectedAsset.code}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">SN: {selectedAsset.serialNumber}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-100 mt-1.5">{selectedAsset.name}</h3>
                  <p className="text-xs text-slate-400">{selectedAsset.category} • Criticality: {selectedAsset.criticality}</p>
                </div>

                <button
                  onClick={() => {
                    setOperatingHoursAtService(selectedAsset.operatingHours);
                    setIsLogMaintModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow transition-colors self-start sm:self-auto"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Log Maintenance Service</span>
                </button>
              </div>

              {/* Maintenance Telemetry Matrix (Section 20) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-sans">Operating Hours</span>
                  <span className="text-sm font-bold text-cyan-300">{selectedAsset.operatingHours.toLocaleString()} hrs</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-sans">Last Service Date</span>
                  <span className="text-sm font-bold text-slate-200">{selectedAsset.lastMaintenanceDate}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-sans">Next Due Date</span>
                  <span className="text-sm font-bold text-slate-200">{selectedAsset.nextScheduledMaintenance}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-sans">Health Status</span>
                  <div className="mt-0.5">{getMaintenanceHealthBadge(selectedAsset)}</div>
                </div>
              </div>

              {/* Assigned Team & Spare Parts Notes */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Assigned Maintenance Team:</span>
                  <span className="text-slate-200 font-semibold">{selectedAsset.assignedTeam}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Station Commission Date:</span>
                  <span className="text-slate-200 font-mono">{selectedAsset.commissionDate}</span>
                </div>
                {selectedAsset.sparePartsNotes && (
                  <div className="pt-2 border-t border-slate-900 text-slate-300">
                    <span className="text-slate-400 font-semibold block mb-0.5">Required Spare Parts / Staging:</span>
                    {selectedAsset.sparePartsNotes}
                  </div>
                )}
              </div>

              {/* Maintenance History Timeline */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                  <span>Maintenance &amp; Overhaul Log ({maintenanceHistory.length})</span>
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {maintenanceHistory.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 text-xs flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-100">{m.maintenanceType}</span>
                          <span className="text-[10px] font-mono text-cyan-400">@ {m.operatingHoursAtService} hrs</span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1">{m.findings}</p>
                        {m.partsReplaced && (
                          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Replaced: {m.partsReplaced}</p>
                        )}
                        <p className="text-[10px] text-slate-500 mt-1">Technician: {m.technicianName}</p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">{m.performedDate}</span>
                    </div>
                  ))}
                  {maintenanceHistory.length === 0 && (
                    <p className="text-center text-slate-500 py-4 text-xs">No prior maintenance records recorded.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-xl">
              Select an asset to view maintenance log.
            </div>
          )}
        </div>
      </div>

      {/* Modal 1: Commission Asset */}
      {isCommissionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-cyan-400" />
                <span>Commission New Polar Asset</span>
              </h3>
              <button onClick={() => setIsCommissionModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <form onSubmit={handleCommissionAsset} className="py-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Asset Code *</label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as Asset['category'])}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Power & Heating">Power & Heating</option>
                    <option value="Vehicles & Heavy Mobile">Vehicles & Heavy Mobile</option>
                    <option value="Scientific Instrumentation">Scientific Instrumentation</option>
                    <option value="Communication & Radar">Communication & Radar</option>
                    <option value="Life Support & Water">Life Support & Water</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Equipment Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cummins QSK19 Arctic Diesel Generator #3"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Station Base</label>
                  <select
                    value={formStationId}
                    onChange={(e) => setFormStationId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    {stations.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Operational Criticality</label>
                  <select
                    value={formCriticality}
                    onChange={(e) => setFormCriticality(e.target.value as Asset['criticality'])}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Vital Life-Support">Vital Life-Support</option>
                    <option value="Primary Operational">Primary Operational</option>
                    <option value="Secondary Support">Secondary Support</option>
                    <option value="Non-Critical">Non-Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Initial Operating Hours</label>
                  <input
                    type="number"
                    value={formOperatingHours}
                    onChange={(e) => setFormOperatingHours(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Assigned Engineering Unit</label>
                  <input
                    type="text"
                    value={formAssignedTeam}
                    onChange={(e) => setFormAssignedTeam(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Spare Parts &amp; Maintenance Notes</label>
                  <input
                    type="text"
                    value={formSparesNotes}
                    onChange={(e) => setFormSparesNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCommissionModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold shadow"
                >
                  Commission Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Log Maintenance (Acceptance Test 4) */}
      {isLogMaintModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-cyan-400" />
                <span>Log Maintenance Service</span>
              </h3>
              <button onClick={() => setIsLogMaintModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <form onSubmit={handleLogMaintenance} className="py-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Servicing Asset:</span>
                <span className="font-bold text-sm text-slate-100">{selectedAsset.code} - {selectedAsset.name}</span>
                <p className="text-[11px] text-cyan-400 font-mono mt-0.5">
                  Current Hours: {selectedAsset.operatingHours} hrs
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Service Type *</label>
                <select
                  value={maintType}
                  onChange={(e) => setMaintType(e.target.value as AssetMaintenance['maintenanceType'])}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Routine Scheduled">Routine Scheduled (500-hr Polar)</option>
                  <option value="Corrective Repair">Corrective Repair</option>
                  <option value="Emergency Polar Overhaul">Emergency Polar Overhaul</option>
                  <option value="Pre-Wintering Prep">Pre-Wintering Preparation</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Operating Hours at Service *</label>
                <input
                  type="number"
                  required
                  value={operatingHoursAtService}
                  onChange={(e) => setOperatingHoursAtService(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Findings &amp; Service Actions Taken *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Describe oil analysis, compression testing, seal replacement, winterization..."
                  value={maintFindings}
                  onChange={(e) => setMaintFindings(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Parts Replaced</label>
                <input
                  type="text"
                  placeholder="e.g. Filter cartridge x2, Viton fuel line seal"
                  value={maintParts}
                  onChange={(e) => setMaintParts(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Next Service Due Date</label>
                <input
                  type="date"
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsLogMaintModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold shadow"
                >
                  Confirm Service &amp; Clear Overdue Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
