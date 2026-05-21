/**
 * SDK shim — single source of truth for React, hooks, and Hermes UI
 * components inside this plugin.
 *
 * Hermes injects `window.__HERMES_PLUGIN_SDK__` BEFORE the plugin
 * bundle runs. We re-export the runtime bindings from there so no file
 * in the plugin imports `react` directly — that would trigger esbuild's
 * IIFE require() shim, which fails in browser ("Dynamic require of
 * 'react' is not supported").
 *
 * Type-only imports from 'react' are fine — they're erased by tsc.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SDK = (window as any).__HERMES_PLUGIN_SDK__;

if (!SDK) {
  // Surface a clear console error before the rest of the bundle crashes.
  // eslint-disable-next-line no-console
  console.error(
    'forum: window.__HERMES_PLUGIN_SDK__ not found at import time. ' +
    'The plugin cannot run outside Hermes\'s dashboard shell.',
  );
}

// React itself + the JSX factory entry points the esbuild jsxFactory
// option resolves at runtime (`React.createElement` / `React.Fragment`).
export const React = SDK?.React;

// Hooks — destructured for ergonomic imports
export const useState = SDK?.hooks?.useState;
export const useEffect = SDK?.hooks?.useEffect;
export const useRef = SDK?.hooks?.useRef;
export const useCallback = SDK?.hooks?.useCallback;
export const useMemo = SDK?.hooks?.useMemo;

// Hermes shared UI components (shadcn-style)
export const components = SDK?.components ?? {};
export const Card = components.Card;
export const CardHeader = components.CardHeader;
export const CardTitle = components.CardTitle;
export const CardContent = components.CardContent;
export const Badge = components.Badge;
export const Button = components.Button;

// Utility — same-origin fetch with auto-attached session token
export const fetchJSON: <T = unknown>(url: string, init?: RequestInit) => Promise<T> =
  SDK?.fetchJSON;

// Registration entry point (window.__HERMES_PLUGINS__.register)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const HERMES_PLUGINS = (window as any).__HERMES_PLUGINS__;
