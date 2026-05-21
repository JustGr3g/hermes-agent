/**
 * Renderer — orchestrates the five element draws in correct z-order.
 *
 * Composition order (back to front):
 *   1. Clear with background indigo
 *   2. Atmosphere (top fade)
 *   3. Substrate (bottom fade)
 *   4. Audience warmth (bottom bloom, behind stage)
 *   5. Pantheon (cardinal glyphs around the stage)
 *   6. Stage (spotlit center)
 *
 * Phase 2 is a single static draw — no animation loop. Phase 4 will
 * wrap this in a requestAnimationFrame loop with breath/pulse timing.
 */

import { COLOR } from '../design/tokens';
import { oklchToRgb } from './color';
import { renderAtmosphere } from './elements/Atmosphere';
import { renderAudienceDirection } from './elements/AudienceDirection';
import { renderPantheon } from './elements/Pantheon';
import { renderStage } from './elements/Stage';
import { renderSubstrate } from './elements/Substrate';
import type { CanvasSize } from './geometry';

export function renderForum(
  ctx: CanvasRenderingContext2D,
  size: CanvasSize,
): void {
  // 1. Clear with deep indigo background
  ctx.fillStyle = oklchToRgb(COLOR.background, 1);
  ctx.fillRect(0, 0, size.width, size.height);

  // 2. Atmosphere — top vertical gradient
  renderAtmosphere(ctx, size);

  // 3. Substrate — bottom vertical gradient (memory floor)
  renderSubstrate(ctx, size);

  // 4. Audience warmth — front-edge bloom (TOM presence)
  renderAudienceDirection(ctx, size);

  // 5. Pantheon glyphs — around the stage
  renderPantheon(ctx, size);

  // 6. Stage spotlight — central focus
  renderStage(ctx, size);
}
