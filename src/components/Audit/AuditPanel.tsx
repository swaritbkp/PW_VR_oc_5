'use client';

import React from 'react';

export interface AuditMetadata {
  readonly agentVersion: string;
  readonly model: string;
  readonly promptVersions: {
    readonly core: string;
    readonly extras: string;
  };
  readonly guardrailsPassed: boolean;
  readonly schemaValidated: boolean;
}

export interface AuditPanelProps {
  readonly metadata: AuditMetadata;
  readonly onClose?: () => void;
}

function renderRow(label: string, value: string, isOk?: boolean) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-stone-100 last:border-0 text-xs">
      <span className="text-stone-500 font-medium">{label}</span>
      <span
        className={`font-mono font-semibold ${
          isOk !== undefined ? (isOk ? 'text-emerald-700' : 'text-red-700') : 'text-stone-900'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function renderAuditRows(metadata: AuditMetadata) {
  return (
    <div className="bg-white p-3 rounded-xl border border-stone-200 divide-y divide-stone-100">
      {renderRow('Agent Version', metadata.agentVersion)}
      {renderRow('Model', metadata.model)}
      {renderRow('Core Prompt Version', metadata.promptVersions.core)}
      {renderRow('Extras Prompt Version', metadata.promptVersions.extras)}
      {renderRow(
        'Post-Parse Guardrails',
        metadata.guardrailsPassed ? 'PASSED (0 leaks)' : 'FAILED',
        metadata.guardrailsPassed,
      )}
      {renderRow(
        'Zod Schema Conformance',
        metadata.schemaValidated ? 'STRICT PASS' : 'FAILED',
        metadata.schemaValidated,
      )}
    </div>
  );
}

/**
 * Displays the transparent GenAI audit panel showing prompt semver, model hash, and schema compliance.
 */
export function AuditPanel({ metadata, onClose }: AuditPanelProps): React.JSX.Element {
  return (
    <div
      role="region"
      aria-label="GenAI Audit Panel"
      className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3"
      data-testid="audit-panel"
    >
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold text-stone-900 text-xs">GenAI Provenance & Audit</h4>
          <p className="text-[11px] text-stone-500">
            Every plan output is schema-constrained and guardrail-verified.
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close audit panel"
            className="text-stone-400 hover:text-stone-700 text-xs p-1"
          >
            ✕
          </button>
        )}
      </div>
      {renderAuditRows(metadata)}
    </div>
  );
}
