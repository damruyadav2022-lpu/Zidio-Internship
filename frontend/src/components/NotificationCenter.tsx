import React, { useState, useRef, useEffect } from 'react';
import { Bell, AlertTriangle, ShieldAlert, Cpu, Check, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface NotificationItem {
  id: string;
  type: 'inventory' | 'churn' | 'mlops' | 'system';
  title: string;
  message: string;
  timestamp: string;
  route: string;
  unread: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n-1',
    type: 'inventory',
    title: 'Critical Inventory Alert',
    message: 'Ultra-HD Smart Monitor 32" has dropped below safety stock (18 units remaining).',
    timestamp: '10m ago',
    route: '/app/inventory',
    unread: true
  },
  {
    id: 'n-2',
    type: 'churn',
    title: 'High Churn Spike Detected',
    message: 'Customer CUST-10004 shows 89.2% churn probability after 110 days inactivity.',
    timestamp: '28m ago',
    route: '/app/churn',
    unread: true
  },
  {
    id: 'n-3',
    type: 'mlops',
    title: 'MLflow Run Completed',
    message: 'PyTorch LSTM Forecaster v3.0.4 trained successfully with MAE: 14.28 units.',
    timestamp: '1h ago',
    route: '/app/mlops',
    unread: false
  }
];

export const NotificationCenter: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => n.unread).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const handleClickItem = (item: NotificationItem) => {
    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, unread: false } : n));
    setIsOpen(false);
    navigate(item.route);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'inventory':
        return <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'churn':
        return <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      default:
        return <Cpu className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-3.5 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-900 dark:text-white">Alerts & Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Mark read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {notifications.map(item => (
              <div
                key={item.id}
                onClick={() => handleClickItem(item)}
                className={`p-3.5 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-start gap-3 ${
                  item.unread ? 'bg-slate-50/70 dark:bg-slate-900/30' : ''
                }`}
              >
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                  {getIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">{item.timestamp}</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] line-clamp-2">
                    {item.message}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-2.5 border-t border-slate-100 dark:border-dark-border bg-slate-50 dark:bg-slate-900/50 text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/app/alerts');
              }}
              className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 inline-flex items-center gap-1"
            >
              <span>View all notifications</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
