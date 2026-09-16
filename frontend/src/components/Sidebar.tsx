import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  PieChart,
  ShieldAlert,
  TrendingUp,
  Boxes,
  Cpu,
  Bell,
  Settings,
  Globe,
  LogOut,
  X,
  CreditCard,
  Link2,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

const NAV_ITEMS = [
  { name: 'Business Overview', path: '/app/overview', icon: LayoutDashboard },
  { name: 'Customer Intelligence', path: '/app/customers', icon: Users },
  { name: 'RFM Segmentation', path: '/app/segmentation', icon: PieChart },
  { name: 'Churn Prediction', path: '/app/churn', icon: ShieldAlert },
  { name: 'Demand Forecasting', path: '/app/forecast', icon: TrendingUp },
  { name: 'Inventory & ROP', path: '/app/inventory', icon: Boxes },
  { name: 'Store Integrations', path: '/app/integrations', icon: Link2 },
  { name: 'MLOps Observability', path: '/app/mlops', icon: Cpu },
  { name: 'Audit Logs', path: '/app/audit-logs', icon: ShieldCheck },
  { name: 'System Alerts', path: '/app/alerts', icon: Bell },
  { name: 'Billing & Plans', path: '/app/billing', icon: CreditCard },
  { name: 'Settings', path: '/app/settings', icon: Settings },
];

import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC<SidebarProps> = ({ isOpenMobile, onCloseMobile }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const content = (
    <aside className="w-64 h-full bg-white dark:bg-dark-card border-r border-slate-200 dark:border-dark-border flex flex-col justify-between select-none">
      {/* Top Brand Logo */}
      <div>
        <div className="h-16 px-6 border-b border-slate-200 dark:border-dark-border flex items-center justify-between">
          <NavLink to="/app/overview" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-pulse-orange text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight font-heading flex items-center gap-1">
                RETAILPULSE
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                  AI
                </span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium -mt-1">Enterprise Platform</span>
            </div>
          </NavLink>

          {onCloseMobile && (
            <button onClick={onCloseMobile} className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Menu Links */}
        <nav className="p-4 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Decision Modules
          </div>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile & Public Links */}
      <div className="p-4 border-t border-slate-200 dark:border-dark-border space-y-3">
        <NavLink
          to="/"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <Globe className="w-4 h-4" />
          <span>Public Website</span>
        </NavLink>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'RP'}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                {user?.name || 'Authenticated User'}
              </span>
              <span className="text-[10px] text-slate-400 block truncate">
                {user?.email || 'user@retailpulse.ai'}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-screen sticky top-0 shrink-0">
        {content}
      </div>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={onCloseMobile}></div>
          <div className="relative z-10 w-64 h-full bg-white dark:bg-dark-card shadow-2xl animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
