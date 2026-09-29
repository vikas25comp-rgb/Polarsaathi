import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DhruvyanSidebar } from './components/layout/DhruvyanSidebar';
import { DhruvyanTopBar } from './components/layout/DhruvyanTopBar';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { DashboardTab } from './components/dashboard/DashboardTab';
import { ExpeditionsTab } from './components/expeditions/ExpeditionsTab';
import { CargoTab } from './components/cargo/CargoTab';
import { InventoryTab } from './components/inventory/InventoryTab';
import { PredictiveResupplyTab } from './components/predictive/PredictiveResupplyTab';
import { PersonnelTab } from './components/personnel/PersonnelTab';
import { AssetsTab } from './components/assets/AssetsTab';
import { EmergencyTab } from './components/emergency/EmergencyTab';
import { WhatIfSimulatorTab } from './components/simulator/WhatIfSimulatorTab';
import { AiAssistantTab } from './components/assistant/AiAssistantTab';
import { ReportsTab } from './components/reports/ReportsTab';
import { SettingsTab } from './components/settings/SettingsTab';
import { LoginPage } from './components/auth/LoginPage';

const MainApp: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Keyboard shortcut for Cmd+K search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigateTab = (tab: string) => {
    setActiveTab(tab);
  };

  // If user is not authenticated, render Image 1 (Landing & Login Gateway)
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // When authenticated, render Image 2 (Command Dashboard Layout with Left Sidebar)
  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-800 flex antialiased selection:bg-blue-600 selection:text-white">
      {/* Left Sidebar Matching Image 2 */}
      <DhruvyanSidebar
        activeTab={activeTab}
        onTabChange={handleNavigateTab}
      />

      {/* Main Right Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Bar Matching Image 2 */}
        <DhruvyanTopBar
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenEmergency={() => setActiveTab('emergency')}
          activeTab={activeTab}
        />

        {/* Main Tab Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' && <DashboardTab onNavigateTab={handleNavigateTab} />}
          {activeTab === 'expeditions' && <ExpeditionsTab />}
          {activeTab === 'cargo' && <CargoTab />}
          {activeTab === 'inventory' && <InventoryTab />}
          {activeTab === 'predictive' && <PredictiveResupplyTab />}
          {activeTab === 'personnel' && <PersonnelTab />}
          {activeTab === 'assets' && <AssetsTab />}
          {activeTab === 'emergency' && <EmergencyTab />}
          {activeTab === 'simulator' && <WhatIfSimulatorTab />}
          {activeTab === 'assistant' && <AiAssistantTab />}
          {activeTab === 'reports' && <ReportsTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </main>

        {/* Clean Footer */}
        <footer className="bg-white border-t border-slate-200/80 py-3.5 px-6 text-center text-xs text-slate-500 font-mono">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>DHRUVYAN • Intelligent Polar Expedition Command System</span>
            <span className="text-slate-400">McMurdo • Bharati (69°S) • Maitri (70°S) • Himadri (78°N)</span>
          </div>
        </footer>
      </div>

      {/* Global Search Dialog */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigateTab={handleNavigateTab}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
