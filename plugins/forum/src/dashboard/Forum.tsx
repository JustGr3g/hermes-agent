/**
 * Forum — root component for the dashboard tab.
 *
 * Phase 2 (static composition): renders the Canvas 2D scene with all
 * five elements visible as static placeholders. The Phase 1 diagnostic
 * cards (connection status, raw state) are kept below the canvas as a
 * collapsed details block so the contemplative composition is the
 * primary experience.
 *
 * Phases 3+ add live data encoding, motion, interactions, and depth.
 */

import {
  React,
  useEffect,
  useState,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  fetchJSON,
} from './sdk';
import { useForumState } from './data/useForumState';
import { ForumCanvas } from './canvas/ForumCanvas';

function StatusBadge({ status }: { status: string }) {
  const variant: string =
    status === 'open' ? 'default' :
    status === 'connecting' ? 'secondary' :
    status === 'error' ? 'destructive' :
    'outline';
  return <Badge variant={variant}>{status}</Badge>;
}

function formatAge(ts: number | null): string {
  if (ts === null) return '—';
  const ageSec = Math.floor((Date.now() - ts) / 1000);
  if (ageSec < 60) return `${ageSec}s ago`;
  if (ageSec < 3600) return `${Math.floor(ageSec / 60)}m ago`;
  return `${Math.floor(ageSec / 3600)}h ago`;
}

export function Forum() {
  const { state, status, lastUpdateAt } = useForumState();
  const [pluginHealth, setPluginHealth] = useState<unknown>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const i = window.setInterval(() => setTick((n: number) => n + 1), 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    fetchJSON('/api/plugins/forum/health')
      .then((d: unknown) => setPluginHealth(d))
      .catch(() => setPluginHealth({ error: 'plugin backend unreachable' }));
  }, []);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/*
        The contemplative canvas takes the bulk of the page. Min-height
        ensures it's substantial even on short viewports; aspect ratio
        gives it a horizontal composition (3:1 is wider than the live
        Forum will be in fullscreen, but works for an embedded tab).
      */}
      <div
        style={{
          width: '100%',
          aspectRatio: '16 / 9',
          minHeight: '480px',
          maxHeight: '75vh',
          borderRadius: '8px',
          overflow: 'hidden',
          background: '#0a0e1c',
        }}
      >
        <ForumCanvas />
      </div>

      {/* Diagnostic strip — small, below the canvas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Diagnostic — Phase 2 (static composition)</CardTitle>
            <Badge variant="outline">v0.2.0</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">Athena WS:</span>
            <StatusBadge status={status} />
            <span className="text-muted-foreground ml-3">last update:</span>
            <span className="font-mono">{formatAge(lastUpdateAt)}</span>
            <span className="text-muted-foreground ml-3">plugin backend:</span>
            <code className="font-mono">
              {pluginHealth === null ? 'loading…' : JSON.stringify(pluginHealth)}
            </code>
          </div>
          {state !== null && (
            <details className="mt-1">
              <summary className="text-muted-foreground cursor-pointer hover:text-foreground">
                Athena state ({Object.keys(state).length} top-level keys, step {state.step ?? '—'})
              </summary>
              <pre className="mt-2 font-mono bg-background/40 p-3 rounded border border-border overflow-x-auto max-h-72">
                {JSON.stringify(state, null, 2)}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

void React;
