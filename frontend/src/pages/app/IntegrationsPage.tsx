import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ShoppingBag, 
  Layers, 
  UploadCloud, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Trash2, 
  Plus, 
  Zap, 
  ShieldCheck, 
  Sparkles,
  FileSpreadsheet,
  Link2,
  Lock
} from 'lucide-react';
import { 
  fetchIntegrations, 
  fetchIntegrationDirectory, 
  connectShopify, 
  connectAmazon,
  connectWooCommerce,
  connectSquare,
  triggerIntegrationSync, 
  disconnectIntegration 
} from '../../services/integrationService';
import { SmartCsvImporterModal } from '../../components/SmartCsvImporterModal';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { useToast } from '../../context/ToastContext';

export const IntegrationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  
  // Modals state
  const [isShopifyModalOpen, setIsShopifyModalOpen] = useState(false);
  const [shopifyDomain, setShopifyDomain] = useState('');
  const [shopifyToken, setShopifyToken] = useState('');

  const [isAmazonModalOpen, setIsAmazonModalOpen] = useState(false);
  const [amazonSellerId, setAmazonSellerId] = useState('');
  const [amazonClientId, setAmazonClientId] = useState('');
  const [amazonRefreshToken, setAmazonRefreshToken] = useState('');
  const [amazonMarketplace, setAmazonMarketplace] = useState('ATVPDKIKX0DER');

  const [isWooModalOpen, setIsWooModalOpen] = useState(false);
  const [wooUrl, setWooUrl] = useState('');
  const [wooKey, setWooKey] = useState('');
  const [wooSecret, setWooSecret] = useState('');

  const [isSquareModalOpen, setIsSquareModalOpen] = useState(false);
  const [squareLocId, setSquareLocId] = useState('');
  const [squareToken, setSquareToken] = useState('');

  const [syncingId, setSyncingId] = useState<number | null>(null);

  const { data: integrationsData, isLoading: isIntegrationsLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: fetchIntegrations
  });

  const { data: directoryData } = useQuery({
    queryKey: ['integration-directory'],
    queryFn: fetchIntegrationDirectory
  });

  const syncMutation = useMutation({
    mutationFn: triggerIntegrationSync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      setTimeout(() => setSyncingId(null), 1500);
    }
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectIntegration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    }
  });

  const handleManualSync = (id: number) => {
    setSyncingId(id);
    syncMutation.mutate(id);
  };

  const handleConnectShopifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopifyDomain || !shopifyToken) return;
    try {
      await connectShopify(shopifyDomain, shopifyToken);
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      setIsShopifyModalOpen(false);
      toast.success('Connected Shopify Store', `Successfully linked ${shopifyDomain}. Webhooks active.`);
    } catch (err: any) {
      toast.error('Connection Failed', err.message || 'Failed to connect Shopify store');
    }
  };

  const handleConnectAmazonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amazonSellerId || !amazonClientId || !amazonRefreshToken) return;
    try {
      await connectAmazon(amazonSellerId, amazonClientId, amazonRefreshToken, amazonMarketplace);
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      setIsAmazonModalOpen(false);
      toast.success('Amazon SP-API Connected', `Successfully linked Seller ID ${amazonSellerId}. Initial inventory sync in progress.`);
    } catch (err: any) {
      toast.error('Amazon Connection Failed', err.message || 'Failed to link Amazon Seller Central');
    }
  };

  const handleConnectWooSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wooUrl || !wooKey || !wooSecret) return;
    try {
      await connectWooCommerce(wooUrl, wooKey, wooSecret);
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      setIsWooModalOpen(false);
      toast.success('WooCommerce Connected', `Successfully synced catalog & webhooks for ${wooUrl}`);
    } catch (err: any) {
      toast.error('WooCommerce Connection Failed', err.message || 'Failed to link WooCommerce');
    }
  };

  const handleConnectSquareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!squareLocId || !squareToken) return;
    try {
      await connectSquare(squareLocId, squareToken);
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      setIsSquareModalOpen(false);
      toast.success('Square POS Connected', `Successfully connected register location ${squareLocId}`);
    } catch (err: any) {
      toast.error('Square Connection Failed', err.message || 'Failed to link Square register');
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'shopify':
        return <ShoppingBag className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'woocommerce':
        return <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      default:
        return <FileSpreadsheet className="w-5 h-5 text-brand-600 dark:text-brand-400" />;
    }
  };

  if (isIntegrationsLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-10 w-72 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LoadingSkeleton className="h-40 rounded-xl" />
          <LoadingSkeleton className="h-40 rounded-xl" />
        </div>
      </div>
    );
  }

  const integrations = integrationsData?.integrations || [];
  const platforms = directoryData?.platforms || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-heading">
              Store &amp; ERP Integrations
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
              {integrations.length} Active Connectors
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Connect live e-commerce channels, ERP databases, or upload catalog CSVs for sub-second telemetry sync.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs"
          >
            <UploadCloud className="w-3.5 h-3.5 text-brand-500" />
            <span>Upload CSV</span>
          </button>

          <button
            onClick={() => setIsShopifyModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Connect New Store</span>
          </button>
        </div>
      </div>


      {/* Active Connected Integrations */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Connected Live Channels
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl p-5 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                      {getPlatformIcon(item.platform)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</h3>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Live Sync
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {item.config?.store_domain || item.config?.store_url || 'Dedicated Store Endpoint'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => disconnectMutation.mutate(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    title="Disconnect Integration"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 text-xs space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>Last Synchronization:</span>
                    <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                      {new Date(item.last_sync_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Webhooks Health:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">100% Active</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Sync Interval: Every 60 mins</span>
                <button
                  onClick={() => handleManualSync(item.id)}
                  disabled={syncingId === item.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingId === item.id ? 'animate-spin' : ''}`} />
                  <span>{syncingId === item.id ? 'Syncing...' : 'Sync Now'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Directory */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Available Connectors &amp; App Directory
          </h2>
          <span className="text-xs text-slate-400">Bi-directional APIs &amp; Webhooks</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl p-5 shadow-card flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                    {getPlatformIcon(p.id)}
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                    {p.badge}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{p.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {p.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <a
                  href={p.docs_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                >
                  <span>API Docs</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                {p.id === 'shopify' ? (
                  <button
                    onClick={() => setIsShopifyModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-xs"
                  >
                    Connect
                  </button>
                ) : p.id === 'amazon' ? (
                  <button
                    onClick={() => setIsAmazonModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                  >
                    Connect
                  </button>
                ) : p.id === 'woocommerce' ? (
                  <button
                    onClick={() => setIsWooModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
                  >
                    Connect
                  </button>
                ) : p.id === 'square' ? (
                  <button
                    onClick={() => setIsSquareModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white shadow-xs"
                  >
                    Connect
                  </button>
                ) : (
                  <button
                    onClick={() => setIsCsvModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200"
                  >
                    Configure
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shopify Connection Modal */}
      {isShopifyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Connect Shopify Store</h3>
              </div>
              <button onClick={() => setIsShopifyModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleConnectShopifySubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Shopify Store Domain
                </label>
                <input
                  type="text"
                  required
                  value={shopifyDomain}
                  onChange={e => setShopifyDomain(e.target.value)}
                  placeholder="your-store.myshopify.com"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Shopify Admin API Access Token
                </label>
                <input
                  type="password"
                  required
                  value={shopifyToken}
                  onChange={e => setShopifyToken(e.target.value)}
                  placeholder="shpat_xxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>Tokens are stored with AES-256 encryption. Automated webhooks will be registered for orders and inventory.</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsShopifyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-dark-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white"
                >
                  Authorize &amp; Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Amazon SP-API Connection Modal */}
      {isAmazonModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Connect Amazon SP-API</h3>
              </div>
              <button onClick={() => setIsAmazonModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleConnectAmazonSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Amazon Seller ID / Merchant Token
                </label>
                <input
                  type="text"
                  required
                  value={amazonSellerId}
                  onChange={e => setAmazonSellerId(e.target.value)}
                  placeholder="A3XXXXXXEXAMPLE"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-900 dark:text-white uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  LWA Client ID
                </label>
                <input
                  type="text"
                  required
                  value={amazonClientId}
                  onChange={e => setAmazonClientId(e.target.value)}
                  placeholder="amzn1.application-oa2-client.xxxx"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  LWA Refresh Token
                </label>
                <input
                  type="password"
                  required
                  value={amazonRefreshToken}
                  onChange={e => setAmazonRefreshToken(e.target.value)}
                  placeholder="Atzr|IwEBIKxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>SP-API credentials authorize read-only FBA inventory buffers and order transaction streams.</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAmazonModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-dark-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                >
                  Connect SP-API
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WooCommerce Connection Modal */}
      {isWooModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Connect WooCommerce Store</h3>
              </div>
              <button onClick={() => setIsWooModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleConnectWooSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  WordPress / WooCommerce Store URL
                </label>
                <input
                  type="url"
                  required
                  value={wooUrl}
                  onChange={e => setWooUrl(e.target.value)}
                  placeholder="https://mystore.com"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Consumer Key (ck_...)
                </label>
                <input
                  type="text"
                  required
                  value={wooKey}
                  onChange={e => setWooKey(e.target.value)}
                  placeholder="ck_xxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Consumer Secret (cs_...)
                </label>
                <input
                  type="password"
                  required
                  value={wooSecret}
                  onChange={e => setWooSecret(e.target.value)}
                  placeholder="cs_xxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWooModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-dark-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
                >
                  Authorize WooCommerce
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Square POS Connection Modal */}
      {isSquareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-slate-800 dark:text-slate-200" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Connect Square POS Register</h3>
              </div>
              <button onClick={() => setIsSquareModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleConnectSquareSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Square Location ID
                </label>
                <input
                  type="text"
                  required
                  value={squareLocId}
                  onChange={e => setSquareLocId(e.target.value)}
                  placeholder="LXXXXXXXXXXXX"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Square Access Token (OAuth / Personal)
                </label>
                <input
                  type="password"
                  required
                  value={squareToken}
                  onChange={e => setSquareToken(e.target.value)}
                  placeholder="EAAAExxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSquareModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-dark-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white shadow-xs"
                >
                  Link Square Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Smart CSV Importer Modal */}
      <SmartCsvImporterModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
      />

    </div>
  );
};
