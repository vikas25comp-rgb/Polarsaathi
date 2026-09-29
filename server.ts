import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');
const bundledServer = path.join(distDir, 'server.js');

async function bootstrap() {
  // If bundled server does not exist, generate it on-the-fly via esbuild in <20ms
  if (!fs.existsSync(bundledServer)) {
    console.log('[DHRUVYAN] Generating server bundle on startup...');
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
    console.log('[DHRUVYAN] Server bundle generated.');
  }

  // In production or post-bundle, execute the self-contained server
  await import(pathToFileURL(bundledServer).href);
}

bootstrap().catch((err) => {
  console.error('[DHRUVYAN] Bootstrap error:', err);
  process.exit(1);
});
