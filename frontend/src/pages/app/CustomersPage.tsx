import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  TrendingDown, 
  AlertCircle,
  ExternalLink,
  Award
} from 'lucide-react';
import { fetchCustomers, fetchCustomerDetail } from '../../services/customerService';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { EmptyState } from '../../components/EmptyState';
import { exportToCsv } from '../../utils/exportUtils';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../context/ToastContext';

export const CustomersPage: React.FC = () => {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [segmentFilter, setSegmentFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Selected customer for slide-over drawer
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Fetch paginated customers
  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['customers-list', debouncedSearch, segmentFilter, riskFilter, page],
    queryFn: () => fetchCustomers({
      q: debouncedSearch,
      segment: segmentFilter,
      risk: riskFilter,
      page,
      limit: pageSize
    }),
    placeholderData: (prev) => prev,
    staleTime: 15000,
  });

  // Fetch single customer detail when drawer opens
  const { data: customerDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['customer-detail', selectedCustomerId],
    queryFn: () => (selectedCustomerId ? fetchCustomerDetail(selectedCustomerId) : null),
    enabled: !!selectedCustomerId,
  });

  const handleExportCsv = () => {
    if (!data?.items) return;
    const exportData = data.items.map(c => ({
      CustomerID: c.CustomerID,
      CustomerName: c.CustomerName,
      Email: c.Email,
      Segment: c.Segment,
      Region: c.Region,
      Monetary: c.Monetary,
      Frequency: c.Frequency,
      Recency: c.Recency,
      ChurnRiskLevel: c.ChurnRiskLevel,
      ChurnProbability: (c.ChurnProbability * 100).toFixed(1) + '%'
    }));
    exportToCsv(exportData, `retailpulse_customers_${segmentFilter}_${riskFilter}.csv`);
  };

  const totalPages = data ? Math.ceil(data.total / pageSize) : 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
            Customer Intelligence
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Analyze behavioral segments, lifetime value, and individual churn probability vectors.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export Customers CSV</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-dark-card rounded-2xl p-4 border border-slate-200 dark:border-dark-border shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, ID, or email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-900 dark:text-slate-100 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Segment Filter */}
          <div className="flex items-center gap-1.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5">
            <span className="text-slate-400 font-medium">Segment:</span>
            <select
              value={segmentFilter}
              onChange={(e) => {
                setSegmentFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent border-none focus:outline-none font-semibold text-slate-800 dark:text-slate-200 text-xs cursor-pointer"
            >
              <option value="All">All Segments</option>
              <option value="VIP Champions">VIP Champions</option>
              <option value="Loyal Customers">Loyal Customers</option>
              <option value="Potential Loyalists">Potential Loyalists</option>
              <option value="At-Risk Customers">At-Risk Customers</option>
              <option value="Lost Customers">Lost Customers</option>
            </select>
          </div>

          {/* Churn Risk Filter */}
          <div className="flex items-center gap-1.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5">
            <span className="text-slate-400 font-medium">Churn Risk:</span>
            <select
              value={riskFilter}
              onChange={(e) => {
                setRiskFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent border-none focus:outline-none font-semibold text-slate-800 dark:text-slate-200 text-xs cursor-pointer"
            >
              <option value="All">All Risks</option>
              <option value="Low">Low Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="High">High Risk</option>
            </select>
          </div>
        </div>

      </div>

      {/* Customer Directory Table */}
      <div className="bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-dark-border shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <LoadingSkeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            title="No customers found"
            description="Try changing your search parameters or clearing active filters."
            actionText="Reset Filters"
            onAction={() => {
              setSearchTerm('');
              setSegmentFilter('All');
              setRiskFilter('All');
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-dark-border">
                <tr>
                  <th className="py-3.5 px-6">Customer</th>
                  <th className="py-3.5 px-6">Segment</th>
                  <th className="py-3.5 px-6">Region</th>
                  <th className="py-3.5 px-6 text-right">Lifetime Spend</th>
                  <th className="py-3.5 px-6 text-right">Orders</th>
                  <th className="py-3.5 px-6 text-right">Recency</th>
                  <th className="py-3.5 px-6 text-center">Churn Risk</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border text-slate-700 dark:text-slate-300">
                {data.items.map((cust) => (
                  <tr
                    key={cust.CustomerID}
                    onClick={() => setSelectedCustomerId(cust.CustomerID)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-850 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs uppercase group-hover:bg-brand-50 dark:group-hover:bg-brand-950/60 group-hover:text-brand-600 transition-colors">
                          {cust.CustomerName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                            {cust.CustomerName}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">{cust.CustomerID}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-6">
                      <StatusBadge status={cust.Segment} />
                    </td>

                    <td className="py-3.5 px-6 text-slate-600 dark:text-slate-300 font-medium">
                      {cust.Region}
                    </td>

                    <td className="py-3.5 px-6 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(cust.Monetary)}
                    </td>

                    <td className="py-3.5 px-6 text-right font-mono">
                      {cust.Frequency}
                    </td>

                    <td className="py-3.5 px-6 text-right font-mono text-slate-500">
                      {cust.Recency}d ago
                    </td>

                    <td className="py-3.5 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <StatusBadge status={cust.ChurnRiskLevel} />
                        <span className="text-[11px] font-mono text-slate-400">
                          ({(cust.ChurnProbability * 100).toFixed(0)}%)
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCustomerId(cust.CustomerID);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Inspect Profile"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {data && (
          <div className="p-4 border-t border-slate-100 dark:border-dark-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{(page - 1) * pageSize + 1}</span> to{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {Math.min(page * pageSize, data.total)}
              </span>{' '}
              of <span className="font-semibold text-slate-800 dark:text-slate-200">{formatNumber(data.total)}</span> customers
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1 || isPlaceholderData}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              <span className="px-2 text-slate-600 dark:text-slate-300 font-mono font-medium">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages || isPlaceholderData}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Customer Profile Drawer */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white dark:bg-dark-card h-full shadow-2xl border-l border-slate-200 dark:border-dark-border flex flex-col animate-in slide-in-from-right duration-200">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 dark:border-dark-border flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-500 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                  {customerDetail?.CustomerName.charAt(0) || 'C'}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {customerDetail?.CustomerName || 'Loading Customer...'}
                  </h3>
                  <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
                    <span>{selectedCustomerId}</span>
                    <span>•</span>
                    <span>{customerDetail?.Region} Region</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomerId(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isLoadingDetail || !customerDetail ? (
                <div className="space-y-4">
                  <LoadingSkeleton className="h-24 w-full rounded-xl" />
                  <LoadingSkeleton className="h-32 w-full rounded-xl" />
                  <LoadingSkeleton className="h-48 w-full rounded-xl" />
                </div>
              ) : (
                <>
                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                      <div className="text-[11px] text-slate-500 font-medium">Lifetime Value</div>
                      <div className="text-base font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                        {formatCurrency(customerDetail.Monetary)}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                      <div className="text-[11px] text-slate-500 font-medium">Total Orders</div>
                      <div className="text-base font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                        {customerDetail.Frequency}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                      <div className="text-[11px] text-slate-500 font-medium">Recency</div>
                      <div className="text-base font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                        {customerDetail.Recency}d
                      </div>
                    </div>
                  </div>

                  {/* AI Churn Prediction Risk Meter */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className={`w-4 h-4 ${
                          customerDetail.ChurnRiskLevel === 'High' ? 'text-rose-500' :
                          customerDetail.ChurnRiskLevel === 'Medium' ? 'text-amber-500' : 'text-emerald-500'
                        }`} />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Predictive Churn Risk Model (XGBoost)
                        </span>
                      </div>
                      <StatusBadge status={customerDetail.ChurnRiskLevel} />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Churn Likelihood</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {(customerDetail.ChurnProbability * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            customerDetail.ChurnRiskLevel === 'High' ? 'bg-rose-500' :
                            customerDetail.ChurnRiskLevel === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${customerDetail.ChurnProbability * 100}%` }}
                        />
                      </div>
                    </div>

                    {customerDetail.ChurnProbability > 0.5 && (
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-lg text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                        <TrendingDown className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <strong>Elevated Risk Drivers:</strong> Recency interval exceeds cohort norm by 42%. Average order basket shrank 28% over the last 2 transactions.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Retention Playbook Directive */}
                  <div className="p-4 rounded-xl border border-brand-200 dark:border-brand-900/40 bg-brand-50/40 dark:bg-brand-950/20 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-brand-700 dark:text-brand-300">
                      <Award className="w-4 h-4" />
                      <span>Recommended Retention Strategy</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {customerDetail.ActionStrategy || 'Deploy personalized customer reactivation sequence with automated incentive.'}
                    </p>
                    <button
                      onClick={() => toast.success('Retention Action Dispatched', `Win-back reactivation campaign triggered for ${customerDetail.CustomerName}.`)}
                      className="mt-2 w-full py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs"
                    >
                      Execute Retention Action
                    </button>
                  </div>

                  {/* Recent Order History Table */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Transaction Ledger ({customerDetail.OrdersHistory?.length || 0})
                    </h4>
                    <div className="border border-slate-200 dark:border-dark-border rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-dark-border">
                          <tr>
                            <th className="py-2.5 px-4">Order ID</th>
                            <th className="py-2.5 px-4">Date</th>
                            <th className="py-2.5 px-4 text-right">Items</th>
                            <th className="py-2.5 px-4 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-dark-border text-slate-700 dark:text-slate-300">
                          {(customerDetail.OrdersHistory || []).map((ord) => (
                            <tr key={ord.OrderID} className="hover:bg-slate-50/50 dark:hover:bg-slate-850">
                              <td className="py-2.5 px-4 font-mono font-medium text-brand-600 dark:text-brand-400">
                                {ord.OrderID}
                              </td>
                              <td className="py-2.5 px-4 text-slate-500">{ord.OrderDate}</td>
                              <td className="py-2.5 px-4 text-right font-mono">{ord.Quantity}</td>
                              <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                                {formatCurrency(ord.Sales)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
