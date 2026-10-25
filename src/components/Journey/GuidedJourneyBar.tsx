'use client';

import React, { useState } from 'react';
import type { GuidedActionId, JourneyEvaluation } from '@/lib/plan/journey';
import { IconCheckCircle, IconSparkles } from '../UI/JashnIcons';

export interface GuidedJourneyBarProps {
  readonly journey: JourneyEvaluation;
  readonly onTriggerAction: (actionId: GuidedActionId) => void;
  readonly onSimulateTourStep?: (stepIndex: number) => void;
}

function renderStepItem(
  step: JourneyEvaluation['steps'][number],
  idx: number,
  onStepClick: (actionId: GuidedActionId) => void,
) {
  const isDone = step.isComplete;
  const isActive = step.isActive;

  return (
    <button
      key={step.id}
      type="button"
      onClick={() => onStepClick(step.actionId)}
      className={`group flex items-center gap-2 p-2 rounded-xl text-left transition-all ${
        isActive
          ? 'bg-amber-500/10 border border-amber-400/80 shadow-xs'
          : 'hover:bg-stone-100/80 border border-transparent'
      }`}
    >
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
          isDone
            ? 'bg-emerald-600 text-white shadow-xs'
            : isActive
              ? 'bg-amber-600 text-white ring-2 ring-amber-300'
              : 'bg-stone-200 text-stone-600'
        }`}
      >
        {isDone ? <IconCheckCircle className="w-4 h-4 text-white" /> : idx + 1}
      </div>
      <div className="hidden sm:block">
        <p className={`text-xs font-bold ${isActive ? 'text-stone-900' : 'text-stone-700'}`}>
          {step.shortTitle}
        </p>
        <p className="text-[10px] text-stone-500 truncate max-w-[120px]">{step.description}</p>
      </div>
    </button>
  );
}

function renderProgressBar(progressPct: number, isTourActive: boolean, onToggleTour: () => void) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
        <span>{progressPct}% Complete</span>
        <div className="w-20 sm:w-28 h-2 bg-stone-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-amber-500 to-emerald-600 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={onToggleTour}
        className={`text-[11px] px-2.5 py-1 rounded-full font-bold border transition-colors ${
          isTourActive
            ? 'bg-amber-600 text-white border-amber-600'
            : 'bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200'
        }`}
      >
        {isTourActive ? 'Stop Tour' : 'Demo Tour'}
      </button>
    </div>
  );
}

function renderHeaderSection(progressPct: number, isTourActive: boolean, onToggleTour: () => void) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/60 pb-2">
      <div className="flex items-center gap-2">
        <span className="p-1 rounded-lg bg-amber-100 text-amber-800">
          <IconSparkles className="w-4 h-4" />
        </span>
        <div>
          <h2 className="text-xs font-black tracking-wider uppercase text-stone-800">
            5-Step Guided Event Journey
          </h2>
          <p className="text-[11px] text-stone-500">
            Autonomous workflow from vision to verified execution
          </p>
        </div>
      </div>
      {renderProgressBar(progressPct, isTourActive, onToggleTour)}
    </div>
  );
}

export function GuidedJourneyBar({
  journey,
  onTriggerAction,
  onSimulateTourStep,
}: GuidedJourneyBarProps): React.JSX.Element {
  const [tourActive, setTourActive] = useState(false);

  const handleToggleTour = () => {
    const next = !tourActive;
    setTourActive(next);
    if (next && onSimulateTourStep) {
      onSimulateTourStep(0);
    }
  };

  return (
    <nav
      aria-label="5-Step Guided Celebration Journey"
      className="p-3.5 sm:p-4 rounded-3xl bg-white/85 backdrop-blur-md border border-stone-200/90 shadow-sm space-y-3"
    >
      {renderHeaderSection(journey.progressPct, tourActive, handleToggleTour)}

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2">
        {journey.steps.map((st, i) =>
          renderStepItem(st, i, (act) => {
            onTriggerAction(act);
            if (tourActive && onSimulateTourStep) onSimulateTourStep(i);
          }),
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 bg-amber-500/5 rounded-2xl border border-amber-200/60">
        <p className="text-xs text-stone-700 font-medium flex items-center gap-2">
          <span className="text-amber-600 font-bold">Coach Nudge:</span>
          <span>{journey.nextGuidedPrompt}</span>
        </p>
        <button
          type="button"
          onClick={() => onTriggerAction(journey.nextAction.actionId)}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs hover:-translate-y-0.5 whitespace-nowrap"
        >
          <span>Guide Me:</span>
          <span>{journey.nextAction.label}</span>
          <span>&rarr;</span>
        </button>
      </div>
    </nav>
  );
}
