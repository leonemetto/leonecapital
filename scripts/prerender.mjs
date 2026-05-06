/**
 * Prerender public pages at build time so Google reads real HTML, not an empty div.
 * Runs as a postbuild step: reads dist/index.html, renders each public route to a string,
 * and writes the result back to dist/{route}/index.html.
 */

import { createServer } from 'vite';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const ROUTES = [
  '/',
  '/how-to-use',
  '/blog',
  '/blog/how-to-keep-a-trading-journal',
  '/blog/forex-trading-journal',
  '/blog/prop-firm-trading-journal',
  '/blog/how-to-detect-trading-leaks',
  '/blog/revenge-trading-how-to-detect-it',
];

function injectHelmet(html, helmet) {
  if (!helmet) return html;
  let result = html;

  // Replace the static title with the route-specific one
  const titleStr = helmet.title?.toString() || '';
  if (titleStr) {
    result = result.replace(/<title>[^<]*<\/title>/, titleStr);
  }

  // Inject meta tags before </head>
  const metaStr = [
    helmet.meta?.toString() || '',
    helmet.link?.toString() || '',
    helmet.script?.toString() || '',
  ].join('');

  if (metaStr) {
    result = result.replace('</head>', `${metaStr}</head>`);
  }

  return result;
}

async function prerender() {
  const distIndexPath = resolve(root, 'dist/index.html');
  if (!existsSync(distIndexPath)) {
    console.error('dist/index.html not found — run vite build first');
    process.exit(1);
  }

  const template = readFileSync(distIndexPath, 'utf-8');

  const vite = await createServer({
    root,
    server: { middlewareMode: true },
    appType: 'custom',
    // Silence noisy dev server output during prerender
    logLevel: 'warn',
  });

  try {
    const { render } = await vite.ssrLoadModule('/src/entry-server.tsx');

    for (const route of ROUTES) {
      try {
        const { html: appHtml, helmetContext } = render(route);
        const helmet = helmetContext?.helmet;

        // Inject rendered HTML into the root div
        let html = template.replace(
          '<div id="root"></div>',
          `<div id="root">${appHtml}</div>`
        );

        // Inject per-route head tags from react-helmet-async
        html = injectHelmet(html, helmet);

        // Determine output path
        const outPath = route === '/'
          ? resolve(root, 'dist/index.html')
          : resolve(root, `dist${route}/index.html`);

        if (route !== '/') {
          mkdirSync(dirname(outPath), { recursive: true });
        }

        writeFileSync(outPath, html, 'utf-8');
        console.log(`✓ Prerendered ${route}`);
      } catch (err) {
        // Don't fail the whole build for one route — fall back to SPA for that route
        console.warn(`⚠ Skipped prerender for ${route}:`, err.message);
      }
    }
  } finally {
    await vite.close();
  }
}

prerender().catch(err => {
  console.error('Prerender failed:', err);
  process.exit(1);
});
