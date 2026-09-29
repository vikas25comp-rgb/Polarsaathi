import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');
const bundledServer = path.join(distDir, 'server.js');

async function bootstrap() {
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  await esbuild.build({
    entryPoints: [path.join(__dirname, 'server-core.ts')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    packages: 'external',
    outfile: bundledServer,
  });
  console.log('[DHRUVYAN] Server bundle updated.');

  await import(pathToFileURL(bundledServer).href + '?t=' + Date.now());
}

bootstrap().catch((err) => {
  console.error('[DHRUVYAN] Bootstrap error:', err);
  process.exit(1);
});
