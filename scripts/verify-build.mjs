import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { resolveConfig, serve } from 'vitepress';

const root = fileURLToPath(new URL('../docs/', import.meta.url));
const config = await resolveConfig(root, 'serve', 'production');
const app = await serve({ root, port: 0 });
try {
  if (!app.server.listening) await once(app.server, 'listening');
  const { port } = app.server.address();
  process.env.SITE_URL = `http://127.0.0.1:${port}${config.site.base}`;
  process.env.EXPECT_RELEASE_URL = process.env.RELEASE_URL || 'https://github.com/Mr-Pardon/VerdFlow/releases';
  await import('./verify-site.mjs');
} finally {
  app.server.closeAllConnections();
  await new Promise((resolve, reject) => app.server.close(error => error ? reject(error) : resolve()));
}
