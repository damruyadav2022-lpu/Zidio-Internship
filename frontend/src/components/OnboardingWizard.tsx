import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Building2, 
  ShoppingBag, 
  Sliders, 
  Zap, 
  X, 
  ShieldCheck,
  UploadCloud,
  FileSpreadsheet,
  Layers
} from 'lucide-react';
import { SmartCsvImporterModal } from './SmartCsvImporterModal';

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState('Acme Retail Brands Inc.');
  const [storeName, setStoreName] = useState('Acme Flagship Online');
  const [selectedPlatform, setSelectedPlatform] = useState('Shopify');
  const [shopifyDomain, setShopifyDomain] = useState('acme-retail.myshopify.com');
  const [leadTimeDays, setLeadTimeDays] = useState(7);
  const [serviceLevel, setServiceLevel] = useState(95);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditComplete, setAuditComplete] = useState(false);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 3) {
      // Trigger instant audit
      setStep(4);
      setIsAuditing(true);
      setTimeout(() => {
        setIsAuditing(false);
        setAuditComplete(true);
      }, 1600);
    } else if (step < 4) {
      setStep(step + 1);
    } else {
      onComplete();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        
        {/* Top Progress Bar */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-5 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 flex items-center justify-center font-bold text-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                RetailPulse Commercial Onboarding Wizard
              </h3>
              <p className="text-xs text-slate-500">Step {step} of 4 • Production Store Activation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper Dots */}
        <div className="grid grid-cols-4 gap-1 p-2 bg-slate-100/60 dark:bg-slate-850">
          {[
            { num: 1, label: 'Organization' },
            { num: 2, label: 'Store Data' },
            { num: 3, label: 'Supply Rules' },
            { num: 4, label: 'AI Health Audit' }
          ].map(s => (
            <div
              key={s.num}
              className={`text-center py-1.5 rounded-lg text-xs font-semibold transition-all ${
                step >= s.num
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {s.num}. {s.label}
            </div>
          ))}
        </div>

        {/* Step Body */}
        <div className="p-6 space-y-5">
          
          {/* STEP 1: Organization & Business Profile */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Welcome! Tell us about your retail brand
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  We'll create an isolated multi-tenant organization workspace with dedicated tenant keys.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Company / Organization Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="e.g. Acme Apparel & Footwear Inc."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Store Channel Name
                  </label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={e => setStoreName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="e.g. Acme Flagship Online"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 flex items-start gap-3 text-xs text-blue-900 dark:text-blue-200">
                  <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">SOC2 Type II &amp; Tenant Isolation Ready:</strong>
                    Your customer emails, order records, and margins will be encrypted at rest and isolated by tenant ID.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Connect Store Data */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  How would you like to connect your catalog &amp; orders?
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select your primary platform or upload a product and sales CSV.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {[
                  { id: 'Shopify', name: 'Shopify', desc: '1-Click OAuth & Webhooks', icon: ShoppingBag },
                  { id: 'WooCommerce', name: 'WooCommerce', desc: 'REST API v3 Sync', icon: Layers },
                  { id: 'CSV', name: 'Smart CSV Upload', desc: 'Auto-mapped column parser', icon: FileSpreadsheet }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setSelectedPlatform(opt.id);
                      if (opt.id === 'CSV') setIsCsvModalOpen(true);
                    }}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      selectedPlatform === opt.id
                        ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 ring-2 ring-brand-500/20'
                        : 'border-slate-200 dark:border-dark-border bg-slate-50/50 dark:bg-slate-900/30 hover:border-slate-300'
                    }`}
                  >
                    <opt.icon className="w-5 h-5 text-brand-600 dark:text-brand-400 mb-2" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{opt.name}</div>
                      <div className="text-[11px] text-slate-500">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              {selectedPlatform === 'Shopify' && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-dark-border space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Shopify Store Domain (.myshopify.com)
                  </label>
                  <input
                    type="text"
                    value={shopifyDomain}
                    onChange={e => setShopifyDomain(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-900 dark:text-white"
                    placeholder="your-brand.myshopify.com"
                  />
                  <p className="text-[11px] text-slate-400">
                    We will register webhooks for instant order updates and automated inventory runway alerts.
                  </p>
                </div>
              )}

              {selectedPlatform === 'CSV' && (
                <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900/40 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-brand-900 dark:text-brand-200">Smart CSV Importer Ready</div>
                    <div className="text-[11px] text-brand-700 dark:text-brand-400">Drag &amp; drop any sales or inventory CSV</div>
                  </div>
                  <button
                    onClick={() => setIsCsvModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-bold hover:bg-brand-700"
                  >
                    Open Importer
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Supply Rules */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Configure Inventory &amp; Service Level Targets
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  These parameters guide the probabilistic Reorder Point (ROP) calculation and automated PO drafts.
                </p>
              </div>

              <div className="space-y-4 pt-1">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    <span>Target Fulfillment Service Level (Cycle SLA)</span>
                    <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{serviceLevel}%</span>
                  </div>
                  <input
                    type="range"
                    min="90"
                    max="99"
                    step="1"
                    value={serviceLevel}
                    onChange={e => setServiceLevel(Number(e.target.value))}
                    className="w-full accent-brand-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>90% (Lean Working Capital)</span>
                    <span>95% (Industry Standard)</span>
                    <span>99% (Near Zero Stockouts)</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    <span>Supplier Lead Time (Average Days)</span>
                    <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{leadTimeDays} days</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="30"
                    step="1"
                    value={leadTimeDays}
                    onChange={e => setLeadTimeDays(Number(e.target.value))}
                    className="w-full accent-brand-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>2 Days (Local Fast Restock)</span>
                    <span>7-14 Days (Regional Hub)</span>
                    <span>30 Days (Overseas Freight)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: First Automated AI Store Health Audit */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in text-center py-4">
              {isAuditing ? (
                <div className="flex flex-col items-center justify-center gap-3 py-6">
                  <div className="w-12 h-12 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    Running Deep Neural Health Audit...
                  </div>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Scanning transaction logs, checking ROP safety runway across SKUs, and fitting XGBoost churn weights.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900 dark:text-white font-heading">
                      Store Health Audit: 94.8 / 100
                    </h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      Initial baseline initialized! 48 SKUs analyzed, 2 critical replenishment triggers mapped, and revenue momentum calculated at +14.2% above benchmark.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-dark-border text-left">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Revenue Pace</div>
                      <div className="text-sm font-black text-emerald-600">+14.2% MoM</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">ROP Safety Alert</div>
                      <div className="text-sm font-black text-amber-600">2 Items at ROP</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Customer Retention</div>
                      <div className="text-sm font-black text-blue-600">88.6% Stable</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div className="p-5 border-t border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
          {step > 1 && step < 4 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-dark-border text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : <div />}

          <button
            onClick={handleNext}
            disabled={isAuditing}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md transition-all"
          >
            <span>{step === 3 ? 'Run Store Health Audit' : step === 4 ? 'Launch Commercial Dashboard' : 'Continue'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Smart CSV Importer Modal */}
      <SmartCsvImporterModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onImportSuccess={() => setIsCsvModalOpen(false)}
      />
    </div>
  );
};
