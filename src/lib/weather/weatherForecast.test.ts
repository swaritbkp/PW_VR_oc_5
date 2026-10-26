import { describe, expect, it } from 'vitest';
import { getInitialPlan } from '../plan/initialPlan';
import {
  factorWeatherIntoPlan,
  fetchWeatherForecast,
  getSeasonalClimatology,
  type WeatherForecast,
} from './weatherForecast';

describe('Weather Forecast Engine & Plan Factoring', () => {
  it('returns valid seasonal climatology across winter, summer, monsoon and autumn', () => {
    const winter = getSeasonalClimatology('Chandigarh', '2026-12-14');
    expect(winter.tempMaxC).toBeLessThanOrEqual(25);
    expect(winter.rainProbabilityPct).toBeLessThan(15);
    expect(winter.condition).toContain('Winter');

    const monsoon = getSeasonalClimatology('Goa', '2026-07-20');
    expect(monsoon.rainProbabilityPct).toBeGreaterThan(60);
    expect(monsoon.advisory).toContain('Waterproof German hanger');

    const summer = getSeasonalClimatology('Jaipur', '2027-05-15');
    expect(summer.tempMaxC).toBeGreaterThanOrEqual(38);

    const autumn = getSeasonalClimatology('Amritsar', '2026-10-25');
    expect(autumn.rainProbabilityPct).toBeLessThan(10);
    expect(autumn.condition).toContain('Autumn');
  });

  it('fetchWeatherForecast returns valid forecast structure with fallback resilience', async () => {
    const forecast = await fetchWeatherForecast('Udaipur', '2026-12-14');
    expect(forecast.city).toBe('Udaipur');
    expect(forecast.tempMaxC).toBeGreaterThan(0);
    expect(forecast.tempMinC).toBeGreaterThan(0);
    expect(forecast.rainProbabilityPct).toBeGreaterThanOrEqual(0);
    expect(forecast.windSpeedKmh).toBeGreaterThan(0);
    expect(forecast.condition.length).toBeGreaterThan(0);
  });

  it('factorWeatherIntoPlan injects German Hanger task, expands pessimistic buffers, and adds budget reserve', () => {
    const plan = getInitialPlan();
    const wetForecast: WeatherForecast = {
      city: 'Chandigarh',
      date: '2026-12-14',
      tempMaxC: 22,
      tempMinC: 10,
      rainProbabilityPct: 65,
      windSpeedKmh: 24,
      condition: 'Monsoon Rain Risk',
      advisory: 'Waterproof hanger required',
      isLive: true,
    };

    const initialDecorPessimistic = plan.tasks.find((t) => t.category === 'decor')?.pessimistic ?? 0;
    const factoredPlan = factorWeatherIntoPlan(plan, wetForecast);

    // 1. Injected task node
    const weatherTask = factoredPlan.tasks.find((t) => t.id === 'task_weather_proofing');
    expect(weatherTask).toBeDefined();
    expect(weatherTask?.name).toContain('Waterproof German Hanger');
    expect(weatherTask?.dependsOn).toContain('W01');

    // 2. Pessimistic expansion for outdoor decor
    const factoredDecor = factoredPlan.tasks.find((t) => t.category === 'decor');
    if (factoredDecor && initialDecorPessimistic > 0) {
      expect(factoredDecor.pessimistic).toBe(initialDecorPessimistic + 2);
    }

    // 3. Added budget reserve
    const budgetReserve = factoredPlan.budgetLines.find((b) => b.id === 'b_weather_reserve');
    expect(budgetReserve).toBeDefined();
    expect(budgetReserve?.rateInr).toBe(150000);
    expect(budgetReserve?.name).toContain('Weather Proofing & Shamiana Reserve');
  });
});
