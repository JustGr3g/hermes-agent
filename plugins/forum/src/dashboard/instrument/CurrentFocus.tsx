/**
 * CurrentFocus — the "NOW" zone. What goal Athena is pursuing and what
 * tool she last reached for. The most direct answer to "what is she
 * doing right now."
 */

import { React } from '../sdk';
import { theme } from '../design/theme';
import type { Focus } from '../data/types';

export type CurrentFocusProps = {
  focus: Focus | null;
  now: number;
};

function ago(ts: number, now: number): string {
  const s = Math.max(0, Math.floor(now - ts));
  if (s < 2) return 'just now';
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 10,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: theme.textFaint,
      }}
    >
      {children}
    </span>
  );
}

export function CurrentFocus({ focus, now }: CurrentFocusProps) {
  const goal = focus?.goal ?? null;
  const tool = focus?.last_tool ?? null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Label>pursuing</Label>
        {goal ? (
          <>
            {/* Free-flowing block — wraps to as many lines as needed. */}
            <div
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 16,
                lineHeight: 1.45,
                color: theme.text,
                textTransform: 'none',
              }}
            >
              {goal.content || '(untitled goal)'}
            </div>
            <span
              style={{
                fontSize: 10,
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
                color: theme.textDim,
              }}
            >
              {goal.status}
            </span>
          </>
        ) : (
          <span
            style={{
              fontSize: 14,
              color: theme.textDim,
              fontStyle: 'italic',
              textTransform: 'none',
            }}
          >
            no active goal — associative drift
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Label>last tool</Label>
        {tool ? (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: 13,
                color: theme.text,
              }}
            >
              {tool.tool}
            </span>
            <span style={{ color: tool.success ? theme.ok : theme.fail, fontSize: 13 }}>
              {tool.success ? '✓' : '✗'}
            </span>
            {tool.latency_ms != null && (
              <span style={{ fontSize: 12, color: theme.textDim }}>
                {(tool.latency_ms / 1000).toFixed(1)}s
              </span>
            )}
            <span style={{ fontSize: 11, color: theme.textFaint }}>
              {ago(tool.ts, now)}
            </span>
          </div>
        ) : (
          <span style={{ fontSize: 13, color: theme.textDim, fontStyle: 'italic' }}>
            no tool calls yet
          </span>
        )}
      </div>
    </div>
  );
}

void React;
