import type { PlanState } from '../plan/propagate';
import type { PlanTask } from '../plan/types';
import type { BudgetLine } from '../budget/engine';
import { sanitizeTaskDependencies } from '../concierge/nuanceActions';

export interface WeatherForecast {
  readonly city: string;
  readonly date: string;
  readonly tempMaxC: number;
  readonly tempMinC: number;
  readonly rainProbabilityPct: number;
  readonly windSpeedKmh: number;
  readonly condition: string;
  readonly advisory: string;
  readonly isLive: boolean;
}

interface ClimatologyData {
  readonly tempMaxC: number;
  readonly tempMinC: number;
  readonly rainProbabilityPct: number;
  readonly windSpeedKmh: number;
  readonly condition: string;
  readonly advisory: string;
}

const SEASONAL_CLIMATOLOGY: readonly ClimatologyData[] = [
  { tempMaxC: 21, tempMinC: 8, rainProbabilityPct: 8, windSpeedKmh: 12, condition: 'Chilly & Clear Winter Skies', advisory: 'Outdoor bonfires & shamiana heating recommended. Ideal for fireworks & night sangeet.' },
  { tempMaxC: 23, tempMinC: 10, rainProbabilityPct: 8, windSpeedKmh: 12, condition: 'Chilly & Clear Winter Skies', advisory: 'Outdoor bonfires & shamiana heating recommended. Ideal for fireworks & night sangeet.' },
  { tempMaxC: 30, tempMinC: 16, rainProbabilityPct: 10, windSpeedKmh: 14, condition: 'Warm & Dry Spring Weather', advisory: 'Mild pleasant evenings. Excellent conditions for outdoor lawn celebrations.' },
  { tempMaxC: 36, tempMinC: 21, rainProbabilityPct: 12, windSpeedKmh: 16, condition: 'Warm & Dry Summer Evening', advisory: 'Air-cooled German hanger marquee advised for afternoon ceremonies. Excellent fireworks visibility.' },
  { tempMaxC: 40, tempMinC: 26, rainProbabilityPct: 15, windSpeedKmh: 18, condition: 'Peak Summer Weather', advisory: 'Air-conditioned shamiana mandatory for daytime. Evening fireworks clear.' },
  { tempMaxC: 38, tempMinC: 27, rainProbabilityPct: 35, windSpeedKmh: 20, condition: 'Early Monsoon Transitions', advisory: 'Waterproof German hanger marquee recommended.' },
  { tempMaxC: 31, tempMinC: 25, rainProbabilityPct: 70, windSpeedKmh: 24, condition: 'High Monsoon Precipitation Risk', advisory: 'Waterproof German hanger marquee mandatory. High wind/rain risk: cold pyro permitted under cover.' },
  { tempMaxC: 30, tempMinC: 24, rainProbabilityPct: 72, windSpeedKmh: 22, condition: 'High Monsoon Precipitation Risk', advisory: 'Waterproof German hanger marquee mandatory. High wind/rain risk: cold pyro permitted under cover.' },
  { tempMaxC: 32, tempMinC: 23, rainProbabilityPct: 45, windSpeedKmh: 18, condition: 'Monsoon Retreating', advisory: 'Waterproof shamiana advised with indoor contingency for aerial fireworks.' },
  { tempMaxC: 31, tempMinC: 18, rainProbabilityPct: 6, windSpeedKmh: 9, condition: 'Crisp Autumn Skies (Ideal Celebration Weather)', advisory: 'Optimal conditions for open-air lawn events, drone shows, and aerial fireworks.' },
  { tempMaxC: 27, tempMinC: 12, rainProbabilityPct: 5, windSpeedKmh: 8, condition: 'Crisp Autumn Skies (Ideal Celebration Weather)', advisory: 'Optimal conditions for open-air lawn events, drone shows, and aerial fireworks.' },
  { tempMaxC: 21, tempMinC: 8, rainProbabilityPct: 6, windSpeedKmh: 10, condition: 'Chilly & Clear Winter Skies', advisory: 'Outdoor bonfires & shamiana heating recommended. Ideal for fireworks & night sangeet.' },
];

const CITY_COORDINATES: Readonly<Record<string, { readonly lat: number; readonly lon: number }>> = {
  amritsar: { lat: 31.634, lon: 74.8723 },
  chandigarh: { lat: 30.7333, lon: 76.7794 },
  udaipur: { lat: 24.5854, lon: 73.7125 },
  jaipur: { lat: 26.9124, lon: 75.7873 },
  delhi: { lat: 28.6139, lon: 77.209 },
  goa: { lat: 15.2993, lon: 74.124 },
  mumbai: { lat: 19.076, lon: 72.8777 },
  shimla: { lat: 31.1048, lon: 77.1734 },
};

/**
 * Deterministic seasonal climatology fallback ensuring offline resilience and test reliability.
 */
export function getSeasonalClimatology(city: string, dateStr: string): WeatherForecast {
  const monthIdx = Math.max(0, Math.min(11, (parseInt(dateStr.slice(5, 7), 10) || 12) - 1));
  const data = SEASONAL_CLIMATOLOGY[monthIdx];
  return { city, date: dateStr, isLive: false, ...data };
}

