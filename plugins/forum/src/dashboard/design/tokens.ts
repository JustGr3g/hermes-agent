/**
 * Design tokens — the single source of truth for color, motion, layout,
 * and timing values across the Forum renderer.
 *
 * All colors are specified in OKLCH for perceptual uniformity. Drives
 * stay at similar L (72-75%) and C (0.09-0.12) so the four hues read
 * as a family that differs only in temperature, never in luminosity.
 *
 * Sourced from the concept doc at
 * ~/.claude/plans/athena-sent-me-this-jolly-minsky.md
 */

// ── OKLCH color tokens ──────────────────────────────────────────────────────

export type OklchColor = { l: number; c: number; h: number };

export const COLOR = {
  // Foundation
  background: { l: 0.08, c: 0.025, h: 260 },          // deep dark indigo
  formBase: { l: 0.94, c: 0.015, h: 90 },             // pale luminous off-white
  typography: { l: 0.85, c: 0.015, h: 90 },           // slightly dimmer warm off-white

  // Four drive palette
  drive: {
    curiosity: { l: 0.72, c: 0.11, h: 240 },          // cool ultramarine
    projectHealth: { l: 0.75, c: 0.12, h: 70 },       // warm amber
    connection: { l: 0.74, c: 0.09, h: 155 },         // soft sage
    anticipation: { l: 0.71, c: 0.11, h: 320 },       // gentle violet
  },

  // Atmosphere weather mode tints (subtle washes over background)
  atmosphere: {
    clear: { l: 0.20, c: 0.020, h: 260 },
    clouded: { l: 0.25, c: 0.030, h: 250 },
    stormy: { l: 0.22, c: 0.040, h: 280 },
    twilight: { l: 0.30, c: 0.035, h: 30 },
  },

  // Audience direction (TOM warmth gradient — 5 states)
  audience: {
    available: { l: 0.75, c: 0.08, h: 60 },           // warm steady glow
    interruptible: { l: 0.60, c: 0.05, h: 60 },       // dimmer warm
    focused: { l: 0.45, c: 0.04, h: 220 },            // dim blue ("in flow elsewhere")
    unavailable: { l: 0.20, c: 0.02, h: 260 },        // very dim
    quiet: { l: 0.12, c: 0.02, h: 260 },              // near-absent
  },

  // NEEDS_REVIEW orbs — pale neutral warmth
  needsReviewOrb: { l: 0.78, c: 0.04, h: 80 },
} as const;

// ── Drive identity (used as keys across the renderer) ────────────────────────

export type DriveId = 'curiosity' | 'projectHealth' | 'connection' | 'anticipation';

export const DRIVE_IDS: readonly DriveId[] = [
  'curiosity',
  'projectHealth',
  'connection',
  'anticipation',
] as const;

// ── Cardinal positions for the pantheon (clockwise from top-left) ───────────
//
// In our three-quarter perspective:
//   Curiosity ─────────────── Anticipation
//                  ╲     ╱
//                   STAGE
//                  ╱     ╲
//   Connection ───────────── Project Health
//
// Position is normalized to [0..1] coords inside the pantheon's bounding
// box (which itself sits in the upper part of the canvas above the stage).

export const PANTHEON_POSITIONS: Record<DriveId, { nx: number; ny: number }> = {
  curiosity:     { nx: 0.18, ny: 0.45 },   // upper-left
  anticipation:  { nx: 0.82, ny: 0.45 },   // upper-right
  connection:    { nx: 0.18, ny: 0.85 },   // lower-left
  projectHealth: { nx: 0.82, ny: 0.85 },   // lower-right
};

// ── Layout ratios (relative to canvas size) ──────────────────────────────────
//
// Three-quarter perspective: imagine looking down at a table from above
// and slightly forward. Atmosphere is the distant background, substrate
// is the floor in the foreground.

// Layout uses separate X/Y scaling so the composition fills the canvas
// at any aspect ratio. Width-scaled values give horizontal presence;
// height-scaled values give the foreshortened vertical character.
// Previous version used min(w, h) for everything which made the
// composition feel small on wide aspect ratios.

export const LAYOUT = {
  // Stage occupies the central region. Slightly below center to leave
  // room for the atmosphere band above + the audience warmth below.
  stage: {
    centerYRatio: 0.54,            // 54% down — close to center but biased down
    radiusXRatio: 0.10,            // 10% of canvas WIDTH for spotlight extent
    radiusYRatio: 0.10,            // 10% of canvas HEIGHT (ellipse foreshortening
                                   //   emerges naturally from non-square canvas)
  },

  // Pantheon ring sits OUTSIDE the stage. Width-scaled X radius gives
  // horizontal spread; height-scaled Y radius keeps the foreshortened
  // perspective of looking down at a flattened ring.
  pantheon: {
    centerYRatio: 0.54,
    ringRadiusXRatio: 0.28,        // 28% of canvas WIDTH
    ringRadiusYRatio: 0.32,        // 32% of canvas HEIGHT (taller than wide
                                   //   per unit, but width is typically larger
                                   //   so the ring appears wider than tall)
    glyphRadiusRatio: 0.025,       // smaller per-glyph baseline; bloom extends ~3x
  },

  // Atmosphere fills the top portion of the canvas
  atmosphere: {
    topYRatio: 0.0,
    bottomYRatio: 0.32,
  },

  // Substrate fills the bottom portion
  substrate: {
    topYRatio: 0.68,
    bottomYRatio: 1.0,
  },

  // Audience warmth — bottom-edge glow representing TOM presence
  audience: {
    centerYRatio: 0.96,
    glowRadiusXRatio: 0.45,        // wide warmth across the bottom-front
    glowRadiusYRatio: 0.30,        // less tall (foreshortened)
  },
} as const;

// ── Motion (Phase 2 is static; these are reserved for Phase 4) ──────────────

export const MOTION = {
  breath: 'cubic-bezier(0.40, 0.00, 0.60, 1.00)',
  breathPeriodSec: 8.0,
  standard: 'cubic-bezier(0.40, 0.00, 0.20, 1.00)',
  standardDurationSec: 1.2,
  elegant: 'cubic-bezier(0.25, 0.10, 0.25, 1.00)',
  elegantDurationSec: 2.5,
} as const;
