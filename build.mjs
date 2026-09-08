// Build : src/main.ts -> dist/app.js (bundle IIFE, un seul fichier, source map).
// Usage : node build.mjs [--watch]
import * as esbuild from 'esbuild';
const watch = process.argv.includes('--watch');
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
};
if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
} else {
  await esbuild.build(options);
}
