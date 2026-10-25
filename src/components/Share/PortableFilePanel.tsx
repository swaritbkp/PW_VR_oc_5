'use client';

import React, { useState } from 'react';
import type { PlanState } from '@/lib/plan/propagate';
import type { VendorSelection } from '@/lib/vendors/types';
import { exportJashnFile, importJashnFile, type ImportedPlan } from '@/lib/plan/portability';
import { IconCheckCircle, IconDownloadFile, IconUploadFile } from '../UI/JashnIcons';

export interface PortableFilePanelProps {
  readonly plan: PlanState;
  readonly vendorSelections?: readonly VendorSelection[];
  readonly onClose: () => void;
  readonly onImportPlan: (plan: PlanState, selections: readonly VendorSelection[]) => void;
}

function readFileAsText(file: File | undefined, onText: (content: string) => void) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === 'string') onText(reader.result);
  };
  reader.readAsText(file);
}

function triggerDownload(content: string, filename: string) {
  const blob = new Blob([content], { type: 'application/json' });
  if (typeof URL.createObjectURL === 'function') {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

function DropZoneFileInput({ onFileSelect }: { readonly onFileSelect: (content: string) => void }): React.JSX.Element {
  return (
    <>
      <input
        type="file"
        id="jashn-file-input"
        accept=".jashn,.json"
        onChange={(e) => readFileAsText(e.target.files?.[0], onFileSelect)}
        className="hidden"
      />
      <label
        htmlFor="jashn-file-input"
        className="mt-3 inline-block px-3 py-1.5 text-xs font-bold rounded-xl bg-stone-900 text-white cursor-pointer hover:bg-stone-800 transition-colors shadow-xs"
      >
        Select File
      </label>
    </>
  );
}

function DropZone({
  onFileSelect,
  isDragging,
  setIsDragging,
}: {
  readonly onFileSelect: (content: string) => void;
  readonly isDragging: boolean;
  readonly setIsDragging: (v: boolean) => void;
}): React.JSX.Element {
  const containerClass = isDragging
    ? 'border-amber-500 bg-amber-500/10'
    : 'border-stone-300 hover:border-amber-400 bg-stone-50/50';

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        readFileAsText(e.dataTransfer.files[0], onFileSelect);
      }}
      className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${containerClass}`}
    >
      <IconUploadFile className="w-8 h-8 mx-auto text-amber-600 mb-2" />
      <p className="text-xs font-bold text-stone-800">Drop your .jashn file here or browse</p>
      <p className="text-[11px] text-stone-500 mt-1">AC30-compliant schema validation (max 256 KB)</p>
      <DropZoneFileInput onFileSelect={onFileSelect} />
    </div>
  );
}

function ValidationSummary({
  imported,
  onApply,
}: {
  readonly imported: ImportedPlan;
  readonly onApply: () => void;
}): React.JSX.Element {
  return (
    <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
      <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
        <IconCheckCircle className="w-4 h-4 text-emerald-700" />
        <span>Verified AC30-compliant .jashn package</span>
      </div>
      <p className="text-[11px] text-emerald-800">
        Restored {imported.restoredTaskCount} tasks and {imported.restoredVendorCount} vendor selections. Checksum validated.
      </p>
      <button
        type="button"
        onClick={onApply}
        className="w-full py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs"
      >
        Hydrate Living Graph Workspace &rarr;
      </button>
    </div>
  );
}

function PortableFileHeader({ onClose }: { readonly onClose: () => void }): React.JSX.Element {
  return (
    <div className="flex items-center justify-between border-b border-stone-200 pb-3">
      <div>
        <h2 id="portable-panel-title" className="text-base font-bold text-stone-900 flex items-center gap-2">
          <span>📦</span> Save &amp; Load .jashn Event Package
        </h2>
        <p className="text-xs text-stone-500">Portable offline living plans with AC30 data safety</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="p-1 text-stone-400 hover:text-stone-700 text-sm font-bold"
      >
        ✕
      </button>
    </div>
  );
}

function ExportBox({
  plan,
  vendorSelections,
  onExport,
}: {
  readonly plan: PlanState;
  readonly vendorSelections: readonly VendorSelection[];
  readonly onExport: () => void;
}): React.JSX.Element {
  return (
    <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-300/80 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-stone-900">Current Celebration State</span>
        <span className="text-[11px] font-semibold text-amber-900">
          {plan.tasks.length} tasks • {vendorSelections.length} vendors
        </span>
      </div>
      <button
        type="button"
        onClick={onExport}
        className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
      >
        <IconDownloadFile className="w-4 h-4" />
        <span>Export Portable .jashn File</span>
      </button>
    </div>
  );
}

function usePortableFile(plan: PlanState, vendorSelections: readonly VendorSelection[]) {
  const [imported, setImported] = useState<ImportedPlan | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleExport = () => {
    const jsonStr = exportJashnFile(plan, vendorSelections);
    const slug = `${plan.intake.eventType}-${plan.intake.city}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    triggerDownload(jsonStr, `${slug}-plan.jashn`);
  };

  const handleRawContent = (raw: string) => {
    setErrorMsg(null);
    const res = importJashnFile(raw);
    if (res.ok) {
      setImported(res.value);
    } else {
      const errDetails = res.error.details ? ` (${res.error.details})` : '';
      setErrorMsg(`Import failed: ${res.error.error}${errDetails}`);
    }
  };

  return { imported, errorMsg, isDragging, setIsDragging, handleExport, handleRawContent };
}

/**
 * Manages portable `.jashn` event package exporting, checksum verification, and drag-and-drop loading.
 */
export function PortableFilePanel({
  plan,
  vendorSelections = [],
  onClose,
  onImportPlan,
}: PortableFilePanelProps): React.JSX.Element {
  const { imported, errorMsg, isDragging, setIsDragging, handleExport, handleRawContent } =
    usePortableFile(plan, vendorSelections);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="portable-panel-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-stone-200">
        <PortableFileHeader onClose={onClose} />
        <ExportBox plan={plan} vendorSelections={vendorSelections} onExport={handleExport} />
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-stone-800">Restore or Import Celebration Package</h3>
          <DropZone onFileSelect={handleRawContent} isDragging={isDragging} setIsDragging={setIsDragging} />
        </div>
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
            {errorMsg}
          </div>
        )}
        {imported && (
          <ValidationSummary
            imported={imported}
            onApply={() => { onImportPlan(imported.plan, imported.vendorSelections); onClose(); }}
          />
        )}
      </div>
    </div>
  );
}
