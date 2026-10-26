'use client';

import React, { useState } from 'react';
import type { BudgetLine } from '../../lib/budget/engine';
import type { TaskCategory } from '../../lib/plan/types';

export interface AddCustomItemFormProps {
  readonly onAddItem: (item: BudgetLine) => void;
}

export interface NewAgePreset {
  readonly label: string;
  readonly name: string;
  readonly category: TaskCategory;
  readonly unit: 'fixed' | 'per_head';
  readonly rateInr: number;
  readonly notes: string;
}

export const NEW_AGE_PRESETS: readonly NewAgePreset[] = [
  {
    label: '🎤 + Star Night & Artist Rider (₹4,50,000 Fixed)',
    name: 'Star Night: Artist Tech Rider & Sound NOC',
    category: 'entertainment',
    unit: 'fixed',
    rateInr: 450000,
    notes: 'Star Night celebrity artist tech rider, sound setup & NOC',
  },
  {
    label: '🍲 + Specialty 2nd Caterer / Live Chaat Counter (₹450/guest)',
    name: 'Specialty 2nd Caterer: Live Chaat & Halwai Counter',
    category: 'food',
    unit: 'per_head',
    rateInr: 450,
    notes: 'Secondary live counters, regional chaat & dessert halwai zoning',
  },
  {
    label: '🍸 + Craft Bar, Mixology & Excise Permit (₹650/guest)',
    name: 'Craft Bar, Mixology & Excise Permit (L-12A)',
    category: 'food',
    unit: 'per_head',
    rateInr: 650,
    notes: 'Craft mixology cocktail bar, bartenders & state excise L-12A permit',
  },
];

const CATEGORY_LABELS: readonly { readonly id: TaskCategory; readonly label: string }[] = [
  { id: 'entertainment', label: 'Entertainment / Star Night' },
  { id: 'food', label: 'Food / Multi-Caterer' },
  { id: 'venue', label: 'Venue & Grounds' },
  { id: 'decor', label: 'Decor & Styling' },
  { id: 'media', label: 'Media & Photo' },
  { id: 'permits', label: 'Beverages, Bar & Permits' },
  { id: 'logistics', label: 'Logistics' },
  { id: 'planning', label: 'Planning' },
];

const TASK_CATEGORIES: ReadonlySet<string> = new Set<TaskCategory>([
  'venue', 'food', 'decor', 'media', 'entertainment', 'logistics', 'planning', 'permits',
]);

function isTaskCategory(val: string): val is TaskCategory {
  return TASK_CATEGORIES.has(val);
}

function isBudgetUnit(val: string): val is 'fixed' | 'per_head' {
  return val === 'fixed' || val === 'per_head';
}

function RateAndSubmitInput({
  rate,
  onRateChange,
  onAdd,
}: {
  readonly rate: number;
  readonly onRateChange: (v: number) => void;
  readonly onAdd: () => void;
}) {
  return (
    <div className="flex gap-1.5">
      <input
        aria-label="New item rate in INR"
        type="number"
        min="0"
        value={rate}
        onChange={(e) => onRateChange(parseInt(e.target.value, 10) || 0)}
        className="w-full p-1.5 text-xs border border-stone-200 rounded-lg bg-white"
      />
      <button
        type="button"
        onClick={onAdd}
        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-800 text-white hover:bg-amber-900 transition-colors"
      >
        + Add
      </button>
    </div>
  );
}

interface FormInputsProps {
  readonly name: string;
  readonly cat: TaskCategory;
  readonly unit: 'fixed' | 'per_head';
  readonly rate: number;
  readonly onNameChange: (v: string) => void;
  readonly onCatChange: (v: TaskCategory) => void;
  readonly onUnitChange: (v: 'fixed' | 'per_head') => void;
  readonly onRateChange: (v: number) => void;
  readonly onAdd: () => void;
}

function FormInputs(p: FormInputsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <input
        aria-label="New item name"
        placeholder="Custom item name"
        value={p.name}
        onChange={(e) => p.onNameChange(e.target.value)}
        className="p-1.5 text-xs border border-stone-200 rounded-lg bg-white"
      />
      <select
        aria-label="New item category"
        value={p.cat}
        onChange={(e) => {
          if (isTaskCategory(e.target.value)) p.onCatChange(e.target.value);
        }}
        className="p-1.5 text-xs border border-stone-200 rounded-lg bg-white"
      >
        {CATEGORY_LABELS.map((c) => (
          <option key={c.id} value={c.id}>{c.label}</option>
        ))}
      </select>
      <select
        aria-label="New item unit"
        value={p.unit}
        onChange={(e) => {
          if (isBudgetUnit(e.target.value)) p.onUnitChange(e.target.value);
        }}
        className="p-1.5 text-xs border border-stone-200 rounded-lg bg-white"
      >
        <option value="fixed">Fixed Cost</option>
        <option value="per_head">Per Guest</option>
      </select>
      <RateAndSubmitInput rate={p.rate} onRateChange={p.onRateChange} onAdd={p.onAdd} />
    </div>
  );
}

function NewAgePresetPills({ onSelectPreset }: { readonly onSelectPreset: (p: NewAgePreset) => void }) {
  return (
    <div className="pt-2 border-t border-stone-200/80 space-y-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
        ✨ New-Age Indian Celebration Nuance Presets (1-Click Add):
      </span>
      <div className="flex flex-wrap gap-1.5">
        {NEW_AGE_PRESETS.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectPreset(p)}
            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition-colors shadow-2xs"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function useAddCustomItemForm(onAddItem: (item: BudgetLine) => void) {
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState<TaskCategory>('entertainment');
  const [newUnit, setNewUnit] = useState<'fixed' | 'per_head'>('fixed');
  const [newRate, setNewRate] = useState<number>(5000);

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAddItem({
      id: `custom_${Date.now()}`,
      category: newCat,
      name: newName.trim(),
      unit: newUnit,
      rateInr: newRate,
      quantity: 1,
      drivers: newUnit === 'per_head' ? ['guests', 'budget'] : ['budget'],
      notes: 'Custom line item added by host',
    });
    setNewName('');
    setNewRate(5000);
  };

  const handleSelectPreset = (p: NewAgePreset) => {
    onAddItem({
      id: `custom_nuance_${Date.now()}`,
      category: p.category,
      name: p.name,
      unit: p.unit,
      rateInr: p.rateInr,
      quantity: 1,
      drivers: p.unit === 'per_head' ? ['guests', 'budget'] : ['budget'],
      notes: p.notes,
    });
  };

  return { newName, setNewName, newCat, setNewCat, newUnit, setNewUnit, newRate, setNewRate, handleAdd, handleSelectPreset };
}

/**
 * Form allowing hosts to add custom line items and 1-click new-age celebration presets to the budget ledger.
 */
export function AddCustomItemForm({ onAddItem }: AddCustomItemFormProps): React.JSX.Element {
  const f = useAddCustomItemForm(onAddItem);

  return (
    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2.5">
      <span className="text-xs font-bold text-stone-800 block">Add Custom Budget Item</span>
      <FormInputs
        name={f.newName}
        cat={f.newCat}
        unit={f.newUnit}
        rate={f.newRate}
        onNameChange={f.setNewName}
        onCatChange={f.setNewCat}
        onUnitChange={f.setNewUnit}
        onRateChange={f.setNewRate}
        onAdd={f.handleAdd}
      />
      <NewAgePresetPills onSelectPreset={f.handleSelectPreset} />
    </div>
  );
}
