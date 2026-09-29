import React from 'react';
import {
  LayoutDashboard,
  Compass,
  Package,
  Layers,
  LineChart,
  Users,
  Wrench,
  ShieldAlert,
  Sliders,
  Bot,
  FileText,
  Settings,
} from 'lucide-react';
import { dataStore } from '../../lib/dataStore';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange }) => {
  const criticalInventoryCount = dataStore
    .getInventory()
    .filter((i) => dataStore.calculateInventoryMetrics(i).riskLevel === 'Critical').length;
  const delayedCargoCount = dataStore.getCargo().filter((c) => c.status === 'Delayed').length;
  const overdueAssetCount = dataStore.getAssets().filter((a) => a.operationalStatus === 'Maintenance Due' || a.operationalStatus === 'Faulty').length;
  const activeEmergenciesCount = dataStore.getEmergencies().filter((e) => e.status === 'Active').length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expeditions', label: 'Expeditions', icon: Compass },
    { id: 'cargo', label: 'Cargo Tracking', icon: Package, badge: delayedCargoCount > 0 ? delayedCargoCount : null, badgeColor: 'bg-amber-500' },
    { id: 'inventory', label: 'Inventory', icon: Layers, badge: criticalInventoryCount > 0 ? criticalInventoryCount : null, badgeColor: 'bg-red-500' },
    { id: 'predictive', label: 'Predictive & Resupply', icon: LineChart },
    { id: 'personnel', label: 'Personnel', icon: Users },
    { id: 'assets', label: 'Assets & Maint.', icon: Wrench, badge: overdueAssetCount > 0 ? overdueAssetCount : null, badgeColor: 'bg-amber-500' },
    { id: 'emergency', label: 'Emergency Center', icon: ShieldAlert, badge: activeEmergenciesCount > 0 ? activeEmergenciesCount : null, badgeColor: 'bg-red-600 animate-pulse' },
    { id: 'simulator', label: 'What-If Simulator', icon: Sliders },
    { id: 'assistant', label: 'AI Assistant', icon: Bot },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings & DB', icon: Settings },
  ];

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-[57px] z-30 overflow-x-auto scrollbar-none">
      <div className="max-w-7xl mx-auto flex items-center gap-1 px-4 py-1.5 min-w-max">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all relative ${
                isActive
                  ? 'bg-cyan-950/70 text-cyan-300 font-semibold border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
              {item.badge !== null && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold text-white ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
