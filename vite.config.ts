import { marked } from 'marked';
import { defineConfig, type Plugin } from 'vite';

// Two pages (D17): the front page, index.html, is the guide in docs/subscribe.md, and
// the app is app/index.html, served at /app/. The guide is Markdown rendered into the
// page at build time, so the page has no script and the app no runtime dependency.
// Vitest reads vitest.config.ts, not this file.

// Node's fs, typed here rather than through @types/node, which the app doesn't need
// (as in vitest.config.ts). Node 22.12, the least this repository runs on, has
// process.getBuiltinModule.
type Fs = { readFileSync(path: URL, encoding: 'utf8'): string };
const { process: node } = globalThis as unknown as {
  process: { getBuiltinModule(id: 'node:fs'): Fs };
};
const fs = node.getBuiltinModule('node:fs');

const GUIDE = new URL('./docs/subscribe.md', import.meta.url);
const MARKER = '<!-- docs/subscribe.md -->';

function subscribeGuide(): Plugin {
  return {
    name: 'subscribe-guide',
    transformIndexHtml(html) {
      if (!html.includes(MARKER)) return html;
      return html.replace(MARKER, marked.parse(fs.readFileSync(GUIDE, 'utf8'), { async: false }));
    },
    // `npm run dev` reloads the page when the guide changes. The watcher's paths use
    // forward slashes, and the drive letter's case can differ, so only the end is compared.
    configureServer(server) {
      server.watcher.add('docs/subscribe.md');
      server.watcher.on('change', (file) => {
        if (file.replaceAll('\\', '/').endsWith('/docs/subscribe.md')) server.ws.send({ type: 'full-reload' });
      });
    },
  };
}

export default defineConfig({
  plugins: [subscribeGuide()],
  build: {
    rolldownOptions: {
      // Relative to the root, which every command here starts in.
      input: { guide: 'index.html', app: 'app/index.html' },
    },
  },
});
