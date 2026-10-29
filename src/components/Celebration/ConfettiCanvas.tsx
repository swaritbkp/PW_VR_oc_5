'use client';

import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { useMediaQuery } from '../Navigation/useMediaQuery';

const PARTICLE_COUNT = 60;
const COLORS = ['#f59e0b', '#dc2626', '#9a3412', '#7c3aed', '#059669'];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  readonly color: string;
  life: number;
}

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function burstParticles(cx: number, cy: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = randomRange(0, 2 * Math.PI);
    const speed = randomRange(2, 8);
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      life: 1,
    });
  }
  return particles;
}

function fireConfetti(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  setParticles: (value: Particle[]) => void,
): void {
  const canvas = canvasRef.current;
  if (!canvas) {
    return;
  }
  const rect = canvas.getBoundingClientRect();
  setParticles(burstParticles(rect.width / 2, rect.height / 2));
}

function runAnimation(
  canvas: HTMLCanvasElement,
  particles: Particle[],
  setParticles: (value: Particle[]) => void,
): () => void {
  if (particles.length === 0) {
    return () => {};
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return () => {};
  }
  let animationId = 0;
  const tick = (): void => {
    let alive = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const next: Particle[] = [];
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.life -= 0.025;
      if (p.life > 0) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
        next.push(p);
        alive = true;
      }
    }
    setParticles(next);
    if (alive) {
      animationId = requestAnimationFrame(tick);
    }
  };
  animationId = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(animationId);
}

/**
 * Lightweight, dependency-free canvas celebration effect.
 * Emits a confetti burst when triggered, respects prefers-reduced-motion,
 * and exposes an imperative trigger for interactive celebratory moments.
 *
 * @param trigger - When true, fires a new confetti burst
 * @param className - Optional extra classes for the canvas wrapper
 */
export function ConfettiCanvas({
  trigger,
  className,
}: {
  readonly trigger?: number;
  readonly className?: string;
}): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const handleTrigger = useCallback(() => fireConfetti(canvasRef, setParticles), [setParticles]);

  useEffect(() => {
    if (trigger) {
      void handleTrigger();
    }
  }, [trigger, handleTrigger]);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    return runAnimation(canvas, particles, setParticles);
  }, [particles, reducedMotion]);

  return (
    <div className={`relative overflow-hidden ${className ?? ''}`} aria-label="Celebratory confetti effect" role="img">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
