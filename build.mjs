// Build : src/main.ts -> dist/app.js (bundle IIFE minifié, source map), puis copie
// d'index.html dans dist/ avec le script pointé sur ./app.js : dist/ est le site
// statique déployable tel quel (Vercel : outputDirectory = dist). La racine du dépôt
// reste ouvrable directement (index.html y référence dist/app.js).
// Usage : node build.mjs [--watch]
import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const watch = process.argv.includes('--watch');

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

const options = {
  entryPoints: ['src/main.ts'],
  bundle: true,
  format: 'iife',
  target: ['es2020'],
  outfile: 'dist/app.js',
  sourcemap: true,
  minify: true,
  charset: 'utf8',
  legalComments: 'none',
  logLevel: 'info',
  plugins: [copyHtmlPlugin],
};
if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
} else {
  await esbuild.build(options);
}
