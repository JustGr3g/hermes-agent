/**
 * ForumCanvas — React wrapper around the Canvas 2D renderer.
 *
 * Owns the canvas DOM node + a ResizeObserver. On any size change,
 * re-configures the backing store for the current devicePixelRatio
 * and re-renders. Phase 2 renders ONCE per size change (static). Phase
 * 4 will introduce the RAF loop driven by motion tokens.
 */

import { React, useEffect, useRef } from '../sdk';
import { configureCanvasForDpr, type CanvasSize } from './geometry';
import { renderForum } from './renderer';

export type ForumCanvasProps = {
  className?: string;
};

export function ForumCanvas({ className }: ForumCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      // eslint-disable-next-line no-console
      console.error('forum: 2D context unavailable');
      return;
    }

    function draw() {
      if (!canvas || !ctx || !wrapper) return;
      const rect = wrapper.getBoundingClientRect();
      const size: CanvasSize = {
        width: Math.max(1, rect.width),
        height: Math.max(1, rect.height),
        dpr: window.devicePixelRatio || 1,
      };
      configureCanvasForDpr(canvas, ctx, size);
      renderForum(ctx, size);
    }

    // Initial draw
    draw();

    // Redraw on container resize
    const ro = new ResizeObserver(() => draw());
    ro.observe(wrapper);

    // Redraw on devicePixelRatio change (monitor swap, zoom)
    const dprMq = window.matchMedia(
      `(resolution: ${window.devicePixelRatio}dppx)`,
    );
    const onDprChange = () => draw();
    dprMq.addEventListener?.('change', onDprChange);

    return () => {
      ro.disconnect();
      dprMq.removeEventListener?.('change', onDprChange);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  );
}

void React; // ensure JSX runtime is reachable
