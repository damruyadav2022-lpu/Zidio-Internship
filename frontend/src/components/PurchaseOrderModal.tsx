import React from 'react';
import { X, FileDown, FileSpreadsheet, CheckCircle, Package } from 'lucide-react';
import { PurchaseOrder } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { exportPurchaseOrderPDF, exportToCSV } from '../utils/exportUtils';
import { useToast } from '../context/ToastContext';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseOrder | null;
}

export const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({
  isOpen,
  onClose,
  purchaseOrder
}) => {
  const toast = useToast();
  if (!isOpen || !purchaseOrder) return null;

  const handleDownloadCSV = () => {
    const exportRows = purchaseOrder.lines.map(line => ({
      'PO Number': purchaseOrder.po_number,
      'Date': purchaseOrder.created_date,
      'Supplier': purchaseOrder.supplier,
      'Product ID': line.ProductID,
      'Product Name': line.ProductName,
      'Category': line.Category,
      'Quantity': line.Quantity,
      'Unit Price': line.UnitPrice,
      'Subtotal': line.Subtotal
    }));
    exportToCSV(exportRows, `${purchaseOrder.po_number}.csv`);
  };

  const handleDownloadPDF = () => {
    exportPurchaseOrderPDF(purchaseOrder);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-dark-border bg-slate-50/70 dark:bg-slate-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Purchase Order: {purchaseOrder.po_number}
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                  Approved
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generated from RetailPulse Statistical Inventory Replenishment Engine
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PO Content Details */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Supplier / Vendor</span>
              <strong className="text-slate-900 dark:text-white block truncate">{purchaseOrder.supplier}</strong>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Issue Date</span>
              <strong className="text-slate-900 dark:text-white block">{formatDate(purchaseOrder.created_date)}</strong>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Expected Delivery</span>
              <strong className="text-slate-900 dark:text-white block">{formatDate(purchaseOrder.expected_delivery)}</strong>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Order Status</span>
              <strong className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Ready to Dispatch
              </strong>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-200 dark:border-dark-border rounded-xl overflow-hidden max-h-64 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold sticky top-0 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3 text-right">Qty</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {purchaseOrder.lines.map((line, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3 font-mono font-medium text-slate-900 dark:text-white">{line.ProductID}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{line.ProductName}</td>
                    <td className="p-3 text-right font-bold text-slate-900 dark:text-white">{line.Quantity}</td>
                    <td className="p-3 text-right text-slate-600 dark:text-slate-400">{formatCurrency(line.UnitPrice)}</td>
                    <td className="p-3 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(line.Subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total Summary */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-brand-50/50 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-900/30">
            <div className="text-xs text-brand-900 dark:text-brand-300">
              Total Order Volume: <strong>{purchaseOrder.total_items} SKUs</strong> • <strong>{purchaseOrder.total_units} total units</strong>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Total Purchase Value</span>
              <span className="text-2xl font-extrabold text-brand-700 dark:text-brand-300 font-heading">
                {formatCurrency(purchaseOrder.total_amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-100 dark:border-dark-border bg-slate-50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Close Window
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadCSV}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Download CSV</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition-colors"
            >
              <FileDown className="w-4 h-4 text-brand-600" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={async () => {
                const supplierEmail = prompt('Enter Supplier Procurement Email:', 'procurement@apex-logistics.com');
                if (supplierEmail) {
                  try {
                    const { sendPOEmail } = await import('../services/actionService');
                    await sendPOEmail({
                      po_number: purchaseOrder.po_number,
                      supplier_name: purchaseOrder.supplier,
                      supplier_email: supplierEmail,
                      total_amount: purchaseOrder.total_amount,
                      total_units: purchaseOrder.total_units
                    });
                    toast.success('PO Dispatched', `Purchase order ${purchaseOrder.po_number} successfully dispatched to ${supplierEmail}!`);
                  } catch (err: any) {
                    toast.error('Dispatch Failed', err.message || 'Failed to dispatch PO email');
                  }
                }
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-md transition-colors"
            >
              <span>Email to Supplier</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
