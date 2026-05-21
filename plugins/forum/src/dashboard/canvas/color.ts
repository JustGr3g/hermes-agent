/**
 * Color utilities — convert the OKLCH tokens from design/tokens.ts into
 * RGB strings Canvas 2D can render.
 *
 * culori handles OKLCH ↔ sRGB conversion with gamut mapping. The
 * resulting strings are valid Canvas fillStyle / strokeStyle values.
 *
 * Why OKLCH: when two drive colors mix (arbitration consultation,
 * spotlight oscillation), naive RGB interpolation produces muddy
 * mid-tones. OKLCH interpolation stays perceptually clean.
 */

import { converter, formatRgb, formatHex } from 'culori';
import type { OklchColor } from '../design/tokens';

const toRgb = converter('rgb');

/**
 * Convert an OKLCH triple to a CSS rgb() string with optional alpha.
 * Returns a string Canvas 2D can use directly as fillStyle.
 */
export function oklchToRgb(color: OklchColor, alpha = 1): string {
  const rgb = toRgb({ mode: 'oklch', l: color.l, c: color.c, h: color.h });
  if (!rgb) {
    // Should not happen for in-gamut colors; defensive default.
    return `rgba(0,0,0,${alpha})`;
  }
  const r = Math.round(Math.max(0, Math.min(1, rgb.r)) * 255);
  const g = Math.round(Math.max(0, Math.min(1, rgb.g)) * 255);
  const b = Math.round(Math.max(0, Math.min(1, rgb.b)) * 255);
  if (alpha >= 1) return `rgb(${r}, ${g}, ${b})`;
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
}

/**
 * Lighten or darken an OKLCH color by an amount in [-1, 1]. Useful for
 * deriving glow halos or pressed states without re-specifying every
 * gradient stop in design tokens.
 */
export function shiftLightness(color: OklchColor, delta: number): OklchColor {
  return { l: Math.max(0, Math.min(1, color.l + delta)), c: color.c, h: color.h };
}

/**
 * Adjust chroma (saturation in OKLCH terms). Negative deltas mute the
 * color toward gray; positive deltas saturate it.
 */
export function shiftChroma(color: OklchColor, delta: number): OklchColor {
  return { l: color.l, c: Math.max(0, color.c + delta), h: color.h };
}

/**
 * Hex form of an OKLCH color — useful for CSS context (background-color,
 * border-color in stylesheets) where rgb() works too but hex is shorter.
 */
export function oklchToHex(color: OklchColor): string {
  const hex = formatHex({ mode: 'oklch', l: color.l, c: color.c, h: color.h });
  return hex ?? '#000000';
}

/**
 * Build a Canvas 2D radial gradient with exponential alpha falloff,
 * matching the spotlight algorithm specified in the concept doc.
 *
 * Stops mirror the spec:
 *   0% → α 1.00
 *   18% → α 0.75
 *   40% → α 0.35
 *   65% → α 0.12
 *   85% → α 0.03
 *   100% → α 0.00
 *
 * The colour at every stop is the same OKLCH base — only alpha changes
 * so the hue stays consistent from core to edge (no white-collapse).
 */
export function createSpotlightGradient(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: OklchColor,
): CanvasGradient {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  g.addColorStop(0.00, oklchToRgb(color, 1.00));
  g.addColorStop(0.18, oklchToRgb(color, 0.75));
  g.addColorStop(0.40, oklchToRgb(color, 0.35));
  g.addColorStop(0.65, oklchToRgb(color, 0.12));
  g.addColorStop(0.85, oklchToRgb(color, 0.03));
  g.addColorStop(1.00, oklchToRgb(color, 0.00));
  return g;
}

/**
 * Build a soft radial bloom for substrate episode pulses and audience
 * warmth. Softer than the spotlight (more rapid falloff).
 */
export function createSoftBloomGradient(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: OklchColor,
  peakAlpha = 0.6,
): CanvasGradient {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  g.addColorStop(0.0, oklchToRgb(color, peakAlpha));
  g.addColorStop(0.5, oklchToRgb(color, peakAlpha * 0.25));
  g.addColorStop(1.0, oklchToRgb(color, 0));
  return g;
}
