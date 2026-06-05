/**
 * theme — ready-to-use CSS color strings for the instrument's DOM and
 * Canvas, derived from the OKLCH tokens via culori.
 *
 * The instrument is a legible, dark, refined surface. Colors are used
 * to TYPE events (each event kind has a hue) and to keep the whole
 * thing calm and readable.
 */

import { converter } from 'culori';
import { COLOR, type OklchColor } from './tokens';

const toRgb = converter('rgb');

function css(c: OklchColor, alpha = 1): string {
  const rgb = toRgb({ mode: 'oklch', l: c.l, c: c.c, h: c.h });
  if (!rgb) return alpha >= 1 ? '#000' : 'rgba(0,0,0,0)';
  const R = Math.round(Math.max(0, Math.min(1, rgb.r)) * 255);
  const G = Math.round(Math.max(0, Math.min(1, rgb.g)) * 255);
  const B = Math.round(Math.max(0, Math.min(1, rgb.b)) * 255);
  return alpha >= 1 ? `rgb(${R}, ${G}, ${B})` : `rgba(${R}, ${G}, ${B}, ${alpha})`;
}

export const theme = {
  // Surfaces
  bg: css(COLOR.background),
  bgRaised: css({ l: 0.13, c: 0.022, h: 260 }),
  bgInset: css({ l: 0.06, c: 0.02, h: 260 }),
  border: css({ l: 0.26, c: 0.02, h: 260 }, 0.6),
  borderFaint: css({ l: 0.26, c: 0.02, h: 260 }, 0.28),

  // Text
  text: css(COLOR.typography),
  textDim: css(COLOR.typography, 0.55),
  textFaint: css(COLOR.typography, 0.32),

  // The luminous accent (cardiogram trace, alive pulse)
  pulse: css(COLOR.formBase),
  pulseGlow: css(COLOR.formBase, 0.4),

  // Event-kind hues — each event type reads as a color at a glance
  kind: {
    tool: css(COLOR.drive.projectHealth),       // warm amber
    episode: css(COLOR.drive.curiosity),        // cool blue
    goal: css(COLOR.drive.connection),          // sage
    signal: css(COLOR.drive.anticipation),      // violet
    maintenance: css(COLOR.typography, 0.4),    // dim — background upkeep
  },

  // Status tones
  ok: css({ l: 0.74, c: 0.10, h: 150 }),         // success green
  warn: css({ l: 0.70, c: 0.13, h: 60 }),        // caution amber
  fail: css({ l: 0.62, c: 0.16, h: 25 }),        // failure red-orange

  // Drive hues (for any drive-specific UI later)
  drive: {
    curiosity: css(COLOR.drive.curiosity),
    projectHealth: css(COLOR.drive.projectHealth),
    connection: css(COLOR.drive.connection),
    anticipation: css(COLOR.drive.anticipation),
  },
} as const;

export type EventKind = keyof typeof theme.kind;
