import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { WeatherForecastBar } from './WeatherForecastBar';

describe('WeatherForecastBar Component', () => {
  it('renders weather metrics, advisory, and city badge', () => {
    render(
      <WeatherForecastBar
        city="Chandigarh"
        eventDate="2026-12-14"
        onFactorWeather={vi.fn()}
      />,
    );

    expect(screen.getByText(/Event-Day Weather Intelligence: Chandigarh/i)).toBeInTheDocument();
    expect(screen.getByText('2026-12-14')).toBeInTheDocument();
    expect(screen.getByText(/Rain Risk/i)).toBeInTheDocument();
    expect(screen.getByText(/Wind/i)).toBeInTheDocument();
    expect(screen.getByText(/Advisory:/i)).toBeInTheDocument();
  });

  it('triggers onFactorWeather when factor button is clicked and shows confirmed badge', () => {
    const handleFactor = vi.fn();
    render(
      <WeatherForecastBar
        city="Goa"
        eventDate="2026-07-20"
        onFactorWeather={handleFactor}
      />,
    );

    const btn = screen.getByRole('button', { name: /Factor Weather Forecast into Plan/i });
    fireEvent.click(btn);

    expect(handleFactor).toHaveBeenCalled();
    const forecastArg = handleFactor.mock.calls[0][0];
    expect(forecastArg.city).toBe('Goa');
    expect(screen.getByText(/Weather Factored into PERT Graph & Budget Reserve/i)).toBeInTheDocument();
  });

  it('passes automated accessibility audit with zero violations', async () => {
    const { container } = render(
      <WeatherForecastBar
        city="Udaipur"
        eventDate="2026-12-14"
        onFactorWeather={vi.fn()}
      />,
    );

    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
