/**
 * AudienceDirection — front-of-stage warmth representing TOM presence.
 *
 * Phase 2: renders the default "available" warmth as a soft amber bloom
 * at the bottom-center of the canvas. Later phases will modulate the
 * color + intensity based on TOM state (available / interruptible /
 * focused / unavailable / quiet hours) and add the Greg-belief aura.
 */

import { COLOR } from '../../design/tokens';
import { oklchToRgb } from '../color';
import { audienceFocus, type CanvasSize } from '../geometry';

export function renderAudienceDirection(
  ctx: CanvasRenderingContext2D,
  size: CanvasSize,
): void {
  const { center, radiusX, radiusY } = audienceFocus(size);
  const tone = COLOR.audience.available;

  ctx.save();

  // Use the canvas transform to render an elliptical bloom (Canvas 2D
  // doesn't have native elliptical radial gradients). Scale to ry/rx
  // around the center, draw a circular gradient at radius rx, restore.
  ctx.translate(center.x, center.y);
  ctx.scale(1, radiusY / radiusX);

  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, radiusX);
  g.addColorStop(0.0, oklchToRgb(tone, 0.45));
  g.addColorStop(0.55, oklchToRgb(tone, 0.10));
  g.addColorStop(1.0, oklchToRgb(tone, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, radiusX, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
