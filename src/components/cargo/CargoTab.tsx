import React, { useState } from 'react';
import {
  Package,
  Plus,
  Truck,
  Box,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Thermometer,
  Shield,
  Search,
  Filter,
} from 'lucide-react';
import { dataStore } from '../../lib/dataStore';
import { CargoItem, CargoStatus, CargoCategory, CargoPriority, CargoMovement } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const CargoTab: React.FC = () => {
  const { user } = useAuth();
  const [cargoList, setCargoList] = useState<CargoItem[]>(dataStore.getCargo());
  const [selectedCargo, setSelectedCargo] = useState<CargoItem | null>(cargoList[0] || null);
  const [movements, setMovements] = useState<CargoMovement[]>(
    selectedCargo ? dataStore.getCargoMovements(selectedCargo.id) : []
  );

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // New Status Update State
  const [newStatus, setNewStatus] = useState<CargoStatus>('In Transit');
  const [newLocation, setNewLocation] = useState('');
  const [officerNotes, setOfficerNotes] = useState('');

  // Register Form State
  const [regTrackingNumber, setRegTrackingNumber] = useState('');
  const [regName, setRegName] = useState('');
  const [regCategory, setRegCategory] = useState<CargoCategory>('Scientific Equipment');
  const [regPriority, setRegPriority] = useState<CargoPriority>('High');
  const [regStatus, setRegStatus] = useState<CargoStatus>('Planned');
  const [regExpeditionId, setRegExpeditionId] = useState('exp-isea-44');
  const [regStationId, setRegStationId] = useState('st-bharati');
  const [regContainerId, setRegContainerId] = useState('cont-iso-01');
  const [regWeightKg, setRegWeightKg] = useState(1200);
  const [regVolumeM3, setRegVolumeM3] = useState(2.4);
  const [regIsHazmat, setRegIsHazmat] = useState(false);
  const [regHazmatDetails, setRegHazmatDetails] = useState('');
  const [regTempControlled, setRegTempControlled] = useState(false);
  const [regRequiredTemp, setRegRequiredTemp] = useState('');
  const [regLocation, setRegLocation] = useState('Cape Town Terminal 4');
  const [regOriginHub, setRegOriginHub] = useState('NCPOR Goa');
  const [regEstimatedArrival, setRegEstimatedArrival] = useState('');
  const [regInstructions, setRegInstructions] = useState('');

  const stations = dataStore.getStations();
  const expeditions = dataStore.getExpeditions();
  const containers = dataStore.getContainers();

  const handleSelectCargo = (item: CargoItem) => {
    setSelectedCargo(item);
    setMovements(dataStore.getCargoMovements(item.id));
  };

  const handleRegisterCargo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName) return;

    const trackingNum = regTrackingNumber || `CRG-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const created = dataStore.createCargo(
      {
        trackingNumber: trackingNum,
        name: regName,
        category: regCategory,
        priority: regPriority,
        status: regStatus,
        expeditionId: regExpeditionId,
        destinationStationId: regStationId,
        containerId: regContainerId,
        weightKg: Number(regWeightKg),
        volumeM3: Number(regVolumeM3),
        isHazmat: regIsHazmat,
        hazmatDetails: regHazmatDetails,
        temperatureControlled: regTempControlled,
        requiredTempRange: regRequiredTemp,
        currentLocation: regLocation,
        originHub: regOriginHub,
        estimatedArrival: regEstimatedArrival || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
        specialInstructions: regInstructions,
      },
      user?.fullName || 'Logistics Officer'
    );

    const updated = dataStore.getCargo();
    setCargoList(updated);
    setSelectedCargo(created);
    setMovements(dataStore.getCargoMovements(created.id));
    setIsRegisterModalOpen(false);

    // Reset fields
    setRegTrackingNumber('');
    setRegName('');
    setRegInstructions('');
  };

  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCargo) return;

    const loc = newLocation || selectedCargo.currentLocation;
    const updated = dataStore.updateCargoStatus(
      selectedCargo.id,
      newStatus,
      loc,
      user?.fullName || 'Logistics Officer',
      officerNotes
    );

    const list = dataStore.getCargo();
    setCargoList(list);
    setSelectedCargo(updated);
    setMovements(dataStore.getCargoMovements(updated.id));
    setIsStatusModalOpen(false);
    setOfficerNotes('');
  };

  const filteredCargo = cargoList.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.trackingNumber.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.currentLocation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const timelineSteps: CargoStatus[] = ['Planned', 'Packed', 'Dispatched', 'In Transit', 'At Station', 'Received'];

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-cyan-400" />
            <span>Polar Cargo &amp; Consignment Tracking</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Full lifecycle consignment tracking from staging hubs (Goa/Cape Town) across Roaring Forties to Polar stations.
          </p>
        </div>

        <button
          onClick={() => {
            setRegTrackingNumber(`CRG-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
            setIsRegisterModalOpen(true);
          }}
          className="flex items-center gap-2 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-cyan-900/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Consignment</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-cyan-400" />
          <input
            type="text"
            placeholder="Search Tracking #, Consignment Name, Location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Planned">Planned</option>
              <option value="Packed">Packed</option>
              <option value="Dispatched">Dispatched</option>
              <option value="In Transit">In Transit</option>
              <option value="At Station">At Station</option>
              <option value="Received">Received</option>
              <option value="Delayed">Delayed</option>
              <option value="Lost/Damaged">Lost/Damaged</option>
            </select>
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Routine">Routine</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="Fuel">Fuel</option>
            <option value="Food">Food</option>
            <option value="Medicine">Medicine</option>
            <option value="Scientific Equipment">Scientific Equipment</option>
            <option value="Spare Parts">Spare Parts</option>
            <option value="Machinery">Machinery</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Cargo Master List & Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Consignment Table / Roster */}
        <div className="lg:col-span-5 space-y-2.5">
          <div className="text-xs font-semibold text-slate-400 px-1 flex justify-between">
            <span>Manifested Consignments ({filteredCargo.length})</span>
            <span>Weight: {(filteredCargo.reduce((acc, c) => acc + c.weightKg, 0) / 1000).toFixed(1)} MT</span>
          </div>

          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {filteredCargo.map((item) => {
              const isSelected = selectedCargo?.id === item.id;
              const station = stations.find((s) => s.id === item.destinationStationId);
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectCargo(item)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500/60 shadow-lg shadow-cyan-950/40'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-cyan-400">{item.trackingNumber}</span>
                        <span
                          className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                            item.priority === 'Critical'
                              ? 'bg-red-950 text-red-300 border border-red-800'
                              : item.priority === 'High'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {item.priority}
                        </span>
                        {item.isSeedDemo && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-400">
                            Demo
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-semibold text-slate-100 mt-1">{item.name}</h4>
                    </div>

                    <span
                      className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                        item.status === 'Delayed'
                          ? 'bg-red-950 text-red-400 border border-red-800 animate-pulse'
                          : item.status === 'In Transit'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                          : item.status === 'Received' || item.status === 'At Station'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">{item.currentLocation}</span>
                    </div>
                    <div className="text-right text-slate-300">
                      Dest: <strong className="text-slate-100">{station?.name.replace(' Station', '')}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Cargo Detail & Timeline */}
        <div className="lg:col-span-7">
          {selectedCargo ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-800">
                      {selectedCargo.trackingNumber}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Category: {selectedCargo.category}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-100 mt-1">{selectedCargo.name}</h3>
                </div>

                <button
                  onClick={() => {
                    setNewStatus(selectedCargo.status);
                    setNewLocation(selectedCargo.currentLocation);
                    setIsStatusModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow transition-colors self-start sm:self-auto"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Update Location &amp; Status</span>
                </button>
              </div>

              {/* Section 10: Mandatory Polar Cargo Timeline */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Polar Logistics Progression Timeline</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  {timelineSteps.map((step, idx) => {
                    const stepOrder = timelineSteps.indexOf(selectedCargo.status);
                    const isPassed = stepOrder >= idx && selectedCargo.status !== 'Delayed' && selectedCargo.status !== 'Lost/Damaged';
                    const isCurrent = selectedCargo.status === step;
                    return (
                      <div
                        key={step}
                        className={`p-2 rounded-lg text-center border text-[11px] font-mono transition-all ${
                          isCurrent
                            ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold shadow-md shadow-cyan-950'
                            : isPassed
                            ? 'bg-slate-900 border-slate-700 text-emerald-400'
                            : 'bg-slate-950/60 border-slate-900 text-slate-600'
                        }`}
                      >
                        <div className="text-[10px] text-slate-500 uppercase font-sans">Step {idx + 1}</div>
                        <div className="mt-0.5 truncate">{step}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-sans">Gross Weight</span>
                  <span className="text-sm font-bold text-slate-100">{selectedCargo.weightKg.toLocaleString()} kg</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-sans">Volume</span>
                  <span className="text-sm font-bold text-slate-100">{selectedCargo.volumeM3} m³</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-sans">Hazardous (Hazmat)</span>
                  <span className={`text-sm font-bold ${selectedCargo.isHazmat ? 'text-amber-400' : 'text-slate-400'}`}>
                    {selectedCargo.isHazmat ? 'YES (UN Hazard)' : 'No'}
                  </span>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-sans">Cold Chain Spec</span>
                  <span className={`text-sm font-bold ${selectedCargo.temperatureControlled ? 'text-cyan-400' : 'text-slate-400'}`}>
                    {selectedCargo.temperatureControlled ? selectedCargo.requiredTempRange || 'Controlled' : 'Ambient Polar'}
                  </span>
                </div>
              </div>

              {/* Location & Routing Details */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Reported Location:</span>
                  <span className="text-cyan-300 font-semibold">{selectedCargo.currentLocation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Origin Logistics Port:</span>
                  <span className="text-slate-200">{selectedCargo.originHub}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Destination Station:</span>
                  <span className="text-slate-100 font-bold">
                    {stations.find((s) => s.id === selectedCargo.destinationStationId)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimated Station ETA:</span>
                  <span className="text-slate-200 font-mono">{selectedCargo.estimatedArrival}</span>
                </div>
                {selectedCargo.receivingOfficer && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Receiving Officer on Site:</span>
                    <span className="text-emerald-400 font-bold">{selectedCargo.receivingOfficer}</span>
                  </div>
                )}
                {selectedCargo.specialInstructions && (
                  <div className="pt-2 border-t border-slate-900 text-slate-300">
                    <span className="text-slate-400 font-semibold block mb-0.5">Special Staging Instructions:</span>
                    {selectedCargo.specialInstructions}
                  </div>
                )}
              </div>

              {/* Historical Movement Audits */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                  <span>Consignment Waypoint History ({movements.length})</span>
                  <span className="text-[11px] text-slate-500 font-mono">Immutable Log</span>
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {movements.map((m) => (
                    <div
                      key={m.id}
                      className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 text-xs flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-200">{m.status}</span>
                          <span className="text-[11px] text-cyan-400 font-mono">@ {m.location}</span>
                        </div>
                        {m.notes && <p className="text-[11px] text-slate-400 mt-0.5">{m.notes}</p>}
                        <p className="text-[10px] text-slate-500 mt-1">Logged by: {m.officerName}</p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">
                        {new Date(m.timestamp).toLocaleDateString()} {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-xl">
              Select a consignment to view tracking telemetry.
            </div>
          )}
        </div>
      </div>

      {/* Modal 1: Register Cargo */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-cyan-400" />
                <span>Register Cargo Consignment</span>
              </h3>
              <button onClick={() => setIsRegisterModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterCargo} className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tracking Number *</label>
                  <input
                    type="text"
                    required
                    value={regTrackingNumber}
                    onChange={(e) => setRegTrackingNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category *</label>
                  <select
                    value={regCategory}
                    onChange={(e) => setRegCategory(e.target.value as CargoCategory)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Food">Food</option>
                    <option value="Fuel">Fuel</option>
                    <option value="Medicine">Medicine</option>
                    <option value="Scientific Equipment">Scientific Equipment</option>
                    <option value="Spare Parts">Spare Parts</option>
                    <option value="Machinery">Machinery</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Personal Supplies">Personal Supplies</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Consignment Name / Manifest Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Caterpillar Generator Spare Turbochargers"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Expedition Assignment</label>
                  <select
                    value={regExpeditionId}
                    onChange={(e) => setRegExpeditionId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    {expeditions.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.code} - {e.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Destination Station</label>
                  <select
                    value={regStationId}
                    onChange={(e) => setRegStationId(e.target.value)}
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
                  <label className="block text-slate-300 font-medium mb-1">Priority</label>
                  <select
                    value={regPriority}
                    onChange={(e) => setRegPriority(e.target.value as CargoPriority)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Routine">Routine</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Initial Status</label>
                  <select
                    value={regStatus}
                    onChange={(e) => setRegStatus(e.target.value as CargoStatus)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Planned">Planned</option>
                    <option value="Packed">Packed</option>
                    <option value="Dispatched">Dispatched</option>
                    <option value="In Transit">In Transit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Gross Weight (kg)</label>
                  <input
                    type="number"
                    value={regWeightKg}
                    onChange={(e) => setRegWeightKg(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Current Staging Location</label>
                  <input
                    type="text"
                    value={regLocation}
                    onChange={(e) => setRegLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Handling &amp; Cold Chain Instructions</label>
                  <input
                    type="text"
                    placeholder="e.g. Keep frozen below -20°C; do not invert; hazardous UN1863"
                    value={regInstructions}
                    onChange={(e) => setRegInstructions(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold shadow"
                >
                  Confirm &amp; Manifest Cargo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Update Status & Waypoint */}
      {isStatusModalOpen && selectedCargo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Truck className="w-5 h-5 text-cyan-400" />
                <span>Update Consignment Waypoint</span>
              </h3>
              <button onClick={() => setIsStatusModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="py-4 space-y-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Consignment:</span>
                <span className="font-bold text-slate-100">{selectedCargo.trackingNumber} - {selectedCargo.name}</span>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">New Waypoint Status *</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as CargoStatus)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-medium"
                >
                  <option value="Packed">Packed</option>
                  <option value="Dispatched">Dispatched</option>
                  <option value="In Transit">In Transit</option>
                  <option value="At Station">At Station</option>
                  <option value="Received">Received (Signed Off)</option>
                  <option value="Delayed">Delayed</option>
                  <option value="Lost/Damaged">Lost/Damaged</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Updated Physical Location *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MV Vasiliy Golovnin (Roaring Forties) or Bharati Apron"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Officer Notes / Waybill Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Enter vessel tie-down check, weather delay justification, seal integrity inspection..."
                  value={officerNotes}
                  onChange={(e) => setOfficerNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold shadow"
                >
                  Commit Status to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
