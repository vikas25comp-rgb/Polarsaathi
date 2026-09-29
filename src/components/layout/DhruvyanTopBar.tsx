import React, { useState } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  User,
  LogOut,
  ShieldCheck,
  Database,
  Radio,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import { isSupabaseConfigured } from '../../lib/supabase';

interface DhruvyanTopBarProps {
  onOpenSearch: () => void;
  onOpenEmergency?: () => void;
  activeTab: string;
}

export const DhruvyanTopBar: React.FC<DhruvyanTopBarProps> = ({
  onOpenSearch,
  onOpenEmergency,
  activeTab,
}) => {
  const { user, logout, switchRole, availableRoles } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const isSupabaseLive = isSupabaseConfigured();

  const notifications = [
    { id: 1, title: 'Ice ridge instability in Sector B', time: '5h ago', priority: 'high' },
    { id: 2, title: 'Basler BT-67 supply flight delayed', time: '1d ago', priority: 'medium' },
    { id: 3, title: 'Vehicle 04 battery nominal at Camp Alpha', time: '2h ago', priority: 'low' },
  ];

  return (
    <header className="bg-white border-b border-slate-200/90 sticky top-0 z-20 px-6 py-3 transition-all select-none">
      <div className="flex items-center justify-between gap-4">
        {/* Search Bar matching Image 2 */}
        <div className="flex-1 max-w-xl">
          <div
            onClick={onOpenSearch}
            className="flex items-center gap-3 px-4 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 rounded-2xl text-slate-400 hover:text-slate-600 transition-all cursor-pointer shadow-xs group"
          >
            <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
            <span className="text-xs sm:text-sm text-slate-500 truncate flex-1">
              Search personnel, vehicles, equipment, locations...
            </span>
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono bg-white border border-slate-200 text-slate-400 rounded-md">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right Action Icons & User Profile */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {/* Database Connection Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-mono">
            <Database className={`w-3.5 h-3.5 ${isSupabaseLive ? 'text-emerald-500' : 'text-blue-500'}`} />
            <span>{isSupabaseLive ? 'Supabase DB' : 'Local Offline DB'}</span>
          </div>

          {/* Notification Bell with Badge 3 matching Image 2 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
              title="Operational Alerts"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-sm">
                3
              </span>
            </button>

            {/* Notification Dropdown */}
            {notifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 text-xs animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-800">Operational Alerts</span>
                  <span className="text-[11px] text-blue-600 font-semibold cursor-pointer">Mark read</span>
                </div>
                <div className="py-2 space-y-2">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 cursor-pointer"
                    >
                      <p className="font-semibold text-slate-800 text-xs">{n.title}</p>
                      <span className="text-[10px] text-slate-400 font-mono">{n.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Matching Image 2 ("Alina Ali / Command Admin") */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {/* Avatar circle */}
              <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 border border-slate-300 shrink-0">
                <img
                  src={
                    user?.avatarUrl ||
                    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150'
                  }
                  alt={user?.fullName || 'Alina Ali'}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* User text details */}
              <div className="text-left hidden sm:block leading-tight">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {user?.fullName || 'Alina Ali'}
                </p>
                <p className="text-[10.5px] text-slate-500 font-medium truncate">
                  {user?.role === 'Administrator' ? 'Command Admin' : user?.role || 'Command Admin'}
                </p>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Profile & Role Switcher Dropdown */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-2.5 z-50 text-xs animate-fadeIn">
                <div className="p-2 border-b border-slate-100">
                  <p className="font-bold text-slate-900">{user?.fullName || 'Alina Ali'}</p>
                  <p className="text-[11px] text-slate-500 font-mono truncate">{user?.email || 'alina.ali@dhruvyan.polar'}</p>
                </div>

                <div className="py-2">
                  <p className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    Switch Operational Clearance:
                  </p>
                  {availableRoles.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        switchRole(r);
                        setProfileDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors ${
                        user?.role === r
                          ? 'bg-blue-50 text-blue-700 font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{r}</span>
                      {user?.role === r && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-2 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out (Return to Landing)</span>
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
