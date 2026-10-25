'use client';

import React, { useState } from 'react';
import type { BudgetLine } from '../../lib/budget/engine';
import type { TaskCategory } from '../../lib/plan/types';

export interface AddCustomItemFormProps {
  readonly onAddItem: (item: BudgetLine) => void;
}

const CATEGORIES: readonly TaskCategory[] = [
  'venue',
  'food',
  'decor',
  'media',
  'entertainment',
  'logistics',
  'planning',
];

function isTaskCategory(val: string): val is TaskCategory {
  switch (val) {
    case 'venue':
    case 'food':
    case 'decor':
    case 'media':
    case 'entertainment':
    case 'logistics':
    case 'planning':
      return true;
    default:
      return false;
  }
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
        placeholder="Item name"
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
        className="p-1.5 text-xs border border-stone-200 rounded-lg bg-white capitalize"
      >
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
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

/**
 * Form allowing hosts to add custom line items to the celebration budget ledger.
 */
export function AddCustomItemForm({ onAddItem }: AddCustomItemFormProps): React.JSX.Element {
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
      drivers: ['budget'],
      notes: 'Custom line item added by host',
    });
    setNewName('');
    setNewRate(5000);
  };

  return (
    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
      <span className="text-xs font-bold text-stone-800 block">Add Custom Budget Item</span>
      <FormInputs
        name={newName}
        cat={newCat}
        unit={newUnit}
        rate={newRate}
        onNameChange={setNewName}
        onCatChange={setNewCat}
        onUnitChange={setNewUnit}
        onRateChange={setNewRate}
        onAdd={handleAdd}
      />
    </div>
  );
}
