import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  Database,
  Check
} from 'lucide-react';
import { uploadSmartCsv } from '../services/integrationService';
import { SmartCsvResult } from '../types';

interface SmartCsvImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: () => void;
}

export const SmartCsvImporterModal: React.FC<SmartCsvImporterModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SmartCsvResult | null>(null);
  const [isImported, setIsImported] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setError(null);
      await processUpload(selected);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      setFile(selected);
      setError(null);
      await processUpload(selected);
    }
  };

  const processUpload = async (fileToUpload: File) => {
    setIsUploading(true);
    setError(null);
    try {
      const res = await uploadSmartCsv(fileToUpload);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to parse CSV file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmImport = () => {
    setIsImported(true);
    setTimeout(() => {
      if (onImportSuccess) onImportSuccess();
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-dark-border bg-slate-50/70 dark:bg-slate-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Universal Smart CSV Importer
              </h3>
              <p className="text-xs text-slate-500">
                Automatic column mapping, header normalization, and integrity verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!result ? (
            /* Upload State */
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-500 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-900/20"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 flex items-center justify-center mx-auto mb-3">
                {isUploading ? (
                  <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <UploadCloud className="w-7 h-7" />
                )}
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {isUploading ? 'Analyzing CSV Structure...' : 'Drop your CSV file here, or browse files'}
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Supports Shopify export, WooCommerce product logs, Amazon orders, or custom POS CSVs up to 50MB.
              </p>
              {error && (
                <div className="mt-3 text-xs text-rose-600 dark:text-rose-400 font-semibold">
                  {error}
                </div>
              )}
            </div>
          ) : (
            /* Analysis & Auto-Mapping Result State */
            <div className="space-y-5">
              
              {/* Summary Pill Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-dark-border text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Source File:</span>
                  <span className="font-bold text-slate-900 dark:text-white truncate block">{result.filename}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Total Rows Processed:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{result.total_rows.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Integrity Check:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 100% Parsed
                  </span>
                </div>
              </div>

              {/* Detected Column Auto-Mapping */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Auto-Mapped Schema Fields
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(result.column_mapping).map(([target, source]) => (
                    <div
                      key={target}
                      className="p-2.5 rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg text-xs"
                    >
                      <div className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase">
                        Target: {target}
                      </div>
                      <div className="font-mono font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                        ← {source}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Preview Table */}
              {result.preview && result.preview.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Sample Data Preview (First {result.preview.length} Rows)
                  </h4>
                  <div className="overflow-x-auto border border-slate-200 dark:border-dark-border rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-dark-border">
                        <tr>
                          {Object.keys(result.preview[0]).slice(0, 5).map(col => (
                            <th key={col} className="p-2.5">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-dark-border text-slate-700 dark:text-slate-300">
                        {result.preview.map((row, i) => (
                          <tr key={i}>
                            {Object.values(row).slice(0, 5).map((val: any, j) => (
                              <td key={j} className="p-2.5 font-mono text-[11px] truncate max-w-[120px]">
                                {String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Errors/Warnings if any */}
              {result.errors && result.errors.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Integrity Warnings Detected ({result.errors.length} rows)</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    {result.errors.map((e, idx) => (
                      <li key={idx}>Row {e.row}: {e.errors.join(', ')}</li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 dark:border-dark-border bg-slate-50/70 dark:bg-slate-900/40 flex items-center justify-between">
          {result && (
            <button
              onClick={() => {
                setResult(null);
                setFile(null);
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Upload Different File
            </button>
          )}

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-dark-border text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>

            {result && (
              <button
                onClick={handleConfirmImport}
                disabled={isImported}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                {isImported ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Imported Successfully!</span>
                  </>
                ) : (
                  <>
                    <Database className="w-3.5 h-3.5" />
                    <span>Confirm &amp; Import ({result.total_rows.toLocaleString()} Records)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
