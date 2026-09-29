import React, { useState, useMemo } from 'react';
import { Search, X, Package, Box, Users, Wrench, ShieldAlert, Compass, Building2 } from 'lucide-react';
import { dataStore } from '../../lib/dataStore';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string, itemId?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, onNavigateTab }) => {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const cargo = dataStore.getCargo();
  const containers = dataStore.getContainers();
  const personnel = dataStore.getPersonnel();
  const assets = dataStore.getAssets();
  const stations = dataStore.getStations();
  const expeditions = dataStore.getExpeditions();
  const emergencies = dataStore.getEmergencies();

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    const matches: Array<{
      id: string;
      title: string;
      subtitle: string;
      type: string;
      tab: string;
      badge: string;
      icon: any;
    }> = [];

    // Search Cargo
    if (categoryFilter === 'all' || categoryFilter === 'cargo') {
      cargo.forEach((c) => {
        if (
          c.trackingNumber.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.currentLocation.toLowerCase().includes(q)
        ) {
          matches.push({
            id: c.id,
            title: `${c.trackingNumber} - ${c.name}`,
            subtitle: `Status: ${c.status} | Priority: ${c.priority} | Location: ${c.currentLocation}`,
            type: 'Cargo Consignment',
            tab: 'cargo',
            badge: c.status,
            icon: Package,
          });
        }
      });
    }

    // Search Containers
    if (categoryFilter === 'all' || categoryFilter === 'containers') {
      containers.forEach((cont) => {
        if (cont.code.toLowerCase().includes(q) || cont.type.toLowerCase().includes(q) || cont.currentStationOrHub.toLowerCase().includes(q)) {
          matches.push({
            id: cont.id,
            title: `${cont.code} (${cont.type})`,
            subtitle: `Status: ${cont.status} | Location: ${cont.currentStationOrHub}`,
            type: 'Container',
            tab: 'cargo',
            badge: cont.status,
            icon: Box,
          });
        }
      });
    }

    // Search Personnel
    if (categoryFilter === 'all' || categoryFilter === 'personnel') {
      personnel.forEach((p) => {
        if (
          p.name.toLowerCase().includes(q) ||
          p.badgeNumber.toLowerCase().includes(q) ||
          p.role.toLowerCase().includes(q) ||
          p.specialization.toLowerCase().includes(q)
        ) {
          matches.push({
            id: p.id,
            title: `${p.name} (${p.badgeNumber})`,
            subtitle: `${p.role} | Specialization: ${p.specialization} | Location: ${p.currentLocation}`,
            type: 'Personnel',
            tab: 'personnel',
            badge: p.status,
            icon: Users,
          });
        }
      });
    }

    // Search Assets
    if (categoryFilter === 'all' || categoryFilter === 'assets') {
      assets.forEach((a) => {
        if (
          a.code.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          a.serialNumber.toLowerCase().includes(q)
        ) {
          matches.push({
            id: a.id,
            title: `${a.code} - ${a.name}`,
            subtitle: `Status: ${a.operationalStatus} | Category: ${a.category} | Hours: ${a.operatingHours} hrs`,
            type: 'Equipment & Asset',
            tab: 'assets',
            badge: a.operationalStatus,
            icon: Wrench,
          });
        }
      });
    }

    // Search Stations
    if (categoryFilter === 'all' || categoryFilter === 'stations') {
      stations.forEach((s) => {
        if (s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.region.toLowerCase().includes(q)) {
          matches.push({
            id: s.id,
            title: `${s.name} (${s.code})`,
            subtitle: `Region: ${s.region} | Temp: ${s.temperatureCelsius}°C | Comm: ${s.communicationStatus}`,
            type: 'Polar Station',
            tab: 'dashboard',
            badge: s.operationalStatus,
            icon: Building2,
          });
        }
      });
    }

    // Search Expeditions
    if (categoryFilter === 'all' || categoryFilter === 'expeditions') {
      expeditions.forEach((e) => {
        if (e.code.toLowerCase().includes(q) || e.name.toLowerCase().includes(q) || e.leaderName.toLowerCase().includes(q)) {
          matches.push({
            id: e.id,
            title: `${e.code} - ${e.name}`,
            subtitle: `Leader: ${e.leaderName} | Personnel: ${e.personnelCount} | Status: ${e.status}`,
            type: 'Expedition',
            tab: 'expeditions',
            badge: e.status,
            icon: Compass,
          });
        }
      });
    }

    // Search Emergencies
    if (categoryFilter === 'all' || categoryFilter === 'emergencies') {
      emergencies.forEach((emg) => {
        if (
          emg.incidentCode.toLowerCase().includes(q) ||
          emg.title.toLowerCase().includes(q) ||
          emg.type.toLowerCase().includes(q) ||
          emg.description.toLowerCase().includes(q)
        ) {
          matches.push({
            id: emg.id,
            title: `${emg.incidentCode}: ${emg.title}`,
            subtitle: `Severity: ${emg.severity} | Status: ${emg.status} | Station: ${emg.stationId}`,
            type: 'Emergency Incident',
            tab: 'emergency',
            badge: emg.status,
            icon: ShieldAlert,
          });
        }
      });
    }

    return matches.slice(0, 15);
  }, [query, categoryFilter, cargo, containers, personnel, assets, stations, expeditions, emergencies]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-3xl bg-slate-900 border border-cyan-500/30 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header Search Input */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Cargo ID (e.g. CRG-2026), Container, Personnel, Asset, Station, Emergency..."
            autoFocus
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-base focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-200 p-1">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 text-xs font-mono text-slate-400 hover:text-slate-200 border border-slate-700 rounded bg-slate-800"
          >
            ESC
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-2 border-b border-slate-800 bg-slate-950/50 flex flex-wrap gap-1.5 text-xs">
          {['all', 'cargo', 'containers', 'personnel', 'assets', 'stations', 'expeditions', 'emergencies'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded capitalize font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 divide-y divide-slate-800/40">
          {results.length > 0 ? (
            results.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => {
                    onNavigateTab(item.tab, item.id);
                    onClose();
                  }}
                  className="pt-1.5 first:pt-0 cursor-pointer group p-2.5 rounded-lg hover:bg-cyan-950/30 hover:border-cyan-500/30 border border-transparent transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded bg-slate-800 group-hover:bg-cyan-900/40 text-cyan-400 shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs uppercase tracking-wider font-semibold text-cyan-400/80">
                            {item.type}
                          </span>
                        </div>
                        <h4 className="text-sm font-medium text-slate-100 group-hover:text-cyan-200">{item.title}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">{item.subtitle}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60 shrink-0">
                      {item.badge}
                    </span>
                  </div>
                </div>
              );
            })
          ) : query ? (
            <div className="text-center py-12 text-slate-400">
              <Search className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
              <p className="text-sm font-medium">No matching records found for "{query}"</p>
              <p className="text-xs text-slate-500 mt-1">Try searching by tracking number, serial, person name, or category.</p>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-500 text-xs">
              <p>Type above to instantly search across all polar stations, cargo, inventory, personnel, assets, and emergency alerts.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <span className="px-2 py-1 bg-slate-800 rounded text-slate-400 font-mono text-[11px]">CRG-2026-089</span>
                <span className="px-2 py-1 bg-slate-800 rounded text-slate-400 font-mono text-[11px]">Bharati</span>
                <span className="px-2 py-1 bg-slate-800 rounded text-slate-400 font-mono text-[11px]">Generator</span>
                <span className="px-2 py-1 bg-slate-800 rounded text-slate-400 font-mono text-[11px]">Dr. Rajeshwari</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
