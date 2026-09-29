import React, { useState } from 'react';
import { ShieldAlert, Search, Thermometer, User, ChevronDown, Compass, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ConnectionBadge } from '../common/ConnectionBadge';
import { dataStore } from '../../lib/dataStore';
import { Role } from '../../types';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenEmergency: () => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch, onOpenEmergency }) => {
  const { user, switchRole, availableRoles, logout } = useAuth();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const stations = dataStore.getStations();
  const activeEmergencies = dataStore.getEmergencies().filter((e) => e.status === 'Active' || e.status === 'Investigating');
  const criticalAlerts = dataStore.getAlerts().filter((a) => a.severity === 'critical' && !a.read);

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-cyan-950/80 sticky top-0 z-40 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo & Operational Callout */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-cyan-900/30 border border-cyan-300/30">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-base text-slate-100 flex items-center gap-1.5">
                POLAR-SATHI
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  SIH26062
                </span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Integrated Polar Expedition Logistics & Emergency System
            </p>
          </div>
        </div>

        {/* Live Station Weather Ticker (Desktop) */}
        <div className="hidden lg:flex items-center gap-4 px-3 py-1 bg-slate-950/70 border border-slate-800 rounded-lg text-xs font-mono">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-sans font-semibold">Polar Telemetry:</span>
          </div>
          {stations.map((st) => (
            <div key={st.id} className="flex items-center gap-1.5 text-slate-300 border-l border-slate-800 pl-3">
              <span className="font-semibold text-slate-200">{st.name.replace(' Station', '')}:</span>
              <span className={st.temperatureCelsius < -20 ? 'text-cyan-300 font-bold' : 'text-blue-300 font-bold'}>
                {st.temperatureCelsius}°C
              </span>
              <span className="text-slate-500 text-[10px]">({st.windSpeedKts} kts)</span>
            </div>
          ))}
        </div>

        {/* Actions & Status Cluster */}
        <div className="flex items-center gap-2.5">
          {/* Quick Search */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-medium transition-colors"
            title="Search entire polar database (Cargo, Inventory, Personnel, Assets, Emergencies)"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Global Search</span>
            <kbd className="hidden sm:inline text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
              ⌘K
            </kbd>
          </button>

          {/* Connection Status Badge (Offline-first) */}
          <ConnectionBadge />

          {/* Permanent Emergency Action Beacon */}
          <button
            onClick={onOpenEmergency}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md ${
              activeEmergencies.length > 0 || criticalAlerts.length > 0
                ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse shadow-red-900/50'
                : 'bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/60'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-white shrink-0" />
            <span className="hidden sm:inline">EMERGENCY CENTER</span>
            {(activeEmergencies.length > 0 || criticalAlerts.length > 0) && (
              <span className="px-1.5 py-0.2 rounded-full bg-white text-red-700 font-mono text-[10px] font-extrabold">
                {activeEmergencies.length + criticalAlerts.length}
              </span>
            )}
          </button>

          {/* Role & User Profile Switcher */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg text-xs font-medium text-slate-200 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-cyan-700 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-xs font-semibold leading-tight text-slate-100">{user?.fullName || 'Station Officer'}</p>
                <p className="text-[10px] text-cyan-400 font-mono">{user?.role || 'Administrator'}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 text-xs">
                <div className="p-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-cyan-400" />
                    <div>
                      <p className="font-semibold text-slate-100">{user?.fullName}</p>
                      <p className="text-[11px] text-slate-400">{user?.email}</p>
                    </div>
                  </div>
                </div>

                <div className="py-2">
                  <p className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Switch Operational Role
                  </p>
                  {availableRoles.map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        switchRole(role);
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                        user?.role === role
                          ? 'bg-cyan-950 text-cyan-300 font-semibold border border-cyan-800/40'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                      }`}
                    >
                      <span>{role}</span>
                      {user?.role === role && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      logout();
                      setRoleDropdownOpen(false);
                    }}
                    className="w-full text-left px-2 py-1.5 text-red-400 hover:bg-red-950/40 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Log Out (Protected Route)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
