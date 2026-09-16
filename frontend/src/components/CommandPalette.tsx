import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutDashboard, Users, PieChart, ShieldAlert, TrendingUp, Boxes, Cpu, Bell, Settings, X, ArrowRight, CreditCard } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchItem {
  id: string;
  title: string;
  category: 'Pages' | 'Customers' | 'Products' | 'Actions';
  route: string;
  subtitle?: string;
  icon?: any;
}

const STATIC_SEARCH_ITEMS: SearchItem[] = [
  { id: 'p-1', title: 'Business Intelligence Overview', category: 'Pages', route: '/app/overview', icon: LayoutDashboard },
  { id: 'p-2', title: 'Customer Directory & Profiles', category: 'Pages', route: '/app/customers', icon: Users },
  { id: 'p-3', title: 'RFM Customer Segmentation', category: 'Pages', route: '/app/segmentation', icon: PieChart },
  { id: 'p-4', title: 'Predictive Churn Analytics', category: 'Pages', route: '/app/churn', icon: ShieldAlert },
  { id: 'p-5', title: 'PyTorch LSTM Demand Forecasting', category: 'Pages', route: '/app/forecast', icon: TrendingUp },
  { id: 'p-6', title: 'Inventory Safety Stock & ROP', category: 'Pages', route: '/app/inventory', icon: Boxes },
  { id: 'p-7', title: 'MLOps, Models & Drift Observability', category: 'Pages', route: '/app/mlops', icon: Cpu },
  { id: 'p-8', title: 'System Alerts & Notifications', category: 'Pages', route: '/app/alerts', icon: Bell },
  { id: 'p-9', title: 'Billing, Subscriptions & Invoices', category: 'Pages', route: '/app/billing', icon: CreditCard },
  { id: 'p-10', title: 'Organization & Platform Settings', category: 'Pages', route: '/app/settings', icon: Settings },
  
  // Customers
  { id: 'c-1', title: 'Aarav Mehta (CUST-10000)', category: 'Customers', route: '/app/customers', subtitle: 'VIP Champions • $18.4k spend' },
  { id: 'c-2', title: 'Priya Sharma (CUST-10001)', category: 'Customers', route: '/app/customers', subtitle: 'VIP Champions • $14.2k spend' },
  { id: 'c-3', title: 'Vikram Singh (CUST-10004)', category: 'Customers', route: '/app/customers', subtitle: 'Lost Customers • 89.2% Churn Risk' },
  { id: 'c-4', title: 'Ananya Iyer (CUST-10003)', category: 'Customers', route: '/app/customers', subtitle: 'At-Risk Customers • 68.4% Churn Risk' },

  // Products
  { id: 'pr-1', title: 'Ultra-HD Smart Monitor 32" (PROD-10024)', category: 'Products', route: '/app/inventory', subtitle: 'Stock: 18 • Critical Red Alert' },
  { id: 'pr-2', title: 'Ergonomic Executive Mesh Chair (PROD-10008)', category: 'Products', route: '/app/inventory', subtitle: 'Stock: 24 • Critical Red Alert' },
  { id: 'pr-3', title: 'High-Speed Wireless Router Pro (PROD-10056)', category: 'Products', route: '/app/inventory', subtitle: 'Stock: 45 • Warning Yellow' },
  
  // Actions
  { id: 'a-1', title: 'Generate Purchase Order', category: 'Actions', route: '/app/inventory', subtitle: 'Open replenishment wizard' },
  { id: 'a-2', title: 'Simulate Demand Scenario', category: 'Actions', route: '/app/forecast', subtitle: 'Adjust growth & promotion multipliers' }
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Global Ctrl/Cmd + K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open
          inputRef.current?.focus();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = query.trim() === '' 
    ? STATIC_SEARCH_ITEMS 
    : STATIC_SEARCH_ITEMS.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) || 
        (item.subtitle && item.subtitle.toLowerCase().includes(query.toLowerCase())) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      );

  const handleSelect = (item: SearchItem) => {
    navigate(item.route);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      handleSelect(filtered[selectedIndex]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-20 px-4">
      <div 
        className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-dark-border bg-slate-50/50 dark:bg-slate-900/30">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search customers, products, models, pages, or commands..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
          <kbd className="hidden sm:inline-block ml-3 px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[420px]">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No results found for "{query}". Try searching for "Forecast", "Aarav", or "Monitor".
            </div>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon || ArrowRight;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer text-xs transition-colors ${
                    isSelected 
                      ? 'bg-brand-50 text-brand-900 dark:bg-brand-950/60 dark:text-brand-100' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{item.title}</div>
                      {item.subtitle && (
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{item.subtitle}</div>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Palette Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-dark-border bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-4">
            <span>Use <kbd className="px-1 py-0.5 bg-white dark:bg-slate-800 border rounded">↑</kbd> <kbd className="px-1 py-0.5 bg-white dark:bg-slate-800 border rounded">↓</kbd> to navigate</span>
            <span><kbd className="px-1 py-0.5 bg-white dark:bg-slate-800 border rounded">Enter</kbd> to select</span>
          </div>
          <span>RetailPulse Global Index</span>
        </div>
      </div>
    </div>
  );
};
