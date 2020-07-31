import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';
import livereload from 'rollup-plugin-livereload';
import svelte from 'rollup-plugin-svelte';
import { terser } from 'rollup-plugin-terser';
import sveltePreprocess from 'svelte-preprocess';


const production = !process.env.ROLLUP_WATCH;

function serve() {
  let server;

  function toExit() {
    if (server) server.kill(0);
  }

  return {
    writeBundle() {
      if (server) return;
      server = require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
        stdio: ['ignore', 'inherit', 'inherit'],
        shell: true
      });

      process.on('SIGTERM', toExit);
      process.on('exit', toExit);
    }
  };
}

export default [{
  // Server
  input: 'src/app.ts',
  output: {
    name: 'app',
    dir: 'dist/',
    format: 'cjs',
    sourcemap: true,
  },
  external: ['buffer', 'crypto', 'events', 'fs', 'http', 'net', 'path', 'querystring', 'stream', 'tty', 'url', 'util', 'zlib'],
  onwarn(warning, warn) {
    // suppress eval warnings on the server.
    if (warning.code === 'EVAL') return;
    warn(warning);
  },
  plugins: [
    resolve({
      browser: false,
      preferBuiltins: true,
    }),
    commonjs(),
    json(),
    typescript({
      tsconfig: 'tsconfig.server.json',
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

    // If you have external dependencies installed from
    // npm, you'll most likely need these plugins. In
    // some cases you'll need additional configuration -
    // consult the documentation for details:
    // https://github.com/rollup/plugins/tree/master/packages/commonjs
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

    // In dev mode, call `npm run start` once
    // the bundle has been generated
    !production && serve(),

    // Watch the `public` directory and refresh the
    // browser on changes when not in production
    !production && livereload('public'),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser()
  ],
  watch: {
    clearScreen: false
  }
}];
