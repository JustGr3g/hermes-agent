/**
 * Reading — the dual human-readable interpretation.
 *
 * Two vantage points on the same moment, side by side:
 *   - Instrument read : an objective diagnostic interpretation of the
 *                       telemetry (grounded in the event rows)
 *   - Athena's voice  : her own self-report, condensed
 *
 * Reading both, divergence between them is itself a signal — when the
 * instrument says "stuck" and Athena says "making progress," that gap
 * is worth noticing.
 */

import { React } from '../sdk';
import { theme } from '../design/theme';
import type { Interpretation } from '../data/types';

function ago(ts: number, now: number): string {
  const s = Math.max(0, Math.floor(now - ts));
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function ColumnLabel({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
      <span style={{ width: 3, height: 11, background: color, borderRadius: 2 }} />
      <span
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 10,
          letterSpacing: '0.13em',
          textTransform: 'uppercase',
          color: theme.textDim,
        }}
      >
        {children}
      </span>
    </div>
  );
}

export type ReadingProps = {
  interpretation: Interpretation | null;
  loading: boolean;
  now: number;
};

export function Reading({ interpretation, loading, now }: ReadingProps) {
  const instrument = interpretation?.instrument;
  const athena = interpretation?.athena;

  const placeholder = (text: string) => (
    <span style={{ fontSize: 13, color: theme.textFaint, fontStyle: 'italic' }}>
      {text}
    </span>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
        {/* Instrument read — objective */}
        <div>
          <ColumnLabel color={theme.pulse}>instrument read</ColumnLabel>
          {instrument ? (
            <p
              style={{
                margin: 0,
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 14.5,
                lineHeight: 1.55,
                color: theme.text,
                textTransform: 'none',
              }}
            >
              {instrument}
            </p>
          ) : (
            placeholder(loading ? 'reading the telemetry…' : 'interpretation unavailable')
          )}
        </div>

        {/* Athena's voice — self-report */}
        <div style={{ borderLeft: `1px solid ${theme.borderFaint}`, paddingLeft: 28 }}>
          <ColumnLabel color={theme.kind.signal}>athena's voice</ColumnLabel>
          {athena ? (
            <p
              style={{
                margin: 0,
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontStyle: 'italic',
                fontSize: 14.5,
                lineHeight: 1.55,
                color: theme.textDim,
                textTransform: 'none',
              }}
            >
              {athena}
            </p>
          ) : (
            placeholder(loading ? 'asking Athena…' : 'self-report unavailable')
          )}
        </div>
      </div>

      {interpretation && (
        <div
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 10,
            color: theme.textFaint,
          }}
        >
          interpreted {ago(interpretation.generated_at, now)} · {interpretation.model}
        </div>
      )}
    </div>
  );
}

void React;
