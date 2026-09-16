import React, { useState } from 'react';
import { 
  Search, 
  Sun, 
  Moon, 
  RefreshCw, 
  Activity, 
  Sparkles, 
  Menu, 
  ShoppingBag, 
  ChevronDown, 
  Check, 
  Rocket, 
  Building2,
  Zap
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useRealtime } from '../hooks/useRealtime';
import { getIsDemoMode, setIsDemoMode } from '../services/api';
import { CommandPalette } from './CommandPalette';
import { SystemHealthModal } from './SystemHealthModal';
import { NotificationCenter } from './NotificationCenter';
import { OnboardingWizard } from './OnboardingWizard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface TopbarProps {
  onOpenMobileMenu?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobileMenu }) => {
  const toast = useToast();
  const { user } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { autoRefresh, toggleAutoRefresh, relativeTime, manualRefresh, isRefreshing } = useRealtime(20);

  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isHealthOpen, setIsHealthOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  
  const [selectedStore, setSelectedStore] = useState('Acme Flagship Online');
  const [demoMode, setDemoModeState] = useState(getIsDemoMode());

  const stores = [
    { id: 1, name: 'Acme Flagship Online', platform: 'Shopify', status: 'Live' },
    { id: 2, name: 'Acme European Outlet', platform: 'WooCommerce', status: 'Live' },
    { id: 3, name: 'Acme Amazon Storefront', platform: 'Amazon FBA', status: 'Syncing' }
  ];

  const handleToggleDemo = () => {
    const nextVal = !demoMode;
    setDemoModeState(nextVal);
    setIsDemoMode(nextVal);
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-dark-border bg-white/80 dark:bg-dark-card/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between gap-4">
      
      {/* Left: Mobile Menu Button & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Store / Tenant Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsStoreDropdownOpen(!isStoreDropdownOpen)}
            className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-brand-400 transition-colors shadow-2xs"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span className="truncate max-w-[140px]">{selectedStore}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isStoreDropdownOpen && (
            <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Store Channels (Acme Brands Inc.)
              </div>
              {stores.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedStore(s.name);
                    setIsStoreDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold transition-colors ${
                    selectedStore === s.name
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="text-left">
                    <div>{s.name}</div>
                    <div className="text-[10px] text-slate-400">{s.platform}</div>
                  </div>
                  {selectedStore === s.name && <Check className="w-4 h-4 text-brand-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Global Search Button (Ctrl+K) */}
        <button
          onClick={() => setIsCommandOpen(true)}
          className="w-full sm:w-64 flex items-center justify-between px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-900 text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 text-xs transition-colors"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">Search (Ctrl + K)</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-2xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Live Telemetry, Sandbox Switcher, Onboarding Wizard, Theme */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        
        {/* Onboarding Setup Wizard Trigger */}
        <button
          onClick={() => setIsOnboardingOpen(true)}
          className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
          title="Launch Onboarding Wizard"
        >
          <Rocket className="w-3.5 h-3.5 text-indigo-600" />
          <span>Setup Wizard</span>
        </button>

        {/* Global Live vs Demo Sandbox Switcher */}
        <button
          onClick={handleToggleDemo}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
            demoMode
              ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
              : 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
          }`}
          title="Toggle between Live Production Store data and Demo Sandbox data"
        >
          <span className={`w-2 h-2 rounded-full ${demoMode ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
          <span>{demoMode ? 'Sandbox Demo' : 'Live Store'}</span>
        </button>

        {/* Live Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-dark-border text-[11px]">
          <button
            onClick={() => manualRefresh()}
            disabled={isRefreshing}
            title="Force telemetry refresh"
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-brand-600' : ''}`} />
          </button>
          <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px]">
            {relativeTime}
          </span>
        </div>

        {/* System Health Pill Button */}
        <button
          onClick={() => setIsHealthOpen(true)}
          className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-dark-border hover:border-brand-400 transition-colors"
        >
          <Activity className="w-3.5 h-3.5 text-emerald-500" />
          <span>Health: 99.9%</span>
        </button>

        {/* Notification Center */}
        <NotificationCenter />

        {/* User Pill */}
        {user && (
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-dark-border">
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[100px]">
              {user.name}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-900">
              {user.role}
            </span>
          </div>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle theme"
        >
          {resolvedTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

      </div>

      {/* Modals */}
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
      <SystemHealthModal
        isOpen={isHealthOpen}
        onClose={() => setIsHealthOpen(false)}
        onRefresh={manualRefresh}
        isRefreshing={isRefreshing}
      />
      <OnboardingWizard
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={() => toast.success('Onboarding Completed!', 'Store onboarding completed! Your live telemetric pipeline is active.')}
      />
    </header>
  );
};
