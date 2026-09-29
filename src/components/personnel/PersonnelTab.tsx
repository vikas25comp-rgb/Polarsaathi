import React, { useState } from 'react';
import {
  Users,
  Plus,
  MapPin,
  HeartPulse,
  Award,
  Navigation,
  Search,
  Building2,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { dataStore } from '../../lib/dataStore';
import { Personnel, PersonnelMovement, PersonnelStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const PersonnelTab: React.FC = () => {
  const { user } = useAuth();
  const [personnelList, setPersonnelList] = useState<Personnel[]>(dataStore.getPersonnel());
  const [selectedPerson, setSelectedPerson] = useState<Personnel | null>(personnelList[0] || null);

  // Filters
  const [stationFilter, setStationFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);

  // Deploy Form State
  const [formName, setFormName] = useState('');
  const [formBadge, setFormBadge] = useState('');
  const [formRole, setFormRole] = useState('Research Scientist');
  const [formSpecialization, setFormSpecialization] = useState('Atmospheric Physics');
  const [formStationId, setFormStationId] = useState('st-bharati');
  const [formExpeditionId, setFormExpeditionId] = useState('exp-isea-44');
  const [formBloodGroup, setFormBloodGroup] = useState('O+');
  const [formEmergencyContact, setFormEmergencyContact] = useState('+91-98765-43210 (Family)');
  const [formLocation, setFormLocation] = useState('Bharati Station');
  const [formCertifications, setFormCertifications] = useState('Polar Field Safety, Wilderness First Aid');

  // Movement Form State
  const [newLocation, setNewLocation] = useState('');
  const [transportMode, setTransportMode] = useState<PersonnelMovement['transportMode']>('PistenBully Snowcat');

  const stations = dataStore.getStations();
  const expeditions = dataStore.getExpeditions();

  const handleDeployPersonnel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;

    const badge = formBadge || `POL-IND-${Math.floor(10000 + Math.random() * 90000)}`;

    const created = dataStore.createPersonnel(
      {
        badgeNumber: badge,
        name: formName,
        role: formRole,
        specialization: formSpecialization,
        expeditionId: formExpeditionId,
        stationId: formStationId,
        currentLocation: formLocation || 'Bharati Station',
        status: 'At Station',
        bloodGroup: formBloodGroup,
        emergencyContact: formEmergencyContact,
        certifications: formCertifications.split(',').map((s) => s.trim()),
        deployedDate: new Date().toISOString().split('T')[0],
        rotationEndDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
      },
      user?.fullName || 'Expedition Admin'
    );

    const updated = dataStore.getPersonnel();
    setPersonnelList(updated);
    setSelectedPerson(created);
    setIsDeployModalOpen(false);

    // Reset Form
    setFormName('');
    setFormBadge('');
  };

  const handleRecordMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerson || !newLocation) return;

    const updated = dataStore.updatePersonnelMovement(
      selectedPerson.id,
      newLocation,
      transportMode,
      user?.fullName || 'Expedition Commander'
    );

    const list = dataStore.getPersonnel();
    setPersonnelList(list);
    setSelectedPerson(updated);
    setIsMoveModalOpen(false);
    setNewLocation('');
  };

  const filteredPersonnel = personnelList.filter((p) => {
    if (stationFilter !== 'all' && p.stationId !== stationFilter) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.badgeNumber.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        p.specialization.toLowerCase().includes(q)
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
            <Users className="w-5 h-5 text-cyan-400" />
            <span>Personnel &amp; Field Movement Tracking</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Polar personnel roster, role credentials, medical &amp; blood groups, and traverse movement waypoints.
          </p>
        </div>

        <button
          onClick={() => {
            setFormBadge(`POL-IND-${Math.floor(10000 + Math.random() * 90000)}`);
            setIsDeployModalOpen(true);
          }}
          className="flex items-center gap-2 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-cyan-900/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Deploy New Crew Member</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-cyan-400" />
          <input
            type="text"
            placeholder="Search name, badge number, medical role, glaciologist..."
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
            <option value="all">All Statuses</option>
            <option value="At Station">At Station</option>
            <option value="Field Camp">Field Camp / Traverse</option>
            <option value="In Transit">In Transit</option>
            <option value="Medical Leave">Medical Leave</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Personnel Roster + Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Personnel Cards List */}
        <div className="lg:col-span-5 space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
          {filteredPersonnel.map((person) => {
            const isSelected = selectedPerson?.id === person.id;
            const station = stations.find((s) => s.id === person.stationId);
            return (
              <div
                key={person.id}
                onClick={() => setSelectedPerson(person)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-500/60 shadow-lg shadow-cyan-950/40'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-cyan-400">{person.badgeNumber}</span>
                      <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-800 text-red-300 font-bold border border-red-900/40">
                        {person.bloodGroup}
                      </span>
                      {person.isSeedDemo && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-400">
                          Demo
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-semibold text-slate-100 mt-1">{person.name}</h4>
                    <p className="text-[11px] text-cyan-400/90 font-medium">{person.role}</p>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      person.status === 'At Station'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : person.status === 'Field Camp'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-blue-950 text-blue-300 border border-blue-800'
                    }`}
                  >
                    {person.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">{person.currentLocation}</span>
                  </div>
                  <div className="text-right text-slate-300">
                    Base: <strong className="text-slate-100">{station?.name.replace(' Station', '')}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Personnel Details & Movement Logger */}
        <div className="lg:col-span-7">
          {selectedPerson ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                      {selectedPerson.badgeNumber}
                    </span>
                    <span className="text-xs font-bold text-red-400 font-mono bg-red-950/60 px-2 py-0.5 rounded border border-red-900/60 flex items-center gap-1">
                      <HeartPulse className="w-3 h-3" />
                      <span>Blood Group: {selectedPerson.bloodGroup}</span>
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-100 mt-1.5">{selectedPerson.name}</h3>
                  <p className="text-xs text-cyan-400 font-medium">{selectedPerson.role} — {selectedPerson.specialization}</p>
                </div>

                {/* Section 21: Log Movement Action */}
                <button
                  onClick={() => {
                    setNewLocation(selectedPerson.currentLocation);
                    setIsMoveModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow transition-colors self-start sm:self-auto"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Record Movement</span>
                </button>
              </div>

              {/* Status and Location Banner */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-sans">Current Physical Location</span>
                  <span className="text-sm font-bold text-cyan-300 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    <span>{selectedPerson.currentLocation}</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px] uppercase font-sans">Operational Status</span>
                  <span className="font-bold text-slate-200">{selectedPerson.status}</span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-sans">Assigned Station</span>
                  <span className="text-sm font-bold text-slate-200">
                    {stations.find((s) => s.id === selectedPerson.stationId)?.name}
                  </span>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-sans">Deployment Date</span>
                  <span className="text-sm font-bold text-slate-200">{selectedPerson.deployedDate}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 col-span-2 sm:col-span-1">
                  <span className="text-slate-500 block text-[10px] uppercase font-sans">Rotation End Date</span>
                  <span className="text-sm font-bold text-slate-200">{selectedPerson.rotationEndDate}</span>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                <span className="text-slate-500 block text-[10px] uppercase font-sans">Primary Emergency Contact &amp; Next of Kin</span>
                <span className="font-bold text-slate-200 font-mono mt-0.5 block">{selectedPerson.emergencyContact}</span>
              </div>

              {/* Certifications & Badges */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Polar Field Qualifications &amp; Certifications</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPerson.certifications.map((cert, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-slate-950 border border-cyan-800/40 text-cyan-300 rounded-lg text-xs font-medium"
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-xl">
              Select a crew member to inspect deployment file.
            </div>
          )}
        </div>
      </div>

      {/* Modal 1: Deploy Personnel */}
      {isDeployModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <span>Deploy New Polar Team Member</span>
              </h3>
              <button onClick={() => setIsDeployModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <form onSubmit={handleDeployPersonnel} className="py-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Badge / Serial ID *</label>
                  <input
                    type="text"
                    required
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Anandita Roy"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Role / Function *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chief Glaciologist"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Scientific / Technical Field</label>
                  <input
                    type="text"
                    value={formSpecialization}
                    onChange={(e) => setFormSpecialization(e.target.value)}
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
                  <label className="block text-slate-300 font-medium mb-1">Blood Group</label>
                  <select
                    value={formBloodGroup}
                    onChange={(e) => setFormBloodGroup(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Initial Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Bharati Station Command Annex"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Emergency Contact &amp; Next of Kin</label>
                  <input
                    type="text"
                    value={formEmergencyContact}
                    onChange={(e) => setFormEmergencyContact(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Certifications (comma-separated)</label>
                  <input
                    type="text"
                    value={formCertifications}
                    onChange={(e) => setFormCertifications(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDeployModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold shadow"
                >
                  Confirm Deployment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Record Movement (Acceptance Test 3) */}
      {isMoveModalOpen && selectedPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-cyan-400" />
                <span>Record Personnel Movement</span>
              </h3>
              <button onClick={() => setIsMoveModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordMovement} className="py-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Selected Personnel:</span>
                <span className="font-bold text-sm text-slate-100">{selectedPerson.name}</span>
                <p className="text-[11px] text-cyan-400 font-mono mt-0.5">
                  Origin: {selectedPerson.currentLocation}
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">New Destination Location *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Field Camp Polar Plateau (70°S) or Schirmacher Oasis"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Transport Mode</label>
                <select
                  value={transportMode}
                  onChange={(e) => setTransportMode(e.target.value as PersonnelMovement['transportMode'])}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="PistenBully Snowcat">PistenBully Snowcat</option>
                  <option value="Ski-Plane (Basler BT-67)">Ski-Plane (Basler BT-67)</option>
                  <option value="Research Vessel (MV Bharati)">Research Vessel (MV Bharati)</option>
                  <option value="Helicopter">Helicopter</option>
                  <option value="Commercial Air">Commercial Air</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMoveModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold shadow"
                >
                  Commit Movement Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
