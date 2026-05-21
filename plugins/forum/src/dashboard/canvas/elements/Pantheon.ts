/**
 * Pantheon — the four drive glyphs at cardinal positions.
 *
 * Phase 2: each drive renders as a soft glowing orb in its OKLCH
 * color, positioned on the foreshortened ring around the stage. All
 * four glow at equal moderate brightness (no live drive-weight
 * encoding yet).
 *
 * Phase 3 will couple brightness to drive_states.need. Phase 5 will
 * swap orbs for hand-authored biomorphic SVG paths.
 */

import { COLOR, DRIVE_IDS, type DriveId } from '../../design/tokens';
import { createSoftBloomGradient } from '../color';
import {
  pantheonGlyphRadius,
  pantheonPositions,
  type CanvasSize,
} from '../geometry';

export function renderPantheon(
  ctx: CanvasRenderingContext2D,
  size: CanvasSize,
): void {
  const positions = pantheonPositions(size);
  const glyphRadius = pantheonGlyphRadius(size);
  // Bloom extends ~3× the nominal glyph radius for the soft halo.
  const bloomRadius = glyphRadius * 3.0;

  for (const driveId of DRIVE_IDS) {
    const pos = positions[driveId];
    const driveColor = COLOR.drive[driveId];

    ctx.save();
    ctx.fillStyle = createSoftBloomGradient(
      ctx,
      pos.x,
      pos.y,
      bloomRadius,
      driveColor,
      0.65, // peak alpha — moderate, equal across all four drives in Phase 2
    );
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, bloomRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  void glyphRadius; // glyph SVG paths will use this in Phase 5
}

export type { DriveId };