interface OpenMeteoDaily {
  readonly time?: readonly string[];
  readonly temperature_2m_max?: readonly number[];
  readonly temperature_2m_min?: readonly number[];
  readonly precipitation_probability_max?: readonly number[];
  readonly wind_speed_10m_max?: readonly number[];
}

function getConditionAndAdvisory(isRainRisk: boolean) {
  if (isRainRisk) {
    return {
      condition: 'Live Forecast: High Rain Risk',
      advisory: 'Waterproof German hanger & indoor fireworks plan recommended due to forecasted precipitation.',
    };
  }
  return {
    condition: 'Live Forecast: Favorable Conditions',
    advisory: 'Live Open-Meteo reading: Clear weather window suitable for outdoor lawn ceremonies & aerial pyro.',
  };
}

function parseOpenMeteoData(daily: OpenMeteoDaily | undefined, eventDate: string, city: string): WeatherForecast | null {
  if (!daily?.time) return null;
  const idx = daily.time.indexOf(eventDate);
  if (idx < 0) return null;

  const rainPct = Math.round(daily.precipitation_probability_max?.[idx] ?? 10);
  const info = getConditionAndAdvisory(rainPct > 40);
  const max = daily.temperature_2m_max?.[idx];
  const min = daily.temperature_2m_min?.[idx];
  const wind = daily.wind_speed_10m_max?.[idx];

  return {
    city, date: eventDate,
    tempMaxC: Math.round(max !== undefined ? max : 25),
    tempMinC: Math.round(min !== undefined ? min : 15),
    rainProbabilityPct: rainPct,
    windSpeedKmh: Math.round(wind !== undefined ? wind : 12),
    condition: info.condition,
    advisory: info.advisory,
    isLive: true,
  };
}

/**
 * Fetches live weather forecast from Open-Meteo API with automatic fallback to deterministic climatology.
 */
export async function fetchWeatherForecast(city: string, eventDate: string): Promise<WeatherForecast> {
  const normCity = city.trim().toLowerCase();
  const coords = CITY_COORDINATES[normCity] ?? { lat: 30.7333, lon: 76.7794 };

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=Asia%2FKolkata`;
    const res = await fetch(url, { signal: AbortSignal.timeout(1800) });
    if (!res.ok) return getSeasonalClimatology(city, eventDate);

    const data: { readonly daily?: OpenMeteoDaily } = await res.json();
    const parsed = parseOpenMeteoData(data.daily, eventDate, city);
    return parsed ?? getSeasonalClimatology(city, eventDate);
  } catch {
    return getSeasonalClimatology(city, eventDate);
  }
}

function adjustWeatherTasks(tasks: readonly PlanTask[], forecast: WeatherForecast): readonly PlanTask[] {
  const isWetOrWindy = forecast.rainProbabilityPct > 20 || forecast.windSpeedKmh > 20;

  const adjusted = tasks.map((t) => {
    const isOutdoor = t.category === 'decor' || t.name.toLowerCase().includes('fireworks') || t.name.toLowerCase().includes('shamiana');
    if (isOutdoor && isWetOrWindy) {
      return { ...t, pessimistic: t.pessimistic + 2, why: `${t.why} (adjusted +2d for ${forecast.rainProbabilityPct}% rain forecast)` };
    }
    return t;
  });

  if (adjusted.some((t) => t.id === 'task_weather_proofing')) return adjusted;

  const rootId = adjusted[0]?.id ?? 'W01';
  const weatherTask: PlanTask = {
    id: 'task_weather_proofing',
    name: 'Weather Proofing: Waterproof German Hanger & Heaters',
    category: 'venue',
    optimistic: 3,
    mostLikely: 6,
    pessimistic: 10,
    dependsOn: [rootId],
    drivers: ['date'],
    why: `Factored from weather forecast: ${forecast.condition} (${forecast.rainProbabilityPct}% rain, ${forecast.windSpeedKmh} km/h wind)`,
    optional: false,
  };

  return [...adjusted, sanitizeTaskDependencies(adjusted, weatherTask)];
}

function adjustWeatherBudgetLines(lines: readonly BudgetLine[], city: string): readonly BudgetLine[] {
  if (lines.some((l) => l.id === 'b_weather_reserve')) return lines;

  const weatherLine: BudgetLine = {
    id: 'b_weather_reserve',
    category: 'venue',
    name: 'Weather Proofing & Shamiana Reserve',
    unit: 'fixed',
    rateInr: 150000,
    quantity: 1,
    locked: true,
    drivers: ['budget'],
    notes: `Waterproof German hanger marquee & climate conditioning factored for ${city}`,
  };

  return [...lines, weatherLine];
}

/**
 * Pure function that injects weather-proofing tasks, adjusts PERT pessimistic buffers,
 * and adds a weather reserve line to the budget.
 */
export function factorWeatherIntoPlan(plan: PlanState, forecast: WeatherForecast): PlanState {
  const tasks = adjustWeatherTasks(plan.tasks, forecast);
  const budgetLines = adjustWeatherBudgetLines(plan.budgetLines, forecast.city);

  return {
    ...plan,
    tasks: [...tasks],
    budgetLines: [...budgetLines],
  };
}
