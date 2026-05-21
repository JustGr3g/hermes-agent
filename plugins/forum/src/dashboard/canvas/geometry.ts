/**
 * Geometry — three-quarter perspective layout math.
 *
 * The Forum is rendered as if viewed from above-and-slightly-forward:
 *   - Atmosphere is the distant background (top of canvas)
 *   - Pantheon glyphs sit at cardinal positions around the stage on a
 *     flattened ring (Y-axis foreshortened to suggest viewing angle)
 *   - Stage is the central platform (an ellipse, not a circle)
 *   - Substrate is the floor in the foreground (bottom of canvas)
 *   - Audience direction is the front edge (bottom)
 *
 * All positions are computed from a single CanvasSize so the
 * composition reflows cleanly on resize.
 */

import { LAYOUT, PANTHEON_POSITIONS, type DriveId } from '../design/tokens';

export type CanvasSize = { width: number; height: number; dpr: number };

export type Point = { x: number; y: number };
export type Ellipse = Point & { rx: number; ry: number };

/**
 * Apply device pixel ratio to a logical size so the canvas backing store
 * matches the physical display. Returns the multiplier used.
 */
export function configureCanvasForDpr(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  size: CanvasSize,
): void {
  canvas.width = Math.floor(size.width * size.dpr);
  canvas.height = Math.floor(size.height * size.dpr);
  canvas.style.width = `${size.width}px`;
  canvas.style.height = `${size.height}px`;
  ctx.setTransform(1, 0, 0, 1, 0, 0); // reset before applying DPR
  ctx.scale(size.dpr, size.dpr);
}

/**
 * Stage geometry — central elliptical platform. X and Y radii are
 * scaled independently so the perspective foreshortening emerges from
 * the canvas's natural aspect ratio (wider canvas → wider stage).
 */
export function stageEllipse(size: CanvasSize): Ellipse {
  return {
    x: size.width / 2,
    y: size.height * LAYOUT.stage.centerYRatio,
    rx: size.width * LAYOUT.stage.radiusXRatio,
    ry: size.height * LAYOUT.stage.radiusYRatio,
  };
}

/**
 * Pantheon glyph positions — four cardinal points on a flattened ring
 * around (but outside) the stage. X scaled to width, Y scaled to
 * height so the composition adapts to any aspect ratio without
 * shrinking to a small cluster.
 */
export function pantheonPositions(size: CanvasSize): Record<DriveId, Point> {
  const ringCx = size.width / 2;
  const ringCy = size.height * LAYOUT.pantheon.centerYRatio;
  const rx = size.width * LAYOUT.pantheon.ringRadiusXRatio;
  const ry = size.height * LAYOUT.pantheon.ringRadiusYRatio;

  const out: Record<string, Point> = {};
  for (const driveId of Object.keys(PANTHEON_POSITIONS) as DriveId[]) {
    const { nx, ny } = PANTHEON_POSITIONS[driveId];
    // Map normalized [0..1] coords to the ring's bounding box.
    // (nx, ny) at (0.5, 0.5) sits at the ring center; (0, 0) is upper-left.
    out[driveId] = {
      x: ringCx + (nx - 0.5) * rx * 2,
      y: ringCy + (ny - 0.5) * ry * 2,
    };
  }
  return out as Record<DriveId, Point>;
}

/**
 * The glyph's bounding radius in pixels. Uses the smaller of width or
 * height so glyphs don't scale unboundedly on extreme aspect ratios.
 */
export function pantheonGlyphRadius(size: CanvasSize): number {
  return Math.min(size.width, size.height) * LAYOUT.pantheon.glyphRadiusRatio;
}

/**
 * Atmosphere band — vertical strip across the top of the canvas. Used
 * as the clip region for atmospheric weather tints.
 */
export function atmosphereBand(size: CanvasSize): { x: number; y: number; w: number; h: number } {
  return {
    x: 0,
    y: size.height * LAYOUT.atmosphere.topYRatio,
    w: size.width,
    h: size.height * (LAYOUT.atmosphere.bottomYRatio - LAYOUT.atmosphere.topYRatio),
  };
}

/**
 * Substrate band — vertical strip across the bottom of the canvas.
 */
export function substrateBand(size: CanvasSize): { x: number; y: number; w: number; h: number } {
  return {
    x: 0,
    y: size.height * LAYOUT.substrate.topYRatio,
    w: size.width,
    h: size.height * (LAYOUT.substrate.bottomYRatio - LAYOUT.substrate.topYRatio),
  };
}

/**
 * Audience direction — bottom-front warmth representing TOM presence.
 * Returns an elliptical glow region (wider than tall) anchored at the
 * bottom-center of the canvas.
 */
export function audienceFocus(size: CanvasSize): {
  center: Point;
  radiusX: number;
  radiusY: number;
} {
  return {
    center: { x: size.width / 2, y: size.height * LAYOUT.audience.centerYRatio },
    radiusX: size.width * LAYOUT.audience.glowRadiusXRatio,
    radiusY: size.height * LAYOUT.audience.glowRadiusYRatio,
  };
}
