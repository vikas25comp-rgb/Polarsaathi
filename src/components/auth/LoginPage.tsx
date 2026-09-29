import React, { useState } from 'react';
import {
  Compass,
  ArrowRight,
  Play,
  Users,
  Truck,
  Settings as SettingsIcon,
  Package,
  Route as RouteIcon,
  Bell,
  Lock,
  Mail,
  User,
  Building2,
  Eye,
  EyeOff,
  LogIn,
  Sparkles,
  X,
  ShieldCheck,
  CheckCircle2,
  Radio,
  Clock,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import { DhruvyanLogo } from '../common/DhruvyanLogo';
import shipHeroImg from '../../assets/images/dhruvyan_ship_hero_1790499133990.jpg';

interface CredentialPreset {
  title: string;
  name: string;
  email: string;
  role: Role;
  stationId: string;
  stationName: string;
  badge: string;
}

const PRESETS: CredentialPreset[] = [
  {
    title: 'Command Admin (Alina)',
    name: 'Alina Ali',
    email: 'alina.ali@dhruvyan.polar',
    role: 'Administrator',
    stationId: 'st-bharati',
    stationName: 'McMurdo / Bharati Command',
    badge: 'HQ Command',
  },
  {
    title: 'Station Commander',
    name: 'Dr. Rajeshwari Nair',
    email: 'commander.bharati@ncpor.res.in',
    role: 'Administrator',
    stationId: 'st-bharati',
    stationName: 'Bharati Station (69°S)',
    badge: 'Station Lead',
  },
  {
    title: 'Logistics Chief',
    name: 'Capt. Vikram Singh',
    email: 'logistics.southern@ncpor.res.in',
    role: 'Logistics Officer',
    stationId: 'st-bharati',
    stationName: 'Southern Ocean Dispatch',
    badge: 'Supply Chain',
  },
  {
    title: 'Chief Engineer',
    name: 'Er. Amitav Ghosh',
    email: 'engineer.maitri@ncpor.res.in',
    role: 'Station Officer',
    stationId: 'st-maitri',
    stationName: 'Maitri Station (70°S)',
    badge: 'Life Support',
  },
  {
    title: 'Emergency Medical Lead',
    name: 'Dr. Priya Sharma',
    email: 'medical.himadri@ncpor.res.in',
    role: 'Emergency Coordinator',
    stationId: 'st-himadri',
    stationName: 'Himadri Base (78°N)',
    badge: 'Search & Rescue',
  },
];

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(true);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('Home');

  // Form states
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('alina.ali@dhruvyan.polar');
  const [password, setPassword] = useState('polar2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('Alina Ali');
  const [role, setRole] = useState<Role>('Administrator');
  const [stationId, setStationId] = useState('st-bharati');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid polar command email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters in length.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email, password, role, fullName, stationId);
      if (!result.success) {
        setErrorMessage(result.error || 'Authentication error. Please check your credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Server communication issue.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyPreset = (preset: CredentialPreset) => {
    setEmail(preset.email);
    setPassword('polar2026!');
    setFullName(preset.name);
    setRole(preset.role);
    setStationId(preset.stationId);
    setErrorMessage(null);
  };

  const navLinks = ['Home', 'About', 'Features', 'Explore', 'Contact'];

  const featureCards = [
    {
      id: 'personnel',
      title: 'Personnel',
      desc: 'Track and manage team members',
      icon: Users,
      bgColor: 'bg-blue-50 text-blue-600',
      iconColor: 'text-blue-600',
    },
    {
      id: 'vehicles',
      title: 'Vehicles',
      desc: 'Monitor fleet and movement',
      icon: Truck,
      bgColor: 'bg-cyan-50 text-cyan-600',
      iconColor: 'text-cyan-600',
    },
    {
      id: 'equipment',
      title: 'Equipment',
      desc: 'Ensure readiness and availability',
      icon: SettingsIcon,
      bgColor: 'bg-purple-50 text-purple-600',
      iconColor: 'text-purple-600',
    },
    {
      id: 'inventory',
      title: 'Inventory',
      desc: 'Manage supplies and resources',
      icon: Package,
      bgColor: 'bg-amber-50 text-amber-600',
      iconColor: 'text-amber-600',
    },
    {
      id: 'routes',
      title: 'Routes',
      desc: 'Plan and track expedition routes',
      icon: RouteIcon,
      bgColor: 'bg-emerald-50 text-emerald-600',
      iconColor: 'text-emerald-600',
    },
    {
      id: 'alerts',
      title: 'Alerts & Incidents',
      desc: 'Stay informed, act faster',
      icon: Bell,
      bgColor: 'bg-rose-50 text-rose-600',
      iconColor: 'text-rose-600',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-slate-800 flex flex-col justify-between relative overflow-x-hidden font-sans select-none selection:bg-blue-600 selection:text-white">
      {/* Top Navigation Bar Matching Image 1 */}
      <header className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 px-6 sm:px-12 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo */}
          <DhruvyanLogo theme="light" />

          {/* Header Login Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#0f294a] hover:bg-[#1a3d6b] text-white text-xs sm:text-sm font-semibold shadow-md transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <User className="w-4 h-4" />
              <span>Login</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero Section Matching Image 1 */}
      <main className="relative flex-1 max-w-7xl w-full mx-auto px-6 sm:px-12 pt-6 sm:pt-10 pb-16 flex flex-col justify-between">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Typography & CTAs */}
          <div className="lg:col-span-6 space-y-6 z-10">
            {/* Spaced overline */}
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm tracking-[0.25em] font-semibold text-slate-600 uppercase font-mono">
                EXPLORE • MANAGE • COMMAND
              </span>
            </div>

            {/* Huge Display Title */}
            <div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[#0b1e36] font-serif leading-[1.05]">
                DHRUVYAN
              </h1>
              <p className="text-xl sm:text-2xl lg:text-3xl font-light text-slate-700 mt-1 leading-snug">
                Intelligent Polar Expedition Command System
              </p>
            </div>

            {/* Coral Accent Line */}
            <div className="w-12 h-1 bg-[#ef4444] rounded-full" />

            {/* Sub-headline & Description */}
            <div className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                One Mission. Every Asset. Always Visible.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                Integrate personnel, vehicles, equipment, inventory, routes and camps — all in one
                intelligent platform for safer, smarter and more efficient polar expeditions.
              </p>
            </div>
          </div>

          {/* Right Column: High-Res Ship Hero Image & Compass Badge */}
          <div className="lg:col-span-6 relative mt-4 lg:mt-0 flex justify-center">
            {/* Top Right Floating Badge */}
            <div className="absolute top-2 right-2 sm:right-6 z-20 hidden sm:flex items-center gap-3 bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-200/90 shadow-lg text-slate-800">
              <div className="text-right leading-tight">
                <p className="text-[11px] font-black tracking-wider uppercase text-[#0f294a]">
                  REAL-TIME INSIGHTS.
                </p>
                <p className="text-[10px] font-bold text-slate-600">
                  SAFER EXPEDITIONS.
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563eb]">
                <Compass className="w-5 h-5 animate-spin-slow" />
              </div>
            </div>

            {/* Polar Ship Visual with soft gradient blend */}
            <div className="relative w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200/60 group">
              <img
                src={shipHeroImg}
                alt="DHRUVYAN Polar Research Expedition Vessel"
                className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
              />
              {/* Soft overlay gradient on left for organic transition */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#f7f9fc]/40 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-3 left-4 bg-slate-900/70 backdrop-blur-md px-3 py-1 rounded-full text-white text-[11px] font-mono flex items-center gap-1.5 border border-white/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>R/V Vasiliy Golovnin • Southern Ocean (69°S)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Floating Feature Cards (6 Cards Matching Image 1) */}
        <div className="mt-12 sm:mt-16 pt-8 border-t border-slate-200/70">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {featureCards.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.id}
                  onClick={() => setIsLoginModalOpen(true)}
                  className="bg-white/95 hover:bg-white border border-slate-200/80 hover:border-blue-400/50 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col items-center text-center group transform hover:-translate-y-1"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl ${feat.bgColor} flex items-center justify-center mb-3 transition-transform group-hover:scale-110 shadow-sm`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-tight line-clamp-2">
                    {feat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200/80 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>DHRUVYAN Polar Command • National Centre for Polar &amp; Ocean Research (NCPOR)</span>
          <span className="font-mono text-[11px] text-slate-600">
            SIH26062 • Antartica &amp; Arctic Mission Architecture
          </span>
        </div>
      </footer>

      {/* Interactive Authentication Modal (Login UI overlaying Image 1) */}
      {/* Glassmorphic Login Modal Matching User's Reference Image */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn overflow-y-auto">
          {/* Ambient Glowing Aurora Blobs in background */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
            <div className="w-[500px] h-[500px] bg-blue-400/35 rounded-full blur-[100px] -translate-x-32 -translate-y-20 animate-pulse" />
            <div className="w-[450px] h-[450px] bg-cyan-300/30 rounded-full blur-[100px] translate-x-32 translate-y-20" />
          </div>

          {/* Main Glassmorphic Container matching image */}
          <div className="relative w-full max-w-3xl backdrop-blur-2xl bg-white/25 border border-white/60 rounded-[36px] shadow-2xl p-5 sm:p-7 grid grid-cols-1 md:grid-cols-12 gap-6 overflow-hidden animate-scaleUp z-10">
            {/* Modal Dismiss Button */}
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-600 flex items-center justify-center transition-all cursor-pointer shadow-xs"
              title="Close modal and view landing page"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Left Side: Frosted Glass Login Form (md:col-span-7) */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-4">
              <div>
                {/* Title Matching Image: "LOGIN" */}
                <div className="text-center sm:text-left mb-5">
                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-wider uppercase font-sans">
                    {authMode === 'signin' ? 'LOGIN' : 'SIGN UP'}
                  </h3>
                  <p className="text-[11px] text-white/80 font-medium tracking-wide mt-0.5">
                    {authMode === 'signin'
                      ? 'DHRUVYAN Polar Command Intelligence'
                      : 'Register Officer Credentials'}
                  </p>
                </div>

                {errorMessage && (
                  <div className="mb-3 p-2.5 rounded-2xl bg-red-500/20 border border-red-300/50 text-white text-xs flex items-center gap-2 backdrop-blur-sm">
                    <span className="font-bold">Error:</span> {errorMessage}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                  {authMode === 'signup' && (
                    <div>
                      <label className="text-[10px] font-bold text-white/90 uppercase tracking-widest ml-3 mb-1 block">
                        FULL NAME
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Alina Ali"
                        className="w-full rounded-full border border-white/60 bg-white/15 hover:bg-white/20 focus:bg-white/25 focus:border-white px-5 py-2.5 text-white placeholder-white/50 text-xs font-medium focus:outline-none transition-all shadow-inner"
                      />
                    </div>
                  )}

                  {/* USER NAME Field matching image */}
                  <div>
                    <label className="text-[10px] font-bold text-white/90 uppercase tracking-widest ml-3 mb-1 block">
                      USER NAME
                    </label>
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alina.ali@dhruvyan.polar"
                      className="w-full rounded-full border border-white/60 bg-white/15 hover:bg-white/20 focus:bg-white/25 focus:border-white px-5 py-2.5 text-white placeholder-white/50 text-xs font-medium focus:outline-none transition-all shadow-inner"
                    />
                  </div>

                  {/* PASSWORD Field matching image */}
                  <div>
                    <label className="text-[10px] font-bold text-white/90 uppercase tracking-widest ml-3 mb-1 block">
                      PASSWORD
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-full border border-white/60 bg-white/15 hover:bg-white/20 focus:bg-white/25 focus:border-white px-5 py-2.5 text-white placeholder-white/50 text-xs font-medium focus:outline-none transition-all shadow-inner pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Optional Role & Station in subtle frosted capsule format */}
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <div>
                      <label className="text-[9.5px] font-bold text-white/80 uppercase tracking-wider ml-2 mb-0.5 block">
                        ROLE
                      </label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as Role)}
                        className="w-full rounded-full border border-white/40 bg-white/15 px-3 py-1.5 text-white text-[11px] focus:outline-none focus:border-white cursor-pointer"
                      >
                        <option value="Administrator" className="text-slate-900">Administrator</option>
                        <option value="Expedition Manager" className="text-slate-900">Expedition Manager</option>
                        <option value="Logistics Officer" className="text-slate-900">Logistics Officer</option>
                        <option value="Station Officer" className="text-slate-900">Chief Engineer</option>
                        <option value="Emergency Coordinator" className="text-slate-900">Medical Officer</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9.5px] font-bold text-white/80 uppercase tracking-wider ml-2 mb-0.5 block">
                        STATION
                      </label>
                      <select
                        value={stationId}
                        onChange={(e) => setStationId(e.target.value)}
                        className="w-full rounded-full border border-white/40 bg-white/15 px-3 py-1.5 text-white text-[11px] focus:outline-none focus:border-white cursor-pointer"
                      >
                        <option value="st-bharati" className="text-slate-900">Bharati (69°S)</option>
                        <option value="st-maitri" className="text-slate-900">Maitri (70°S)</option>
                        <option value="st-himadri" className="text-slate-900">Himadri (78°N)</option>
                      </select>
                    </div>
                  </div>

                  {/* Solid White Capsule Button Matching Image ("SIGN UP" / "LOGIN") */}
                  <div className="pt-2 text-center sm:text-left">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full sm:w-48 py-2.5 px-6 rounded-full bg-white hover:bg-white/95 text-[#1e40af] font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-950/20 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 mx-auto sm:mx-0"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                          <span>CONNECTING...</span>
                        </>
                      ) : (
                        <span>{authMode === 'signin' ? 'LOGIN' : 'SIGN UP'}</span>
                      )}
                    </button>

                    {/* Subtext link matching "Dont have an account?" */}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                        setErrorMessage(null);
                      }}
                      className="text-[11px] text-white/90 hover:text-white transition-colors mt-2.5 block mx-auto sm:mx-0 cursor-pointer"
                    >
                      {authMode === 'signin'
                        ? 'Dont have an account? Sign up'
                        : 'Already have an account? Login'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Quick Judge Reference Bar (Preserving reference for judges) */}
              <div className="pt-2 border-t border-white/20">
                <p className="text-[10px] text-white/80 font-mono uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-200" />
                  <span>Judge Quick Access:</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {PRESETS.slice(0, 3).map((preset) => (
                    <button
                      key={preset.email}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-mono border transition-all cursor-pointer ${
                        email === preset.email
                          ? 'bg-white text-blue-900 border-white font-bold shadow-xs'
                          : 'bg-white/10 hover:bg-white/20 text-white border-white/30'
                      }`}
                    >
                      {preset.name.split(' ')[0]} ({preset.badge})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side: Crisp White Illustration Card Matching Image (md:col-span-5) */}
            <div className="md:col-span-5 bg-white rounded-[28px] p-6 sm:p-8 shadow-sm flex flex-col items-center justify-between min-h-[320px] sm:min-h-[380px] text-center">
              {/* Subtle top indicator */}
              <div className="w-full flex items-center justify-center gap-1.5 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                <span>Encrypted Gateway</span>
              </div>

              {/* Center Vector Illustration: Cloud with Turquoise Padlock & Checkmark matching image */}
              <div className="my-auto relative flex items-center justify-center">
                {/* Cloud & Padlock SVG */}
                <svg
                  width="180"
                  height="140"
                  viewBox="0 0 180 140"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-36 h-28 sm:w-44 sm:h-36 drop-shadow-sm"
                >
                  {/* Soft Background Clouds in pastel cyan/blue */}
                  <path
                    d="M50 85 C35 85 22 72 22 57 C22 43 32 32 46 30 C50 18 62 10 76 10 C93 10 106 21 109 37 C112 36 116 35 120 35 C134 35 145 46 145 60 C145 61 145 62 144 63 C152 66 158 74 158 83 C158 94 149 103 138 103 L50 103 C40 103 50 85 50 85 Z"
                    fill="#e0f2fe"
                    opacity="0.85"
                  />
                  <path
                    d="M30 95 C20 95 12 87 12 77 C12 68 18 60 27 59 C30 50 38 45 48 45 C59 45 68 53 70 63 C72 62 75 62 77 62 C87 62 94 69 94 79 C94 80 94 80 94 81 C99 83 103 88 103 94 C103 101 97 107 90 107 L30 107 Z"
                    fill="#bae6fd"
                    opacity="0.5"
                  />

                  {/* Padlock Shackle */}
                  <path
                    d="M74 65 V50 C74 41.163 81.163 34 90 34 C98.837 34 106 41.163 106 50 V65"
                    stroke="#7dd3fc"
                    strokeWidth="9"
                    strokeLinecap="round"
                  />

                  {/* Padlock Body (Rounded Rect) */}
                  <rect
                    x="62"
                    y="63"
                    width="56"
                    height="46"
                    rx="14"
                    fill="#38bdf8"
                  />

                  {/* Inner Circular Badge */}
                  <circle
                    cx="90"
                    cy="86"
                    r="12"
                    fill="white"
                  />

                  {/* Checkmark icon inside padlock badge */}
                  <path
                    d="M85 86 L88.5 89.5 L95.5 82.5"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Bottom Watermark matching "Dole.com" from user's image */}
              <div className="w-full">
                <span className="text-xs font-mono font-medium text-slate-400 tracking-wider">
                  Dhruvyan.com
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Watch Overview Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <DhruvyanLogo theme="light" />
                <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full font-mono font-bold">
                  System Overview
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsVideoModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden bg-slate-900 text-white relative aspect-video flex flex-col justify-end p-6">
              <img
                src={shipHeroImg}
                alt="Overview Background"
                className="absolute inset-0 w-full h-full object-cover opacity-50"
              />
              <div className="relative z-10 space-y-2">
                <h4 className="text-xl font-bold font-serif">
                  DHRUVYAN Polar Command Intelligence
                </h4>
                <p className="text-xs text-slate-200 max-w-md">
                  Seamlessly connecting expedition leaders, field researchers, and logistics hubs
                  across Bharati, Maitri, and Himadri research stations.
                </p>
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsVideoModalOpen(false);
                      setIsLoginModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow"
                  >
                    Open Live Command Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
