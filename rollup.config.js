import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import run from '@rollup/plugin-run';
import typescript from '@rollup/plugin-typescript';
import clear from 'rollup-plugin-clear';
import copy from 'rollup-plugin-copy';
import livereload from 'rollup-plugin-livereload';
import svelte from 'rollup-plugin-svelte';
import { terser } from 'rollup-plugin-terser';
import sveltePreprocess from 'svelte-preprocess';

const production = !process.env.ROLLUP_WATCH;

export default [{
  // Server
  input: 'src/app.ts',
  output: {
    name: 'app',
    dir: 'dist/',
    format: 'cjs',
    sourcemap: true,
  },
  onwarn(warning, warn) {
    // suppress eval and 'imported a node builtin module' warnings on the server.
    if (warning.code === 'EVAL' || warning.code === 'UNRESOLVED_IMPORT') return;
    warn(warning);
  },
  plugins: [
    clear({ targets: ['dist'] }),
    resolve({
      browser: false,
      preferBuiltins: true,
    }),
    commonjs(),
    json(),
    typescript({
      tsconfig: 'tsconfig.server.json',
    }),

    // Run the server when using `npm run dev`.
    !production && run({
      execArgv: [
        '--require', 'source-map-support/register',
        '--require', 'dotenv/config'
      ],
    }),
  ],
}, {
  // Client
  input: 'src/client/main.ts',
  output: {
    dir: 'dist/public/build',
    sourcemap: !production,
    format: 'es',
    name: 'client',
  },
  plugins: [
    svelte({
      // enable run-time checks when not in production
      dev: !production,
      // we'll extract any component CSS out into
      // a separate file - better for performance
      css: css => {
        css.write('dist/public/build/bundle.css');
      },
      preprocess: sveltePreprocess(),
    }),

    // To handle external dependencies installed from npm:
    resolve({
      browser: true,
      dedupe: ['svelte']
    }),
    commonjs(),

    typescript({
      tsconfig: 'tsconfig.client.json',
      sourceMap: !production,
    }),

    copy({
      targets: [
        { src: 'public/*', dest: 'dist/public' },
      ]
    }),

    // Watch the `public` directory and refresh the
    // browser on changes when not in production
    !production && livereload('dist'),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser()
  ],
  watch: {
    clearScreen: false
  }
}];
