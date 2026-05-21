/**
 * Stage — the central workspace where the spotlit goal sits.
 *
 * Phase 2: renders the stage as an elliptical platform (foreshortened
 * by the three-quarter perspective) with a soft spotlight at its
 * center tinted by the dominant drive color. No actor or chorus yet —
 * those come in Phase 3 when we start encoding live state.
 */

import { COLOR } from '../../design/tokens';
import { createSpotlightGradient } from '../color';
import { stageEllipse, type CanvasSize } from '../geometry';

export function renderStage(
  ctx: CanvasRenderingContext2D,
  size: CanvasSize,
): void {
  const stage = stageEllipse(size);

  // Phase 2: spotlight uses a neutral pale luminous color so it doesn't
  // visually merge with whichever pantheon glyph happens to share its
  // hue. Phase 3 swaps in the dominant drive's tint, at which point the
  // visual "merging" with that drive's glyph becomes meaningful (it
  // shows the drive's influence flowing into the workspace).
  const spotlightColor = COLOR.formBase;

  // Spotlight radius extends 60% beyond the stage's X radius so the
  // glow blends generously with the surrounding indigo.
  const spotlightRadius = stage.rx * 1.6;

  // Save context state so the radial gradient draw doesn't leak.
  ctx.save();

  // Build and draw the radial gradient as a soft circular bloom.
  // (We don't clip to the elliptical stage shape in Phase 2 — the
  // spotlight extends naturally beyond the stage's footprint.)
  ctx.fillStyle = createSpotlightGradient(
    ctx,
    stage.x,
    stage.y,
    spotlightRadius,
    spotlightColor,
  );
  ctx.beginPath();
  ctx.arc(stage.x, stage.y, spotlightRadius, 0, Math.PI * 2);
  ctx.fill();

  // Subtle stage "platform" ring — a thin elliptical outline at the
  // stage's nominal radius, very faint, so the spatial anchor is
  // perceptible without becoming a hard edge.
  ctx.strokeStyle = `rgba(255, 255, 255, 0.06)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(stage.x, stage.y, stage.rx, stage.ry, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
  void COLOR.formBase; // reserved for actor rendering in Phase 3
}
