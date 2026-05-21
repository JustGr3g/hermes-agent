import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const outDir = resolve(root, 'dashboard', 'dist');

const watch = process.argv.includes('--watch');

await mkdir(outDir, { recursive: true });

const config = {
  entryPoints: [resolve(root, 'src', 'dashboard', 'index.tsx')],
  bundle: true,
  format: 'iife',
  target: ['es2020'],
  outfile: resolve(outDir, 'index.js'),
  loader: { '.tsx': 'tsx', '.ts': 'ts' },
  jsx: 'transform',
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
  // No externals: the plugin must NOT import "react" directly — that
  // would generate an esbuild require() shim that fails in browser
  // ("Dynamic require of 'react' is not supported"). React is accessed
  // via window.__HERMES_PLUGIN_SDK__ through ./sdk.ts.
  logLevel: 'info',
  sourcemap: 'inline',
};

if (watch) {
  const ctx = await esbuild.context(config);
  await ctx.watch();
  console.log('forum plugin: watching for changes…');
} else {
  await esbuild.build(config);
  console.log('forum plugin: build complete →', resolve(outDir, 'index.js'));
}
