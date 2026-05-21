/**
 * The Forum plugin — entry point.
 *
 * Bundled as an IIFE by esbuild. Calls
 * window.__HERMES_PLUGINS__.register("forum", Forum) so Hermes can
 * mount the component when the user navigates to /forum.
 *
 * All React/hooks/components are accessed via the sdk module which
 * pulls them from window.__HERMES_PLUGIN_SDK__ at startup. The bundle
 * does NOT import "react" — that would generate an esbuild require()
 * shim that fails at runtime in browser.
 */

import { HERMES_PLUGINS } from './sdk';
import { Forum } from './Forum';

if (HERMES_PLUGINS && typeof HERMES_PLUGINS.register === 'function') {
  HERMES_PLUGINS.register('forum', Forum);
} else {
  // eslint-disable-next-line no-console
  console.error('forum: window.__HERMES_PLUGINS__.register not available');
}
