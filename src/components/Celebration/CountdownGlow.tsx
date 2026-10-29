'use client';

import { useEffect, useState } from 'react';

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const TICK_MS = 1000;

interface CountdownParts {
  readonly days: number;
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
  readonly expired: boolean;
}

function remaining(targetMs: number): CountdownParts {
  const diff = targetMs - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  return {
    days: Math.floor(diff / MS_PER_DAY),
    hours: Math.floor((diff % MS_PER_DAY) / MS_PER_HOUR),
    minutes: Math.floor((diff % MS_PER_HOUR) / MS_PER_MINUTE),
    seconds: Math.floor((diff % MS_PER_MINUTE) / MS_PER_SECOND),
    expired: false,
  };
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function useCountdown(targetMs: number): CountdownParts {
  const [parts, setParts] = useState<CountdownParts>(Number.isFinite(targetMs) ? remaining(targetMs) : { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });

  useEffect(() => {
    if (!Number.isFinite(targetMs) || parts.expired) {
      return;
    }
    const id = setInterval(() => {
      setParts((current) => {
        const next = remaining(targetMs);
        if (next.expired) {
          clearInterval(id);
        }
        return current.days === next.days &&
          current.hours === next.hours &&
          current.minutes === next.minutes &&
          current.seconds === next.seconds
          ? current
          : next;
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [targetMs, parts.expired]);

  return parts;
}

/**
 * Glowing event countdown that ticks down to a target date.
 * Respects prefers-reduced-motion and stops once the event arrives.
 *
 * @param targetDate - ISO date string to count down toward
 * @param label - Accessible label for the countdown
 */
export function CountdownGlow({
  targetDate,
  label = 'Time until celebration',
}: {
  readonly targetDate: string;
  readonly label?: string;
}): React.JSX.Element {
  const targetMs = Date.parse(targetDate);
  const parts = useCountdown(targetMs);

  if (parts.expired || !Number.isFinite(targetMs)) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 border border-amber-200" aria-label={label}>
        <span className="text-display text-amber-800 font-black">Celebration time!</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-lg bg-stone-900 px-3 py-1.5 text-stone-50 glow-countdown" aria-label={label}>
      <span className="text-display font-black text-stone-100">{parts.days}</span>
      <span className="text-xs font-semibold text-stone-300">d</span>
      <span className="text-display font-black text-stone-100">{pad(parts.hours)}</span>
      <span className="text-xs font-semibold text-stone-300">h</span>
      <span className="text-display font-black text-stone-100">{pad(parts.minutes)}</span>
      <span className="text-xs font-semibold text-stone-300">m</span>
      <span className="text-display font-black text-stone-100">{pad(parts.seconds)}</span>
      <span className="text-xs font-semibold text-stone-300">s</span>
    </div>
  );
}
