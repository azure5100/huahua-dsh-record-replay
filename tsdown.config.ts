/**
 * Client bundle for the dsh web GUI. Emits the closure-factory artifact the
 * loader expects: the bundle calls window.__ModuleLoader__.load({id, factory})
 * and is served at /plugins/dsh-record-replay/client.js. Everything (react,
 * react-dom, the plugin's own code) is inlined into the single bundle; the
 * only runtime require answers come from the loader's module table, which
 * this plugin does not need.
 */
import { defineConfig } from 'tsdown'

export default defineConfig({
  name: 'dsh-record-replay/client',
  entry: { client: 'src/client/index.ts' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  dts: false,
  clean: false,
  sourcemap: true,
  external: [],
  // Inline every dependency (react, react-dom): the loader module table has
  // no react entry, so a bare require would throw at runtime.
  noExternal: [/.*/],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
  },
  outputOptions: {
    entryFileNames: 'client.js',
    banner: 'window.__ModuleLoader__.load({ id: "dsh-record-replay", factory: (require) => {',
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
  },
})