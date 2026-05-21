/**
 * Substrate — the memory floor.
 *
 * Phase 2: renders the substrate as a near-uniform dark indigo band
 * with a very subtle vertical gradient from background-color at top to
 * slightly-warmer indigo at the bottom (suggesting the floor catches
 * faint light from the audience direction below).
 *
 * Phase 5 will add the continuous shimmer (Voronoi-like luminance
 * mottling), discrete warm episode-pulse blooms, and the procedural
 * grain texture that accumulates over time.
 */

import { COLOR } from '../../design/tokens';
import { oklchToRgb, shiftLightness } from '../color';
import { substrateBand, type CanvasSize } from '../geometry';

export function renderSubstrate(
  ctx: CanvasRenderingContext2D,
  size: CanvasSize,
): void {
  const band = substrateBand(size);

  // Two-stop vertical gradient: pure background at top of band, very
  // slightly lighter at the bottom. The result is a subtle hint of
  // depth without any visible features.
  const baseTop = COLOR.background;
  const baseBottom = shiftLightness(COLOR.background, +0.025);

  const g = ctx.createLinearGradient(0, band.y, 0, band.y + band.h);
  g.addColorStop(0, oklchToRgb(baseTop, 1));
  g.addColorStop(1, oklchToRgb(baseBottom, 1));
  ctx.fillStyle = g;
  ctx.fillRect(band.x, band.y, band.w, band.h);
}
