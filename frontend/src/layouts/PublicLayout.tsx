import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Menu, X, Globe, Sparkles, Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export const PublicLayout: React.FC = () => {
  const navigate = useNavigate();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white dark:bg-dark-bg text-slate-900 dark:text-slate-100 selection:bg-brand-500 selection:text-white">
      
      {/* Sticky Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-white/85 dark:bg-dark-card/85 backdrop-blur-md border-b border-slate-200 dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-pulse-orange text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white font-heading">
              Retail<span className="text-brand-600 dark:text-brand-400">Pulse</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
            <NavLink to="/product" className={({ isActive }) => isActive ? 'text-brand-600 font-semibold' : 'hover:text-slate-900 dark:hover:text-white transition-colors'}>
              Product
            </NavLink>
            <NavLink to="/solutions" className={({ isActive }) => isActive ? 'text-brand-600 font-semibold' : 'hover:text-slate-900 dark:hover:text-white transition-colors'}>
              Solutions
            </NavLink>
            <NavLink to="/pricing" className={({ isActive }) => isActive ? 'text-brand-600 font-semibold' : 'hover:text-slate-900 dark:hover:text-white transition-colors'}>
              Pricing
            </NavLink>
            <NavLink to="/docs" className={({ isActive }) => isActive ? 'text-brand-600 font-semibold' : 'hover:text-slate-900 dark:hover:text-white transition-colors'}>
              Docs
            </NavLink>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
            >
              {resolvedTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            <Link
              to="/login"
              className="text-xs font-semibold px-4 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Sign In
            </Link>

            <button
              onClick={() => navigate('/app/overview')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-all"
            >
              <span>Launch Platform</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300"
          >
            {isMobileNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Drawer */}
        {isMobileNavOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-dark-border px-4 py-4 space-y-3 bg-white dark:bg-dark-card animate-in slide-in-from-top-2 duration-150">
            <Link to="/product" onClick={() => setIsMobileNavOpen(false)} className="block py-2 text-sm font-medium text-slate-700 dark:text-slate-200">Product</Link>
            <Link to="/solutions" onClick={() => setIsMobileNavOpen(false)} className="block py-2 text-sm font-medium text-slate-700 dark:text-slate-200">Solutions</Link>
            <Link to="/pricing" onClick={() => setIsMobileNavOpen(false)} className="block py-2 text-sm font-medium text-slate-700 dark:text-slate-200">Pricing</Link>
            <Link to="/docs" onClick={() => setIsMobileNavOpen(false)} className="block py-2 text-sm font-medium text-slate-700 dark:text-slate-200">Docs</Link>
            <div className="pt-3 border-t border-slate-200 dark:border-dark-border flex gap-3">
              <Link to="/login" onClick={() => setIsMobileNavOpen(false)} className="flex-1 text-center py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold">Sign In</Link>
              <button onClick={() => { setIsMobileNavOpen(false); navigate('/app/overview'); }} className="flex-1 text-center py-2 rounded-lg bg-brand-600 text-white text-xs font-semibold">Launch App</button>
            </div>
          </div>
        )}
      </header>

      {/* Main Slot */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Enterprise Footer (Section 66) */}
      <footer className="w-full bg-slate-900 dark:bg-black text-white pt-16 pb-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-slate-800 text-xs">
            
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-pulse-orange text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-lg tracking-tight font-heading">RETAILPULSE</span>
              </div>
              <p className="text-slate-400 max-w-sm leading-relaxed mb-4">
                Predict demand. Understand customers. Optimize every decision. Complete AI retail analytics SaaS platform for omnichannel retail and e-commerce leaders.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>System Status: 100% Operational • FastAPI 3.0 + PyTorch Online</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">Product</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link to="/app/overview" className="hover:text-white transition-colors">Business Intelligence</Link></li>
                <li><Link to="/app/customers" className="hover:text-white transition-colors">Customer Analytics</Link></li>
                <li><Link to="/app/segmentation" className="hover:text-white transition-colors">RFM K-Means</Link></li>
                <li><Link to="/app/churn" className="hover:text-white transition-colors">Churn Prediction</Link></li>
                <li><Link to="/app/forecast" className="hover:text-white transition-colors">Demand Forecasting</Link></li>
                <li><Link to="/app/inventory" className="hover:text-white transition-colors">Inventory Optimization</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">Solutions</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link to="/solutions" className="hover:text-white transition-colors">Omnichannel Retail</Link></li>
                <li><Link to="/solutions" className="hover:text-white transition-colors">Direct-to-Consumer</Link></li>
                <li><Link to="/solutions" className="hover:text-white transition-colors">Supply Chain Teams</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing Plans</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">Resources & Docs</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link to="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link to="/docs" className="hover:text-white transition-colors">REST API Spec</Link></li>
                <li><Link to="/app/mlops" className="hover:text-white transition-colors">MLOps Observability</Link></li>
                <li><span className="text-slate-500">Zidio Internship 2026</span></li>
              </ul>
            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
            <span>© 2026 RetailPulse Platform Inc. Built with React, TypeScript, FastAPI, PyTorch & XGBoost.</span>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-slate-400">Privacy Policy</a>
              <a href="#" className="hover:text-slate-400">Terms of Service</a>
              <a href="#" className="hover:text-slate-400">Security & GDPR</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};
