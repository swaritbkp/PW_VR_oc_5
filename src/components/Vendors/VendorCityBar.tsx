'use client';

import React from 'react';
import type { VendorNeedId } from '@/lib/plan/types';

export interface VendorCityBarProps {
  readonly currentCity: string;
  readonly onSelectCity: (city: string) => void;
  readonly currentCategory?: VendorNeedId;
  readonly onSelectCategory: (category: VendorNeedId) => void;
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
}

const POPULAR_CITIES = ['Chandigarh', 'Delhi', 'Jaipur', 'Mumbai', 'Bengaluru', 'Amritsar'];

const CATEGORIES: readonly { readonly id: VendorNeedId; readonly label: string; readonly icon: string }[] = [
  { id: 'venue', label: 'Venues', icon: '🏛️' },
  { id: 'caterer', label: 'Catering', icon: '🍲' },
  { id: 'decorator', label: 'Decor', icon: '🌺' },
  { id: 'photographer', label: 'Photography', icon: '📸' },
  { id: 'music', label: 'Music & DJ', icon: '🎵' },
  { id: 'makeup', label: 'Makeup', icon: '💄' },
];

function CitySelectorDropdown({
  currentCity,
  onSelectCity,
}: {
  readonly currentCity: string;
  readonly onSelectCity: (city: string) => void;
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <span className="text-lg">📍</span>
      <div>
        <label
          htmlFor="city-select"
          className="block text-[10px] font-bold uppercase tracking-wider text-stone-400"
        >
          Location Aware City
        </label>
        <select
          id="city-select"
          value={currentCity}
          onChange={(e) => onSelectCity(e.target.value)}
          className="text-xs font-bold text-stone-900 bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
        >
          {POPULAR_CITIES.map((c) => (
            <option key={c} value={c}>
              {c}, India
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function VendorSearchInput({
  searchQuery,
  onSearchChange,
}: {
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
}): React.JSX.Element {
  return (
    <div className="relative flex-1 sm:max-w-xs">
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Live search by name or specialty..."
        className="w-full text-xs py-2 pl-8 pr-3 rounded-full bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
      />
      <span className="absolute left-2.5 top-2 text-stone-400 text-xs">🔍</span>
    </div>
  );
}

function CategoryFilterPills({
  currentCategory,
  onSelectCategory,
}: {
  readonly currentCategory?: VendorNeedId;
  readonly onSelectCategory: (category: VendorNeedId) => void;
}): React.JSX.Element {
  return (
    <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-100">
      {CATEGORIES.map((cat) => {
        const isActive = currentCategory === cat.id;
        const cls = isActive
          ? 'bg-amber-800 text-white shadow-xs scale-102'
          : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200/60';

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${cls}`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Search and filter toolbar for selecting celebration city, vendor category, and keyword search query.
 */
export function VendorCityBar({
  currentCity,
  onSelectCity,
  currentCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
}: VendorCityBarProps): React.JSX.Element {
  return (
    <div className="space-y-3 p-4 bg-white rounded-3xl border border-stone-200/90 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <CitySelectorDropdown currentCity={currentCity} onSelectCity={onSelectCity} />
        <VendorSearchInput searchQuery={searchQuery} onSearchChange={onSearchChange} />
      </div>
      <CategoryFilterPills
        currentCategory={currentCategory}
        onSelectCategory={onSelectCategory}
      />
    </div>
  );
}
