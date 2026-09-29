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
import { DhruvyanLogo } from '../common/DhruvyanLogo';
import { dataStore } from '../../lib/dataStore';

interface DhruvyanSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed?: boolean;
}

export const DhruvyanSidebar: React.FC<DhruvyanSidebarProps> = ({
  activeTab,
  onTabChange,
  collapsed = false,
}) => {
  const delayedCargoCount = dataStore.getCargo().filter((c) => c.status === 'Delayed').length;
  const criticalInventoryCount = dataStore
    .getInventory()
    .filter((i) => dataStore.calculateInventoryMetrics(i).riskLevel === 'Critical').length;
  const activeEmergenciesCount = dataStore.getEmergencies().filter((e) => e.status === 'Active').length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expeditions', label: 'Expedition', icon: Compass },
    { id: 'cargo', label: 'Cardboard Tracking', displayLabel: 'Cargo Tracking', icon: Package, badge: delayedCargoCount > 0 ? delayedCargoCount : null },
    { id: 'inventory', label: 'Inventory', icon: Layers, badge: criticalInventoryCount > 0 ? criticalInventoryCount : null },
    { id: 'predictive', label: 'Predictive & Resupply', icon: LineChart },
    { id: 'personnel', label: 'Personnel', icon: Users },
    { id: 'assets', label: 'Assets & Maintenance', icon: Wrench },
    { id: 'emergency', label: 'Emergency Center', icon: ShieldAlert, badge: activeEmergenciesCount > 0 ? activeEmergenciesCount : null },
    { id: 'simulator', label: 'Simulator', icon: Sliders },
    { id: 'assistant', label: 'AI Assistant', icon: Bot },
    { id: 'reports', label: 'Report', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`bg-[#0b1a30] text-slate-300 flex flex-col justify-between shrink-0 h-screen sticky top-0 border-r border-[#152a4a] z-30 transition-all select-none overflow-y-auto scrollbar-thin ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Header with Brand */}
      <div>
        <div className="p-5 border-b border-[#162e52] flex items-center justify-between">
          <DhruvyanLogo theme="dark" collapsed={collapsed} />
        </div>

        {/* Navigation Items List Matching Image 2 */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                title={item.displayLabel || item.label}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all relative group cursor-pointer ${
                  isActive
                    ? 'bg-[#1e40af] text-white shadow-md shadow-blue-950/40 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-[#132744]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-cyan-300'
                  }`}
                />
                {!collapsed && (
                  <span className="truncate tracking-wide text-[12.5px]">
                    {item.label}
                  </span>
                )}
                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white shrink-0 ${
                      item.id === 'emergency' ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Snowy Mountain Silhouette Watermark Matching Image 2 */}
      {!collapsed && (
        <div className="relative p-5 pt-8 overflow-hidden border-t border-[#162e52]">
          {/* Mountain Silhouette SVG Background */}
          <div className="absolute inset-0 pointer-events-none opacity-25 flex items-end">
            <svg
              viewBox="0 0 300 120"
              className="w-full h-auto"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0 120 L30 75 L65 105 L110 50 L155 95 L200 40 L250 85 L300 35 L300 120 Z"
                fill="#38bdf8"
              />
              <path
                d="M40 120 L80 60 L130 110 L180 30 L230 90 L280 45 L300 70 L300 120 Z"
                fill="#ffffff"
                opacity="0.6"
              />
            </svg>
          </div>

          <div className="relative z-10 space-y-0.5 leading-tight">
            <p className="text-[13px] font-extrabold text-white tracking-wide">
              One Mission.
            </p>
            <p className="text-[13px] font-extrabold text-white tracking-wide">
              Every Asset.
            </p>
            <p className="text-[13px] font-extrabold text-white tracking-wide">
              Always Visible.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
};
