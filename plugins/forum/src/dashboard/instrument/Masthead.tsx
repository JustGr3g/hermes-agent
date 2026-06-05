/**
 * Masthead — title row with the alive indicator and cognitive step.
 *
 * The alive dot: green + gently pulsing when the feed is live, amber
 * when stale, red when the connection is lost. The step counter is
 * Athena's cognitive cycle count — it climbs as she thinks.
 */

import { React } from '../sdk';
import { theme } from '../design/theme';
import type { ConnectionStatus } from '../data/types';

export type MastheadProps = {
  status: ConnectionStatus;
  eventsPerMin: number;
  athenaReachable: boolean;
};

export function Masthead({ status, eventsPerMin, athenaReachable }: MastheadProps) {
  const live = status === 'live' && athenaReachable;
  const dotColor =
    !athenaReachable ? theme.fail :
    status === 'live' ? theme.ok :
    status === 'stale' ? theme.warn :
    theme.fail;
  const stateWord =
    !athenaReachable ? 'athena offline' :
    status === 'live' ? 'alive' :
    status === 'stale' ? 'reconnecting' :
    'disconnected';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '2px 2px 14px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
        <span
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 22,
            letterSpacing: '0.14em',
            color: theme.text,
          }}
        >
          ATHENA
        </span>
        <span
          style={{
            fontSize: 11,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: theme.textFaint,
          }}
        >
          the forum
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 12,
            color: theme.textDim,
          }}
          title="cognitive events in the last minute"
        >
          {eventsPerMin}/min
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span
            className={live ? 'forum-alive-dot' : undefined}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: dotColor,
              boxShadow: `0 0 8px ${dotColor}`,
            }}
          />
          <span
            style={{
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: theme.textDim,
            }}
          >
            {stateWord}
          </span>
        </div>
      </div>
    </div>
  );
}

void React;
