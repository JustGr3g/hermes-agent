/**
 * EventStream — the legible feed of Athena's activity.
 *
 * Newest event on top. Each row is typed (a colored accent bar by
 * kind), labeled, and timestamped. Detail text is built from colored
 * segments so tool success/failure and goal lifecycle read instantly.
 */

import { React } from '../sdk';
import { theme } from '../design/theme';
import type { ForumEvent } from '../data/types';

const MAX_ROWS = 44;

function ageLabel(ts: number, now: number): string {
  const s = Math.max(0, Math.floor(now - ts));
  if (s < 2) return 'now';
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}

type Segment = { text: string; color?: string; mono?: boolean };
type Described = { label: string; accent: string; segments: Segment[]; dim?: boolean };

const GOAL_STATUS_TONE: Record<string, string> = {
  completed: theme.ok,
  active: theme.text,
  suspended: theme.textDim,
  abandoned: theme.fail,
  needs_review: theme.warn,
};

/**
 * Stable per-event key. Index-based keys made every row remount (and
 * re-animate) whenever a new event prepended; a content-derived key
 * means only genuinely-new rows mount and play the entry animation.
 */
function eventKey(e: ForumEvent): string {
  const ts = e.ts.toFixed(3);
  switch (e.kind) {
    case 'tool': return `t:${ts}:${e.tool}`;
    case 'episode': return `e:${ts}:${e.text.slice(0, 28)}`;
    case 'goal': return `g:${ts}:${e.goal_id ?? e.text.slice(0, 20)}`;
    case 'signal': return `s:${ts}:${e.signal}`;
    case 'maintenance': return `m:${ts}:${e.handler}`;
  }
}

function describe(e: ForumEvent): Described {
  switch (e.kind) {
    case 'tool': {
      const lat = e.latency_ms != null ? `${(e.latency_ms / 1000).toFixed(1)}s` : '';
      const tone = e.success ? theme.ok : theme.fail;
      return {
        label: 'tool',
        accent: tone,
        segments: [
          { text: e.tool, mono: true },
          { text: e.success ? '✓' : '✗', color: tone },
          ...(lat ? [{ text: lat, color: theme.textDim, mono: true }] : []),
        ],
      };
    }
    case 'episode':
      return {
        label: 'memory',
        accent: theme.kind.episode,
        segments: [{ text: e.text || '(episode formed)' }],
      };
    case 'goal': {
      const tone = GOAL_STATUS_TONE[e.status] ?? theme.text;
      return {
        label: 'goal',
        accent: theme.kind.goal,
        segments: [
          { text: e.status, color: tone, mono: true },
          { text: e.text || '(goal)', color: theme.textDim },
        ],
      };
    }
    case 'signal':
      return {
        label: 'signal',
        accent: theme.kind.signal,
        segments: [
          { text: e.signal || '(signal)', mono: true },
          ...(e.context ? [{ text: e.context, color: theme.textDim }] : []),
        ],
      };
    case 'maintenance':
      return {
        label: 'upkeep',
        accent: theme.kind.maintenance,
        dim: true,
        segments: [{ text: e.handler, color: theme.textDim, mono: true }],
      };
  }
}

export type EventStreamProps = {
  events: ForumEvent[];
  now: number;
};

export function EventStream({ events, now }: EventStreamProps) {
  const rows = events.slice(-MAX_ROWS).reverse();

  if (rows.length === 0) {
    return (
      <div style={{ padding: '24px 4px', color: theme.textFaint, fontSize: 13 }}>
        Waiting for activity…
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {rows.map((e) => {
        const d = describe(e);
        const fullText = d.segments.map((s) => s.text).join(' ');
        return (
          <div
            key={eventKey(e)}
            className="forum-row forum-row-in"
            title={`${d.label} · ${fullText}`}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 10,
              padding: '6px 6px 6px 0',
              borderBottom: `1px solid ${theme.borderFaint}`,
              opacity: d.dim ? 0.6 : 1,
            }}
          >
            <span
              style={{
                flex: '0 0 auto',
                width: 3,
                alignSelf: 'stretch',
                background: d.accent,
                borderRadius: 2,
              }}
            />
            <span
              style={{
                flex: '0 0 56px',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: 10,
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
                color: theme.textDim,
              }}
            >
              {d.label}
            </span>
            <span
              style={{
                flex: '1 1 auto',
                minWidth: 0,
                fontSize: 13,
                color: theme.text,
                textTransform: 'none',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {d.segments.map((s, si) => (
                <span
                  key={si}
                  style={{
                    color: s.color ?? theme.text,
                    fontFamily: s.mono
                      ? 'ui-monospace, SFMono-Regular, Menlo, monospace'
                      : 'inherit',
                    marginRight: 7,
                  }}
                >
                  {s.text}
                </span>
              ))}
            </span>
            <span
              style={{
                flex: '0 0 auto',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: 11,
                color: theme.textFaint,
              }}
            >
              {ageLabel(e.ts, now)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

void React;
