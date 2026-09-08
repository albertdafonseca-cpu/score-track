// Build : src/main.ts -> dist/app.js (bundle IIFE minifié, source map), puis copie
// d'index.html dans dist/ avec le script pointé sur ./app.js : dist/ est le site
// statique déployable tel quel (Vercel : outputDirectory = dist). La racine du dépôt
// reste ouvrable directement (index.html y référence dist/app.js).
// Usage : node build.mjs [--watch]
import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const watch = process.argv.includes('--watch');
// version de l'app = <meta name="app-version"> d'index.html (injectée dans le worker)
const appVersion = (readFileSync('index.html', 'utf8').match(/name="app-version"\s+content="([^"]*)"/) || [])[1] || '0';

const copyHtmlPlugin = {
  name: 'copy-html',
  setup(build) {
    build.onEnd((result) => {
      if (result.errors.length) return;
      mkdirSync('dist', { recursive: true });
      const html = readFileSync('index.html', 'utf8').replace('src="dist/app.js"', 'src="app.js"');
      writeFileSync('dist/index.html', html);
    });
  },
};

const common = {
  bundle: true,
  format: 'iife',
  target: ['es2020'],
  minify: true,
  charset: 'utf8',
  legalComments: 'none',
  logLevel: 'info',
};
const options = {
  ...common,
  entryPoints: ['src/main.ts'],
  outfile: 'dist/app.js',
  sourcemap: true,
  plugins: [copyHtmlPlugin],
};
// service worker : fichier séparé (un worker depuis une URL blob: est refusé)
const swOptions = {
  ...common,
  entryPoints: ['src/sw-worker.ts'],
  outfile: 'dist/sw.js',
  define: { __APP_VERSION__: JSON.stringify(appVersion) },
};
if (watch) {
  const ctx = await esbuild.context(options);
  const ctxSw = await esbuild.context(swOptions);
  await Promise.all([ctx.watch(), ctxSw.watch()]);
} else {
  await esbuild.build(options);
  await esbuild.build(swOptions);
}
