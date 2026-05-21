/**
 * Atmosphere — the metacognitive weather layer.
 *
 * Phase 2: renders the default "clear" weather mode as a subtle vertical
 * gradient at the top of the canvas. Later phases will switch among
 * clear/clouded/stormy/twilight based on MetaSignal clusters.
 */

import { COLOR } from '../../design/tokens';
import { oklchToRgb } from '../color';
import { atmosphereBand, type CanvasSize } from '../geometry';

export function renderAtmosphere(
  ctx: CanvasRenderingContext2D,
  size: CanvasSize,
): void {
  const band = atmosphereBand(size);
  const tint = COLOR.atmosphere.clear;

  // Vertical gradient: tint at the very top, fading to fully
  // transparent at the bottom of the band so it blends with the
  // background indigo behind it.
  const g = ctx.createLinearGradient(0, band.y, 0, band.y + band.h);
  g.addColorStop(0, oklchToRgb(tint, 0.55));
  g.addColorStop(1, oklchToRgb(tint, 0));
  ctx.fillStyle = g;
  ctx.fillRect(band.x, band.y, band.w, band.h);
}
