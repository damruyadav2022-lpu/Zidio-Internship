import React, { useEffect, useState } from 'react';
import { X, Printer, Download, Building2, CheckCircle2, ShieldCheck, FileText } from 'lucide-react';
import { getInvoiceReceipt } from '../services/api';
import { InvoiceReceiptDetails } from '../types';

interface InvoiceReceiptModalProps {
  invoiceNumber: string | null;
  onClose: () => void;
}

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({ invoiceNumber, onClose }) => {
  const [receipt, setReceipt] = useState<InvoiceReceiptDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!invoiceNumber) return;
    setIsLoading(true);
    getInvoiceReceipt(invoiceNumber)
      .then(data => {
        setReceipt(data);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [invoiceNumber]);

  if (!invoiceNumber) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Actions Bar */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-dark-border flex items-center justify-between bg-slate-50 dark:bg-slate-900/30 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-600" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Tax Invoice &amp; Payment Receipt
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div id="printable-receipt" className="p-8 space-y-6 text-slate-800 dark:text-slate-200 text-xs bg-white dark:bg-dark-card">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-pulse-orange text-white flex items-center justify-center font-bold text-sm">
                  RP
                </div>
                <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white font-heading">
                  RETAILPULSE AI
                </span>
              </div>
              <p className="mt-2 text-slate-500 text-[11px] leading-relaxed">
                RetailPulse AI Technologies Inc.<br />
                100 Montgomery Street, Suite 2400<br />
                San Francisco, CA 94104<br />
                EIN: US-94-3829104
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-2">
                Paid in Full
              </span>
              <h2 className="text-lg font-black text-slate-900 dark:text-white font-mono">
                {receipt?.invoice.invoice_number || invoiceNumber}
              </h2>
              <span className="text-slate-400 block text-[11px] mt-0.5">
                Date: {receipt?.invoice.date || new Date().toISOString().slice(0, 10)}
              </span>
            </div>
          </div>

          {/* Billed To */}
          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Billed To</span>
              <strong className="text-slate-900 dark:text-white block mt-1 text-sm">
                {receipt?.invoice.customer_name || 'Retail Evaluator'}
              </strong>
              <span className="text-slate-500 block">{receipt?.invoice.customer_company || 'Apex Retail Group'}</span>
              <span className="text-slate-500 block">{receipt?.invoice.customer_email || 'evaluator@retailpulse.ai'}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Transaction Info</span>
              <div className="mt-1 space-y-1 text-slate-600 dark:text-slate-400">
                <div>Ref: <strong className="font-mono text-slate-800 dark:text-slate-200">{receipt?.invoice.transaction_id || 'TXN-RP-98432176'}</strong></div>
                <div>Method: <strong>{receipt?.invoice.payment_method || 'Credit Card (ends in 4242)'}</strong></div>
                <div>Cycle: <strong>{receipt?.invoice.billing_cycle || 'Annual'}</strong></div>
              </div>
            </div>
          </div>

          {/* Itemized Line Items */}
          <div className="space-y-3">
            <div className="flex justify-between font-bold text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-2 text-[11px] uppercase">
              <span>Description</span>
              <span>Amount</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <div>
                <strong className="text-slate-900 dark:text-white block">
                  {receipt?.invoice.plan_name || 'Multi-Channel Brands (Growth Tier)'}
                </strong>
                <span className="text-[11px] text-slate-500">
                  Full SaaS platform access, PyTorch LSTM Forecaster &amp; ROP Replenishment
                </span>
              </div>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                ${((receipt?.invoice.amount || 4790) + (receipt?.invoice.discount_amount || 0)).toLocaleString()}.00
              </span>
            </div>

            {receipt?.invoice.discount_amount ? (
              <div className="flex justify-between items-center py-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>Promotional Discount Applied</span>
                <span className="font-mono">-${receipt.invoice.discount_amount.toLocaleString()}.00</span>
              </div>
            ) : null}

            <div className="flex justify-between items-center py-1 text-slate-500">
              <span>Sales Tax (0.00% Jurisdiction Exempt)</span>
              <span className="font-mono">$0.00</span>
            </div>
          </div>

          {/* Total */}
          <div className="pt-4 border-t-2 border-slate-200 dark:border-slate-800 flex justify-between items-baseline">
            <div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">Total Amount Charged:</span>
              <span className="text-[11px] text-slate-400 block">Electronic Fund Clearance Verified</span>
            </div>
            <span className="text-2xl font-black text-brand-600 font-heading">
              ${(receipt?.invoice.amount || 4790).toLocaleString()}.00 USD
            </span>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-[11px] text-slate-400 space-y-1">
            <p>Thank you for partnering with RetailPulse AI. For billing inquiries, contact billing@retailpulse.ai.</p>
            <p className="text-[10px]">All subscriptions are subject to our standard Terms of Service and SLA.</p>
          </div>

        </div>

      </div>
    </div>
  );
};
