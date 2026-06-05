/**
 * Cardiogram — the heartbeat trace. The hero element.
 *
 * A horizontal line, scrolling right-to-left, Canvas-drawn at display
 * refresh rate. A gentle baseline wander means the line is alive even
 * at rest; each Athena event produces a spike (height by event kind).
 *
 * One glance answers "is she alive, and how active": calm flat-ish
 * line = resting; frequent tall spikes = working hard.
 */

import { React, useEffect, useRef } from '../sdk';
import { theme } from '../design/theme';
import type { ForumEvent } from '../data/types';

const WINDOW_SEC = 38;            // how much time the trace spans
const SPIKE_HEIGHTS: Record<ForumEvent['kind'], number> = {
  goal: 1.0,
  signal: 0.72,
  tool: 0.55,
  episode: 0.42,
  maintenance: 0.26,
};

export type CardiogramProps = {
  events: ForumEvent[];
  serverTime: number | null;
};

export function Cardiogram({ events, serverTime }: CardiogramProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Latest props, readable inside the RAF loop.
  const eventsRef = useRef<ForumEvent[]>(events);
  eventsRef.current = events;
  const serverTimeRef = useRef<number | null>(serverTime);
  // Track when the latest serverTime was received so we can advance a
  // smooth local clock between 1.5s polls.
  const serverRecvRef = useRef<number>(performance.now());
  if (serverTimeRef.current !== serverTime) {
    serverTimeRef.current = serverTime;
    serverRecvRef.current = performance.now();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let cssW = 0;
    let cssH = 0;

    function resize() {
      if (!wrap || !canvas || !ctx) return;
      const rect = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      cssW = Math.max(1, rect.width);
      cssH = Math.max(1, rect.height);
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    // Estimated "now" in Athena-server time, advancing smoothly.
    function estimatedNow(): number {
      const st = serverTimeRef.current;
      if (st === null) return performance.now() / 1000;
      return st + (performance.now() - serverRecvRef.current) / 1000;
    }

    function baseline(t: number): number {
      // Gentle multi-frequency wander — the line breathes at rest.
      return (
        0.055 * Math.sin(t * 0.70) +
        0.035 * Math.sin(t * 1.73 + 1.0) +
        0.025 * Math.sin(t * 0.31 + 2.0)
      );
    }

    function eventContribution(t: number): number {
      // Sum spike contributions from every event near time t.
      let amp = 0;
      const evs = eventsRef.current;
      for (let i = 0; i < evs.length; i++) {
        const e = evs[i];
        const dt = t - e.ts;
        // Spike lives roughly dt ∈ [-0.4, 2.0]; skip far events.
        if (dt < -0.5 || dt > 2.4) continue;
        const h = SPIKE_HEIGHTS[e.kind];
        // Asymmetric: a narrow peak just after the event, short tail.
        const peak = Math.exp(-Math.pow((dt - 0.14) / 0.20, 2));
        const tail = dt > 0.34 ? 0.32 * Math.exp(-(dt - 0.34) * 2.6) : 0;
        amp += h * (peak + tail);
      }
      return amp;
    }

    function frame() {
      if (!ctx) return;
      ctx.clearRect(0, 0, cssW, cssH);

      const now = estimatedNow();
      const pxPerSec = cssW / WINDOW_SEC;
      const midY = cssH * 0.62;            // baseline sits a bit low
      const ampScale = cssH * 0.40;        // vertical scale for spikes

      // Build the trace polyline.
      const pts: [number, number][] = [];
      for (let x = 0; x <= cssW; x += 2) {
        const t = now - (cssW - x) / pxPerSec;
        const a = baseline(t) + eventContribution(t);
        // Spikes go UP (negative y). Clamp so bursts don't fly off.
        const y = midY - Math.min(a, 2.4) * ampScale;
        pts.push([x, y]);
      }

      // Glow pass — soft, low alpha. Kept modest so the line reads
      // crisp rather than fuzzy.
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.strokeStyle = theme.pulseGlow;
      ctx.lineWidth = 4.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();

      // Sharp pass — thin, bright, crisp.
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.strokeStyle = theme.pulse;
      ctx.lineWidth = 1.25;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();

      // "Now" dot at the right edge.
      const last = pts[pts.length - 1];
      if (last) {
        ctx.beginPath();
        ctx.arc(last[0], last[1], 3.4, 0, Math.PI * 2);
        ctx.fillStyle = theme.pulse;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(last[0], last[1], 8, 0, Math.PI * 2);
        ctx.fillStyle = theme.pulseGlow;
        ctx.fill();
      }

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}

void React;
