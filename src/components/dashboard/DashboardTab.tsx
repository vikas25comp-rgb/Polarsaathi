import React, { useState } from 'react';
import {
  Users,
  Truck,
  Settings as SettingsIcon,
  Package,
  Route as RouteIcon,
  Bell,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  MapPin,
  CloudSun,
  Eye,
  Wind,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Compass,
  Plus,
  Zap,
  ChevronRight,
  ShieldAlert,
  Layers,
  Map as MapIcon,
  Check,
  Snowflake,
  Sun,
  Cloud,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../lib/dataStore';
import shipHeroImg from '../../assets/images/dhruvyan_ship_hero_1790499133990.jpg';
import explorerCardImg from '../../assets/images/polar_explorer_card_1790499154299.jpg';

interface DashboardTabProps {
  onNavigateTab: (tab: string, filterOrId?: string) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const userName = user?.fullName?.split(' ')[0] || 'Alina';

  // Layer filter states for map
  const [mapLayers, setMapLayers] = useState({
    personnel: true,
    vehicles: true,
    camps: true,
    incidents: true,
  });

  const toggleLayer = (layer: keyof typeof mapLayers) => {
    setMapLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  const [mapZoom, setMapZoom] = useState(1);

  // Dynamic values from dataStore
  const inventory = dataStore.getInventory();
  const cargo = dataStore.getCargo();
  const assets = dataStore.getAssets();
  const personnel = dataStore.getPersonnel();
  const emergencies = dataStore.getEmergencies();

  return (
    <div className="space-y-6 pb-12 select-none animate-fadeIn">
      {/* 1. Welcome Hero Banner Matching Image 2 */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#dbeafe] via-[#e0f2fe] to-[#eff6ff] border border-blue-200/80 p-6 sm:p-7 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Text & Metadata Strip */}
          <div className="lg:col-span-6 space-y-4 z-10">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0b1e36] tracking-tight">
                Good Morning, {userName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Here's your expedition overview for today.
              </p>
            </div>

            {/* Inset Metadata Badges Strip Matching Image 2 */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-xl border border-blue-100 shadow-xs text-xs">
                <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium uppercase leading-none">
                    Expedition
                  </span>
                  <span className="font-bold text-slate-800 text-[11px]">
                    South Pole Research Mission
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-xl border border-blue-100 shadow-xs text-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium uppercase leading-none">
                    Start Date
                  </span>
                  <span className="font-bold text-slate-800 text-[11px]">
                    12 Dec 2024
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-xl border border-blue-100 shadow-xs text-xs">
                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium uppercase leading-none">
                    Current Location
                  </span>
                  <span className="font-bold text-slate-800 text-[11px]">
                    McMurdo Station
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Center Graphic: Red Polar Research Vessel */}
          <div className="hidden lg:flex lg:col-span-3 items-center justify-center relative">
            <div className="w-48 h-28 rounded-2xl overflow-hidden shadow-md border border-white/60 relative group">
              <img
                src={shipHeroImg}
                alt="Polar Expedition Vessel"
                className="w-full h-full object-cover transform transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex items-end p-2">
                <span className="text-[10px] text-white font-mono font-medium">
                  R/V Polar Expedition
                </span>
              </div>
            </div>
          </div>

          {/* Right Weather Widget Card Matching Image 2 */}
          <div className="lg:col-span-3 flex justify-end">
            <div className="w-full sm:w-64 bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-blue-100 shadow-sm space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                  <CloudSun className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-800">McMurdo Station</h4>
                  <p className="text-[10.5px] text-slate-500">Partly Cloudy</p>
                </div>
              </div>

              <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                -12°C
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-600 font-medium">
                <div className="flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-blue-500" />
                  <span>Wind 18 km/h</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-blue-500" />
                  <span>Visibility 8 km</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Six Metric KPI Cards Row Matching Image 2 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Metric 1: Personnel */}
        <div
          onClick={() => onNavigateTab('personnel')}
          className="bg-white border border-slate-200/80 hover:border-blue-400 rounded-2xl p-4.5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center transition-transform group-hover:scale-105">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600">Personnel</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">48</p>
          </div>
          <div className="flex items-center justify-between pt-1 text-[11px]">
            <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
              <span>↑</span>
              <span>+2 new today</span>
            </span>
            <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* Metric 2: Vehicles */}
        <div
          onClick={() => onNavigateTab('assets')}
          className="bg-white border border-slate-200/80 hover:border-emerald-400 rounded-2xl p-4.5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center transition-transform group-hover:scale-105">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600">Vehicles</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">12</p>
          </div>
          <div className="flex items-center justify-between pt-1 text-[11px]">
            <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
              <span>↑</span>
              <span>1 on route</span>
            </span>
            <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* Metric 3: Equipment */}
        <div
          onClick={() => onNavigateTab('assets')}
          className="bg-white border border-slate-200/80 hover:border-purple-400 rounded-2xl p-4.5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center transition-transform group-hover:scale-105">
              <SettingsIcon className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600">Equipment</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">36</p>
          </div>
          <div className="flex items-center justify-between pt-1 text-[11px]">
            <span className="text-amber-600 font-semibold flex items-center gap-0.5">
              <span>↓</span>
              <span>3 under maintenance</span>
            </span>
            <div className="w-5 h-5 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* Metric 4: Inventory */}
        <div
          onClick={() => onNavigateTab('inventory')}
          className="bg-white border border-slate-200/80 hover:border-amber-400 rounded-2xl p-4.5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center transition-transform group-hover:scale-105">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600">Inventory</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">284</p>
          </div>
          <div className="flex items-center justify-between pt-1 text-[11px]">
            <span className="text-rose-600 font-semibold flex items-center gap-0.5">
              <span>↓</span>
              <span>Low stock: 7</span>
            </span>
            <div className="w-5 h-5 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* Metric 5: Routes */}
        <div
          onClick={() => onNavigateTab('expeditions')}
          className="bg-white border border-slate-200/80 hover:border-sky-400 rounded-2xl p-4.5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center transition-transform group-hover:scale-105">
              <RouteIcon className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600">Routes</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">5</p>
          </div>
          <div className="flex items-center justify-between pt-1 text-[11px]">
            <span className="text-blue-600 font-semibold flex items-center gap-0.5">
              <span>↑</span>
              <span>2 in progress</span>
            </span>
            <div className="w-5 h-5 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* Metric 6: Alerts */}
        <div
          onClick={() => onNavigateTab('emergency')}
          className="bg-white border border-slate-200/80 hover:border-rose-400 rounded-2xl p-4.5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center transition-transform group-hover:scale-105">
              <Bell className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600">Alerts</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">3</p>
          </div>
          <div className="flex items-center justify-between pt-1 text-[11px]">
            <span className="text-rose-600 font-semibold flex items-center gap-0.5">
              <span>↓</span>
              <span>1 high priority</span>
            </span>
            <div className="w-5 h-5 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Map + Recent Activity + Mission Progress (Grid Layout Matching Image 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Expedition Tactical Map (lg:col-span-7) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MapIcon className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900">Expedition Map</h3>
            </div>

            {/* Layer Filter Buttons Matching Image 2 */}
            <div className="flex items-center gap-3 text-xs font-medium">
              <button
                type="button"
                onClick={() => toggleLayer('personnel')}
                className={`flex items-center gap-1.5 transition-opacity cursor-pointer ${
                  mapLayers.personnel ? 'opacity-100 font-semibold' : 'opacity-40'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-slate-700">Personnel</span>
              </button>

              <button
                type="button"
                onClick={() => toggleLayer('vehicles')}
                className={`flex items-center gap-1.5 transition-opacity cursor-pointer ${
                  mapLayers.vehicles ? 'opacity-100 font-semibold' : 'opacity-40'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-700">Vehicles</span>
              </button>

              <button
                type="button"
                onClick={() => toggleLayer('camps')}
                className={`flex items-center gap-1.5 transition-opacity cursor-pointer ${
                  mapLayers.camps ? 'opacity-100 font-semibold' : 'opacity-40'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-700">Camps</span>
              </button>

              <button
                type="button"
                onClick={() => toggleLayer('incidents')}
                className={`flex items-center gap-1.5 transition-opacity cursor-pointer ${
                  mapLayers.incidents ? 'opacity-100 font-semibold' : 'opacity-40'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-slate-700">Incidents</span>
              </button>
            </div>
          </div>

          {/* Tactical Vector Map Canvas Matching Image 2 */}
          <div className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-inner flex items-center justify-center">
            {/* Arctic Satellite Terrain Texture SVG */}
            <svg
              className="absolute inset-0 w-full h-full object-cover"
              viewBox="0 0 800 480"
              preserveAspectRatio="xMidYMid slice"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <radialGradient id="glacierGlow" cx="40%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                  <stop offset="60%" stopColor="#0f294a" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#061224" stopOpacity="1" />
                </radialGradient>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                </pattern>
              </defs>

              {/* Ocean & Glacier Base */}
              <rect width="800" height="480" fill="url(#glacierGlow)" />
              <rect width="800" height="480" fill="url(#grid)" />

              {/* Continental Ice Shelf Contours */}
              <path
                d="M -20,280 Q 120,240 220,310 T 420,270 T 640,360 T 820,310 L 820,500 L -20,500 Z"
                fill="#133660"
                opacity="0.6"
              />
              <path
                d="M 50,140 Q 200,80 340,160 T 560,110 T 780,210 L 820,480 L 0,480 Z"
                fill="#1c477a"
                opacity="0.5"
              />

              {/* Route Lines Connecting Camps */}
              <path
                d="M 240,160 L 320,310 L 440,350 L 640,240"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                opacity="0.8"
              />
              <path
                d="M 440,350 L 520,260 L 640,240"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M 320,310 L 460,260"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            </svg>

            {/* Tactical Waypoint Pins */}
            {mapLayers.camps && (
              <>
                {/* Camp Alpha */}
                <div className="absolute top-[32%] left-[28%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-blue-400 text-white text-[11px] font-semibold shadow-lg">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>Camp Alpha</span>
                </div>

                {/* Camp Bravo */}
                <div className="absolute top-[65%] left-[38%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-amber-400 text-white text-[11px] font-semibold shadow-lg">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Camp Bravo</span>
                </div>

                {/* Base Camp */}
                <div className="absolute top-[72%] left-[55%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-purple-400 text-white text-[11px] font-semibold shadow-lg">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span>Base Camp</span>
                </div>
              </>
            )}

            {/* Incident Pin */}
            {mapLayers.incidents && (
              <div className="absolute top-[54%] left-[58%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-red-950/90 backdrop-blur-md px-3 py-1 rounded-full border border-red-500 text-white text-[11px] font-bold shadow-lg animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span>Ice Ridge Incident</span>
              </div>
            )}

            {/* Vehicle Pin */}
            {mapLayers.vehicles && (
              <div className="absolute top-[50%] left-[80%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-emerald-950/90 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-400 text-white text-[11px] font-bold shadow-lg">
                <Truck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Vehicle 04</span>
              </div>
            )}

            {/* Map Controls: Zoom Buttons */}
            <div className="absolute top-4 left-4 flex flex-col bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-700/80 overflow-hidden shadow-md text-white text-xs">
              <button
                type="button"
                onClick={() => setMapZoom((z) => Math.min(2, z + 0.2))}
                className="w-7 h-7 flex items-center justify-center hover:bg-slate-800 transition-colors border-b border-slate-700 font-bold"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setMapZoom((z) => Math.max(0.6, z - 0.2))}
                className="w-7 h-7 flex items-center justify-center hover:bg-slate-800 transition-colors font-bold"
              >
                -
              </button>
            </div>

            {/* Scale Bar & Compass Rose (Bottom Left) */}
            <div className="absolute bottom-4 left-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-900/80 border border-slate-700 flex items-center justify-center text-slate-300">
                <Compass className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded border border-slate-700 text-[10px] text-slate-300 font-mono">
                50 km
              </div>
            </div>

            {/* Coordinates Badge (Bottom Right) */}
            <div className="absolute bottom-4 right-4 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-slate-200 text-xs font-mono flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold leading-none">Antarctica</p>
                <p className="font-bold text-[11px] leading-tight">77.5° S, 166.4° E</p>
              </div>
            </div>
          </div>
        </div>

        {/* Center-Right: Recent Activity (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900">Recent Activity</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('reports')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Activity Feed List Matching Image 2 */}
          <div className="space-y-3">
            {/* Item 1 */}
            <div className="flex items-start gap-3 p-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">
                  Vehicle 04 reached Camp Alpha
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  2 hours ago • <span className="text-emerald-600 font-medium">78% battery</span>
                </p>
              </div>
            </div>

            {/* Item 2 */}
            <div className="flex items-start gap-3 p-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">
                  Personnel team checked in
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  3 hours ago • Camp Bravo
                </p>
              </div>
            </div>

            {/* Item 3 */}
            <div className="flex items-start gap-3 p-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <SettingsIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">
                  Equipment maintenance completed
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  4 hours ago • Generator #2
                </p>
              </div>
            </div>

            {/* Item 4 */}
            <div className="flex items-start gap-3 p-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">
                  Ice ridge instability detected
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  5 hours ago • Sector B
                </p>
              </div>
            </div>

            {/* Item 5 */}
            <div className="flex items-start gap-3 p-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                <RouteIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">
                  New route assigned: Base Camp → Camp Alpha
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  6 hours ago • 12 km
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Lower Content Grid: Mission Progress + Explorer Banner + Active Incidents + Weather + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Active Incidents Table (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Active Incidents Table Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <h3 className="font-bold text-sm text-slate-900">Active Incidents</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('emergency')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-mono text-[11px]">
                    <th className="pb-2.5 font-semibold">ID</th>
                    <th className="pb-2.5 font-semibold">Type</th>
                    <th className="pb-2.5 font-semibold">Location</th>
                    <th className="pb-2.5 font-semibold">Time</th>
                    <th className="pb-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 font-mono font-bold text-slate-800">INC-0034</td>
                    <td className="py-3 font-semibold text-slate-800">Ice Ridge Instability</td>
                    <td className="py-3 text-slate-600">Sector B</td>
                    <td className="py-3 text-slate-500 font-mono text-[11px]">5 hours ago</td>
                    <td className="py-3">
                      <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                        High
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 font-mono font-bold text-slate-800">INC-0033</td>
                    <td className="py-3 font-semibold text-slate-800">Equipment Fault</td>
                    <td className="py-3 text-slate-600">Camp Alpha</td>
                    <td className="py-3 text-slate-500 font-mono text-[11px]">1 day ago</td>
                    <td className="py-3">
                      <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Medium
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 font-mono font-bold text-slate-800">INC-0032</td>
                    <td className="py-3 font-semibold text-slate-800">Medical Alert</td>
                    <td className="py-3 text-slate-600">Base Camp</td>
                    <td className="py-3 text-slate-500 font-mono text-[11px]">1 day ago</td>
                    <td className="py-3">
                      <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Low
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Weather Forecast (Next 3 Days) Matching Image 2 */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CloudSun className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">Weather Forecast <span className="text-slate-400 font-normal text-xs">(Next 3 Days)</span></h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('predictive')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                <span>View Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              {/* Today */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <p className="text-xs font-semibold text-slate-500">Today</p>
                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
                  <CloudSun className="w-5 h-5" />
                </div>
                <p className="text-sm font-extrabold text-slate-900">-12° <span className="text-slate-400 font-normal">/ -20°</span></p>
                <p className="text-[11px] text-slate-500">Light Snow</p>
              </div>

              {/* Tomorrow */}
              <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2">
                <p className="text-xs font-semibold text-slate-500">Tomorrow</p>
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                  <Snowflake className="w-5 h-5" />
                </div>
                <p className="text-sm font-extrabold text-slate-900">-15° <span className="text-slate-400 font-normal">/ -24°</span></p>
                <p className="text-[11px] text-blue-600 font-medium">Snow Showers</p>
              </div>

              {/* Day 3 */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <p className="text-xs font-semibold text-slate-500">Day 3</p>
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
                  <Cloud className="w-5 h-5" />
                </div>
                <p className="text-sm font-extrabold text-slate-900">-14° <span className="text-slate-400 font-normal">/ -22°</span></p>
                <p className="text-[11px] text-slate-500">Partly Cloudy</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Mission Progress + Explore Banner + Quick Actions (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Mission Progress Card with Donut Chart (68%) Matching Image 2 */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900">Mission Progress</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              {/* Radial Donut Chart */}
              <div className="sm:col-span-5 flex justify-center">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#f1f5f9"
                      strokeWidth="10"
                      fill="none"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#0284c7"
                      strokeWidth="10"
                      strokeDasharray="251.2"
                      strokeDashoffset="80.38" // 68%
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-center">
                    <span className="text-2xl font-black text-slate-900 font-sans">
                      68%
                    </span>
                  </div>
                </div>
              </div>

              {/* Checklist Matching Image 2 */}
              <div className="sm:col-span-7 space-y-2 text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Initial Setup</span>
                </div>
                <div className="flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Research Operations</span>
                </div>
                <div className="flex items-center gap-2 text-blue-600">
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-blue-600" />
                  <span>Data Collection</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                  <span>Return Expedition</span>
                </div>
              </div>
            </div>
          </div>

          {/* Explore Further. Operate Smarter. Photographic Banner Matching Image 2 */}
          <div className="relative rounded-3xl overflow-hidden shadow-sm aspect-[16/8] flex flex-col justify-between p-5 text-white group cursor-pointer">
            <img
              src={explorerCardImg}
              alt="Explore Further"
              className="absolute inset-0 w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-transparent" />

            <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="text-base font-extrabold tracking-tight">
                  Explore Further.
                </h4>
                <p className="text-base font-extrabold text-blue-300 tracking-tight">
                  Operate Smarter.
                </p>
              </div>

              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40">
                <Compass className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="relative z-10">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 group-hover:bg-blue-600 group-hover:border-blue-500 transition-colors">
                <ArrowRight className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          {/* Quick Actions Matching Image 2 */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900">Quick Actions</h3>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onNavigateTab('personnel')}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/80 border border-slate-200/70 hover:border-blue-300 text-left transition-all flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center transition-transform group-hover:scale-110">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">Add Personnel</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('assets')}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-200/70 hover:border-emerald-300 text-left transition-all flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center transition-transform group-hover:scale-110">
                  <Truck className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">Register Vehicle</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('assets')}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-purple-50/80 border border-slate-200/70 hover:border-purple-300 text-left transition-all flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center transition-transform group-hover:scale-110">
                  <SettingsIcon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-purple-700">Log Equipment</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('expeditions')}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-sky-50/80 border border-slate-200/70 hover:border-sky-300 text-left transition-all flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center transition-transform group-hover:scale-110">
                  <RouteIcon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-sky-700">Plan Route</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
