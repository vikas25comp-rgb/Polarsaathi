import React, { useState } from 'react';
import {
  ShieldAlert,
  Plus,
  AlertTriangle,
  Building2,
  Users,
  Wrench,
  Truck,
  HeartPulse,
  Radio,
  Clock,
  CheckCircle2,
  ListTodo,
  FileCheck,
} from 'lucide-react';
import { dataStore } from '../../lib/dataStore';
import { EmergencyIncident, EmergencyType, EmergencySeverity, EmergencyStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const EmergencyTab: React.FC = () => {
  const { user } = useAuth();
  const [emergencies, setEmergencies] = useState<EmergencyIncident[]>(dataStore.getEmergencies());
  const [selectedIncident, setSelectedIncident] = useState<EmergencyIncident | null>(
    emergencies.find((e) => e.status === 'Active') || emergencies[0] || null
  );

  // Modals
  const [isDeclareModalOpen, setIsDeclareModalOpen] = useState(false);
  const [newActionText, setNewActionText] = useState('');
  const [newActionAssignee, setNewActionAssignee] = useState('');

  // Declare Form State
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<EmergencyType>('Equipment Failure');
  const [formStationId, setFormStationId] = useState('st-bharati');
  const [formLocation, setFormLocation] = useState('Main Station Power Generation Annex');
  const [formSeverity, setFormSeverity] = useState<EmergencySeverity>('Critical (Level 1)');
  const [formDescription, setFormDescription] = useState('');
  const [formResources, setFormResources] = useState('Thermal imaging sensor, spare cold seals, fire response crew');

  const stations = dataStore.getStations();

  // Section 16: Retrieve Automatic Emergency Snapshot for the affected station
  const activeStationId = selectedIncident ? selectedIncident.stationId : formStationId;
  const snapshot = dataStore.getEmergencySnapshot(activeStationId);
  const incidentActions = selectedIncident ? dataStore.getEmergencyActions(selectedIncident.id) : [];

  const handleSelectIncident = (incident: EmergencyIncident) => {
    setSelectedIncident(incident);
  };

  const handleDeclareEmergency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formDescription) return;

    const created = dataStore.createEmergency(
      {
        title: formTitle,
        type: formType,
        stationId: formStationId,
        locationDetails: formLocation,
        severity: formSeverity,
        status: 'Active',
        description: formDescription,
        reportedBy: user?.fullName || 'Emergency Coordinator',
        affectedPersonnelIds: [],
        requiredResources: formResources.split(',').map((s) => s.trim()),
      },
      user?.fullName || 'Emergency Coordinator'
    );

    const list = dataStore.getEmergencies();
    setEmergencies(list);
    setSelectedIncident(created);
    setIsDeclareModalOpen(false);

    // Initial response action
    dataStore.addEmergencyAction(
      created.id,
      `Immediate incident classification and perimeter isolation protocol enacted at ${formLocation}`,
      user?.fullName || 'Emergency Coordinator'
    );

    // Reset Form
    setFormTitle('');
    setFormDescription('');
  };

  const handleAddAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident || !newActionText) return;

    dataStore.addEmergencyAction(
      selectedIncident.id,
      newActionText,
      newActionAssignee || user?.fullName || 'Duty Officer'
    );

    setNewActionText('');
    setNewActionAssignee('');
  };

  const handleToggleActionStatus = (actionId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Completed' ? 'In Progress' : 'Completed';
    dataStore.updateEmergencyActionStatus(actionId, nextStatus);
    setEmergencies(dataStore.getEmergencies());
  };

  const handleUpdateIncidentStatus = (status: EmergencyStatus) => {
    if (!selectedIncident) return;
    const updated = dataStore.updateEmergencyStatus(selectedIncident.id, status, undefined, user?.fullName || 'Commander');
    const list = dataStore.getEmergencies();
    setEmergencies(list);
    setSelectedIncident(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-red-900/40">
        <div>
          <h2 className="text-lg font-bold text-red-200 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
            <span>Emergency Operations Command Center</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time polar crisis response with automatic tactical station snapshots, life-support telemetry, and crew muster.
          </p>
        </div>

        <button
          onClick={() => setIsDeclareModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-red-950/60 transition-all self-start sm:self-auto animate-pulse"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Declare Emergency Incident</span>
        </button>
      </div>

      {/* Main Grid: Incident Selector + Real-time Incident Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Incident List */}
        <div className="lg:col-span-4 space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
          <div className="text-xs font-semibold text-slate-400 px-1 flex justify-between">
            <span>Declared Polar Incidents ({emergencies.length})</span>
            <span className="text-red-400 font-mono font-bold">
              {emergencies.filter((e) => e.status === 'Active').length} ACTIVE
            </span>
          </div>

          {emergencies.map((emg) => {
            const isSelected = selectedIncident?.id === emg.id;
            const station = stations.find((s) => s.id === emg.stationId);
            return (
              <div
                key={emg.id}
                onClick={() => handleSelectIncident(emg)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-red-950/40 border-red-500/80 shadow-lg shadow-red-950/50'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-xs text-red-400">{emg.incidentCode}</span>
                      <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-800 text-slate-300">
                        {emg.type}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-100 mt-1">{emg.title}</h4>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      emg.status === 'Active'
                        ? 'bg-red-950 text-red-300 border border-red-700 animate-pulse'
                        : emg.status === 'Resolved' || emg.status === 'Closed'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {emg.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                  <div className="text-slate-300 font-semibold truncate">
                    {station?.name.replace(' Station', '')}
                  </div>
                  <div className="text-right text-red-400 font-bold truncate">
                    {emg.severity.split(' ')[0]}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Incident Command Center */}
        <div className="lg:col-span-8 space-y-5">
          {selectedIncident ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              {/* Incident Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-red-400 bg-red-950 px-2.5 py-0.5 rounded border border-red-800">
                      {selectedIncident.incidentCode}
                    </span>
                    <span className="text-xs text-red-300 font-bold font-mono">{selectedIncident.severity}</span>
                    <span className="text-xs text-slate-400 font-mono">Type: {selectedIncident.type}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-100 mt-1.5">{selectedIncident.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Location: <strong className="text-slate-200">{selectedIncident.locationDetails}</strong> • Reported by: {selectedIncident.reportedBy} ({new Date(selectedIncident.reportedAt).toLocaleTimeString()})
                  </p>
                </div>

                {/* Workflow Status Controls (Section 17) */}
                <div className="flex items-center gap-1.5">
                  <select
                    value={selectedIncident.status}
                    onChange={(e) => handleUpdateIncidentStatus(e.target.value as EmergencyStatus)}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-red-500"
                  >
                    <option value="Active">Active (Emergency)</option>
                    <option value="Investigating">Investigating</option>
                    <option value="Contained">Contained</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-red-950/80 text-xs space-y-1">
                <span className="text-red-400 font-bold uppercase tracking-wider text-[10px] block">
                  Incident Description &amp; Threat Assessment
                </span>
                <p className="text-slate-200 leading-relaxed">{selectedIncident.description}</p>
                {selectedIncident.commanderNotes && (
                  <p className="text-[11px] text-amber-300 pt-1 border-t border-slate-800 font-mono">
                    Commander Notes: {selectedIncident.commanderNotes}
                  </p>
                )}
              </div>

              {/* SECTION 16: AUTOMATIC EMERGENCY SNAPSHOT */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-cyan-400" />
                    <span>Automatic Tactical Station Snapshot — {snapshot.station?.name}</span>
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400">
                    Comms: <strong className="text-emerald-400">{snapshot.communicationStatus}</strong>
                  </span>
                </div>

                {/* Snapshot Telemetry Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                  {/* 1. Station Personnel On-Site */}
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase font-sans flex items-center gap-1">
                      <Users className="w-3 h-3 text-cyan-400" />
                      <span>Station Personnel</span>
                    </span>
                    <span className="text-base font-bold text-slate-100">{snapshot.personnel.length} On Site</span>
                    <span className="text-[10px] text-emerald-400 block mt-0.5">100% Accounted</span>
                  </div>

                  {/* 2. Critical Life-Support Assets */}
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase font-sans flex items-center gap-1">
                      <Wrench className="w-3 h-3 text-cyan-400" />
                      <span>Vital Assets</span>
                    </span>
                    <span className="text-base font-bold text-slate-100">{snapshot.criticalAssets.length} Vital Units</span>
                    <span className="text-[10px] text-amber-400 block mt-0.5">Gen #1 Sole Lead</span>
                  </div>

                  {/* 3. Available Operational Vehicles */}
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase font-sans flex items-center gap-1">
                      <Truck className="w-3 h-3 text-cyan-400" />
                      <span>Traverse Vehicles</span>
                    </span>
                    <span className="text-base font-bold text-slate-100">{snapshot.vehicles.length} Operational</span>
                    <span className="text-[10px] text-cyan-300 block mt-0.5">PistenBully Ready</span>
                  </div>

                  {/* 4. Medical Supplies on Hand */}
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase font-sans flex items-center gap-1">
                      <HeartPulse className="w-3 h-3 text-red-400" />
                      <span>Medical Supplies</span>
                    </span>
                    <span className="text-base font-bold text-slate-100">{snapshot.medicalSupplies.length} Stock SKUs</span>
                    <span className="text-[10px] text-emerald-400 block mt-0.5">Trauma Kits Intact</span>
                  </div>
                </div>

                {/* Snapshot Quick Lists: Personnel & Nearby Resources */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Personnel on Site */}
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80">
                    <span className="font-semibold text-slate-300 text-xs block mb-1.5 flex items-center justify-between">
                      <span>Affected Station Personnel Roster</span>
                      <span className="text-[10px] font-mono text-cyan-400">{snapshot.personnel.length} crew</span>
                    </span>
                    <div className="space-y-1 max-h-28 overflow-y-auto font-mono text-[11px]">
                      {snapshot.personnel.map((p) => (
                        <div key={p.id} className="flex items-center justify-between text-slate-300 py-0.5 border-b border-slate-900 last:border-0">
                          <span>{p.name}</span>
                          <span className="text-slate-500 text-[10px]">{p.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Critical Inventory & Cargo */}
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80">
                    <span className="font-semibold text-slate-300 text-xs block mb-1.5 flex items-center justify-between">
                      <span>Nearby Emergency Resources</span>
                      <span className="text-[10px] font-mono text-slate-400">{snapshot.inventory.length} items</span>
                    </span>
                    <div className="space-y-1 max-h-28 overflow-y-auto font-mono text-[11px]">
                      {snapshot.inventory.slice(0, 4).map((i) => (
                        <div key={i.id} className="flex items-center justify-between text-slate-300 py-0.5 border-b border-slate-900 last:border-0">
                          <span className="truncate">{i.name}</span>
                          <span className="text-cyan-400 shrink-0 ml-2">{i.quantity} {i.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 17: Emergency Response Actions Workflow */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                    <ListTodo className="w-4 h-4 text-cyan-400" />
                    <span>Emergency Response Action Tracker ({incidentActions.length})</span>
                  </h4>
                </div>

                {/* Add new action */}
                <form onSubmit={handleAddAction} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Enter urgent corrective mitigation action (e.g. Isolate circuit 3, dispatch medical team)..."
                    value={newActionText}
                    onChange={(e) => setNewActionText(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <input
                    type="text"
                    placeholder="Assignee"
                    value={newActionAssignee}
                    onChange={(e) => setNewActionAssignee(e.target.value)}
                    className="w-32 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold shrink-0 transition-colors"
                  >
                    Add Action
                  </button>
                </form>

                {/* Action Items List */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {incidentActions.map((action) => (
                    <div
                      key={action.id}
                      onClick={() => handleToggleActionStatus(action.id, action.status)}
                      className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        action.status === 'Completed'
                          ? 'bg-slate-950/60 border-slate-800 text-slate-400'
                          : 'bg-slate-950 border-slate-700/80 text-slate-100 hover:border-cyan-500/50'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            action.status === 'Completed' ? 'text-emerald-400' : 'text-slate-600'
                          }`}
                        />
                        <div>
                          <p className={`font-medium ${action.status === 'Completed' ? 'line-through text-slate-500' : ''}`}>
                            {action.actionText}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Assigned: <strong className="text-slate-300">{action.assignedTo}</strong>
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          action.status === 'Completed'
                            ? 'bg-emerald-950 text-emerald-400 font-bold'
                            : 'bg-amber-950 text-amber-300 font-bold'
                        }`}
                      >
                        {action.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-xl">
              Select or declare an incident to inspect command response.
            </div>
          )}
        </div>
      </div>

      {/* Modal 1: Declare Emergency */}
      {isDeclareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-slate-900 border border-red-500/50 rounded-xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
                <span>Declare Polar Emergency Incident</span>
              </h3>
              <button onClick={() => setIsDeclareModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <form onSubmit={handleDeclareEmergency} className="py-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Incident Headline / Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Primary Power Generator Lockout & Severe Fuel Line Weepage"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-red-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Emergency Category *</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as EmergencyType)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-red-500"
                  >
                    <option value="Equipment Failure">Equipment Failure</option>
                    <option value="Medical">Medical Emergency</option>
                    <option value="Fire">Fire / Smoke</option>
                    <option value="Vehicle Failure">Vehicle Failure / Crevasse</option>
                    <option value="Communication Failure">Communication Failure</option>
                    <option value="Supply Crisis">Supply Crisis</option>
                    <option value="Weather/Environmental">Severe Blizzard / Environmental</option>
                    <option value="Other">Other Operational Crisis</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Severity Classification *</label>
                  <select
                    value={formSeverity}
                    onChange={(e) => setFormSeverity(e.target.value as EmergencySeverity)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-red-300 font-bold focus:outline-none focus:border-red-500"
                  >
                    <option value="Critical (Level 1)">Critical (Level 1 - Life Safety)</option>
                    <option value="Severe (Level 2)">Severe (Level 2 - Essential Habitat)</option>
                    <option value="Moderate (Level 3)">Moderate (Level 3 - Station Operational)</option>
                    <option value="Advisory (Level 4)">Advisory (Level 4 - Scientific)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Affected Polar Station *</label>
                  <select
                    value={formStationId}
                    onChange={(e) => setFormStationId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-red-500"
                  >
                    {stations.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Precise Location Details</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Power Annex Bay 2 / Main Kitchen"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Incident Description &amp; Initial Findings *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Enter immediate symptoms, environmental conditions, affected equipment..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Required Response Resources</label>
                  <input
                    type="text"
                    placeholder="e.g. Trauma kit, snowcat tow cable, thermal imaging camera"
                    value={formResources}
                    onChange={(e) => setFormResources(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDeclareModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold shadow-lg shadow-red-950"
                >
                  Broadcast Emergency &amp; Lock Snapshot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
