/**
 * Vitals — a compact row of live readouts: working-memory load,
 * confidence, active goals, associative memory size.
 *
 * WM load and confidence get a thin bar so their level reads at a
 * glance; counts are plain numbers.
 */

import { React } from '../sdk';
import { theme } from '../design/theme';
import type { Vitals as VitalsData } from '../data/types';

function compact(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function Stat({
  label,
  value,
  bar,
  barColor,
}: {
  label: string;
  value: string;
  bar?: number | null;
  barColor?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 92 }}>
      <span
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 9.5,
          letterSpacing: '0.11em',
          textTransform: 'uppercase',
          color: theme.textFaint,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 15,
          color: theme.text,
        }}
      >
        {value}
      </span>
      {bar != null && (
        <span
          style={{
            position: 'relative',
            width: 64,
            height: 2,
            background: theme.borderFaint,
            borderRadius: 1,
            overflow: 'hidden',
          }}
        >
          <span
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${Math.max(0, Math.min(1, bar)) * 100}%`,
              background: barColor ?? theme.pulse,
            }}
          />
        </span>
      )}
    </div>
  );
}

export type VitalsProps = {
  vitals: VitalsData | null;
};

export function Vitals({ vitals }: VitalsProps) {
  const wm = vitals?.wm_load ?? null;
  const conf = vitals?.confidence ?? null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px 16px',
      }}
    >
      <Stat
        label="wm load"
        value={wm != null ? wm.toFixed(2) : '—'}
        bar={wm}
        barColor={theme.kind.signal}
      />
      <Stat
        label="confidence"
        value={conf != null ? conf.toFixed(2) : '—'}
        bar={conf}
        barColor={theme.ok}
      />
      <Stat label="goals" value={compact(vitals?.goal_count)} />
      <Stat label="memory" value={compact(vitals?.assoc_nodes)} />
      <Stat label="links" value={compact(vitals?.assoc_edges)} />
    </div>
  );
}

void React;
