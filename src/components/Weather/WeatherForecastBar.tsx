'use client';

import React, { useEffect, useState } from 'react';
import {
  fetchWeatherForecast,
  getSeasonalClimatology,
  type WeatherForecast,
} from '@/lib/weather/weatherForecast';

export interface WeatherForecastBarProps {
  readonly city: string;
  readonly eventDate: string;
  readonly onFactorWeather: (forecast: WeatherForecast) => void;
}

function WeatherMetrics({ f }: { readonly f: WeatherForecast }): React.JSX.Element {
  const isWet = f.rainProbabilityPct > 25;
  const isWindy = f.windSpeedKmh > 20;

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs">
      <div className="flex items-center gap-1 font-bold text-stone-800">
        <span>🌡️</span>
        <span>{f.tempMinC}°C – {f.tempMaxC}°C</span>
      </div>
      <div className={`flex items-center gap-1 font-bold px-2 py-0.5 rounded-md border ${
        isWet ? 'bg-sky-100 text-sky-900 border-sky-300' : 'bg-emerald-50 text-emerald-900 border-emerald-200'
      }`}>
        <span>🌧️</span>
        <span>{f.rainProbabilityPct}% Rain Risk</span>
      </div>
      <div className={`flex items-center gap-1 font-bold px-2 py-0.5 rounded-md border ${
        isWindy ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-stone-100 text-stone-700 border-stone-200'
      }`}>
        <span>💨</span>
        <span>{f.windSpeedKmh} km/h Wind</span>
      </div>
    </div>
  );
}

function WeatherFactoredBadge(): React.JSX.Element {
  return (
    <span className="text-xs font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-3 py-1.5 rounded-xl shadow-2xs">
      ✓ Weather Factored into PERT Graph &amp; Budget Reserve
    </span>
  );
}

function FactorWeatherButton({ onClick }: { readonly onClick: () => void }): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-sky-700 to-indigo-800 text-white hover:from-sky-800 hover:to-indigo-900 shadow-xs hover:-translate-y-0.5 transition-all"
    >
      ⛈️ Factor Weather Forecast into Plan
    </button>
  );
}

interface WeatherTopProps {
  readonly city: string;
  readonly eventDate: string;
  readonly condition: string;
  readonly isFactored: boolean;
  readonly onFactor: () => void;
}

function WeatherBarTop(p: WeatherTopProps): React.JSX.Element {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="text-base">🌤️</span>
        <div>
          <h4 className="text-xs font-black text-stone-900 tracking-tight flex items-center gap-1.5">
            <span>Event-Day Weather Intelligence: {p.city}</span>
            <span className="text-[10px] font-bold text-sky-800 bg-sky-100 px-1.5 py-0.2 rounded border border-sky-300">
              {p.eventDate}
            </span>
          </h4>
          <p className="text-[11px] text-stone-600 font-medium">{p.condition}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {p.isFactored ? <WeatherFactoredBadge /> : <FactorWeatherButton onClick={p.onFactor} />}
      </div>
    </div>
  );
}

function WeatherBarBottom({ f }: { readonly f: WeatherForecast }): React.JSX.Element {
  return (
    <div className="pt-1.5 border-t border-sky-200/60 flex flex-col md:flex-row md:items-center justify-between gap-2">
      <WeatherMetrics f={f} />
      <p className="text-[11px] text-stone-600 italic max-w-xl">
        💡 <span className="font-semibold text-stone-700">Advisory:</span> {f.advisory}
      </p>
    </div>
  );
}

function useWeatherForecast(city: string, eventDate: string) {
  const [forecast, setForecast] = useState<WeatherForecast>(() => getSeasonalClimatology(city, eventDate));
  const [isFactored, setIsFactored] = useState(false);

  useEffect(() => {
    let active = true;
    setIsFactored(false);
    setForecast(getSeasonalClimatology(city, eventDate));
    fetchWeatherForecast(city, eventDate).then((f) => {
      if (active) setForecast(f);
    });
    return () => {
      active = false;
    };
  }, [city, eventDate]);

  return { forecast, isFactored, setIsFactored };
}

/**
 * Compact, high-visibility event-day weather forecast banner providing live or seasonal
 * climatology and one-click DAG buffer expansion and outdoor tenting reserves.
 */
export function WeatherForecastBar({
  city,
  eventDate,
  onFactorWeather,
}: WeatherForecastBarProps): React.JSX.Element {
  const { forecast, isFactored, setIsFactored } = useWeatherForecast(city, eventDate);

  const handleFactor = () => {
    onFactorWeather(forecast);
    setIsFactored(true);
  };

  return (
    <div
      role="region"
      aria-label="Event Day Weather Forecast"
      className="p-3.5 bg-gradient-to-r from-sky-50 via-indigo-50/50 to-amber-50/40 rounded-2xl border border-sky-200/80 shadow-2xs space-y-2"
    >
      <WeatherBarTop
        city={city}
        eventDate={eventDate}
        condition={forecast.condition}
        isFactored={isFactored}
        onFactor={handleFactor}
      />
      <WeatherBarBottom f={forecast} />
    </div>
  );
}
