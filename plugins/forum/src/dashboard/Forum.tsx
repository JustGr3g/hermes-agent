/**
 * Forum — the living instrument.
 *
 * A legible real-time view of Athena's cognition. Four zones:
 *   - Masthead     — title, alive indicator, cognitive step
 *   - Cardiogram   — the heartbeat trace (hero element)
 *   - NOW          — current goal + last tool + vitals
 *   - STREAM       — the scrolling feed of typed activity events
 *
 * Data: a 1.5s poll of /api/plugins/forum/events, which tails Athena's
 * real event tables. No abstract encoding — everything is shown.
 */

import { React, useEffect, useRef, useState } from './sdk';
import { theme } from './design/theme';
import { useForumFeed } from './data/useForumFeed';
import { useInterpretation } from './data/useInterpretation';
import { Masthead } from './instrument/Masthead';
import { Cardiogram } from './instrument/Cardiogram';
import { Reading } from './instrument/Reading';
import { CurrentFocus } from './instrument/CurrentFocus';
import { Vitals } from './instrument/Vitals';
import { EventStream } from './instrument/EventStream';

const STYLE = `
@keyframes forum-row-in {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.forum-row-in { animation: forum-row-in 360ms cubic-bezier(0,0,0.2,1); }
.forum-row { transition: background-color 120ms ease; }
.forum-row:hover { background-color: ${theme.bgRaised}; }
@keyframes forum-alive {
  0%, 100% { opacity: 1;   transform: scale(1); }
  50%      { opacity: 0.45; transform: scale(0.82); }
}
.forum-alive-dot { animation: forum-alive 2.6s ease-in-out infinite; }
.forum-scroll::-webkit-scrollbar { width: 7px; }
.forum-scroll::-webkit-scrollbar-thumb {
  background: ${theme.border}; border-radius: 4px;
}
.forum-scroll::-webkit-scrollbar-track { background: transparent; }
`;

function ZoneLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 10,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: theme.textFaint,
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

export function Forum() {
  const feed = useForumFeed();
  const { interpretation, loading: interpLoading } = useInterpretation();
  const [, setTick] = useState(0);

  // Track when the latest serverTime arrived so age labels can advance
  // smoothly between 1.5s polls.
  const serverRef = useRef<{ t: number; recv: number } | null>(null);
  if (feed.serverTime != null && serverRef.current?.t !== feed.serverTime) {
    serverRef.current = { t: feed.serverTime, recv: Date.now() };
  }

  // 1s ticker so "12s ago" labels count up.
  useEffect(() => {
    const i = window.setInterval(() => setTick((n: number) => n + 1), 1000);
    return () => clearInterval(i);
  }, []);

  const displayNow = serverRef.current
    ? serverRef.current.t + (Date.now() - serverRef.current.recv) / 1000
    : Date.now() / 1000;

  // Rolling events-per-minute — a meaningful, restart-stable liveness
  // number (replaces the cognitive `step` counter, which reset to 0
  // every server restart).
  const eventsPerMin = feed.events.filter((e) => e.ts > displayNow - 60).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <style>{STYLE}</style>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          background: theme.bg,
          border: `1px solid ${theme.border}`,
          borderRadius: 10,
          padding: '20px 22px',
          minHeight: 600,
          gap: 4,
          // Neutralize the host theme (e.g. "cyberpunk") forcing
          // uppercase on everything — long sentences in all-caps are
          // exhausting. Labels re-apply uppercase explicitly.
          textTransform: 'none',
        }}
      >
        <Masthead
          status={feed.status}
          eventsPerMin={eventsPerMin}
          athenaReachable={feed.athenaReachable}
        />

        {/* Cardiogram — the heartbeat trace */}
        <div
          style={{
            height: 116,
            background: theme.bgInset,
            border: `1px solid ${theme.borderFaint}`,
            borderRadius: 8,
            overflow: 'hidden',
            marginBottom: 18,
          }}
        >
          <Cardiogram events={feed.events} serverTime={feed.serverTime} />
        </div>

        {/* Reading — dual human-readable interpretation */}
        <div style={{ marginBottom: 20 }}>
          <ZoneLabel>reading</ZoneLabel>
          <Reading
            interpretation={interpretation}
            loading={interpLoading}
            now={displayNow}
          />
        </div>

        {/* Body: NOW (left) + STREAM (right) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(260px, 40%) 1fr',
            gap: 28,
            flex: 1,
            minHeight: 360,
          }}
        >
          {/* NOW column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
            <div>
              <ZoneLabel>now</ZoneLabel>
              <CurrentFocus focus={feed.focus} now={displayNow} />
            </div>
            <div>
              <ZoneLabel>vitals</ZoneLabel>
              <Vitals vitals={feed.vitals} />
            </div>
          </div>

          {/* STREAM column */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              borderLeft: `1px solid ${theme.borderFaint}`,
              paddingLeft: 26,
            }}
          >
            <ZoneLabel>stream · {feed.events.length} events</ZoneLabel>
            <div
              className="forum-scroll"
              style={{ overflowY: 'auto', maxHeight: 440, paddingRight: 8 }}
            >
              <EventStream events={feed.events} now={displayNow} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

void React;
