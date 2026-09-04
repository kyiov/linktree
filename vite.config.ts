import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { searchYouTubeMusic, getAudioDownloadUrl } from './src/server/musicApi.js';

import http from 'node:http';
import https from 'node:https';

function musicApiPlugin() {
  const handler = async (req: any, res: any, next: any) => {
    const urlObj = new URL(req.url, 'http://localhost');

    if (urlObj.pathname === '/api/music/search') {
      const q = urlObj.searchParams.get('q') || '';
      try {
        const results = await searchYouTubeMusic(q);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true, results }));
      } catch (err: any) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
      return;
    }

    if (urlObj.pathname === '/api/music/play') {
      const id = urlObj.searchParams.get('id') || '';
      try {
        const data = await getAudioDownloadUrl(id);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true, ...data }));
      } catch (err: any) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
      return;
    }

    if (urlObj.pathname === '/api/music/stream') {
      const targetUrl = urlObj.searchParams.get('url');
      if (!targetUrl) {
        res.statusCode = 400;
        res.end('Missing url');
        return;
      }

      try {
        const client = targetUrl.startsWith('https:') ? https : http;
        const options: any = {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          }
        };
        if (req.headers.range) {
          options.headers['Range'] = req.headers.range;
        }

        const proxyReq = client.get(targetUrl, options, (proxyRes) => {
          const respHeaders: Record<string, any> = {};
          for (const [key, val] of Object.entries(proxyRes.headers)) {
            if (!val) continue;
            const lowerKey = key.toLowerCase();
            if (['content-disposition', 'x-frame-options'].includes(lowerKey)) continue;
            respHeaders[key] = val;
          }
          respHeaders['content-type'] = 'audio/mpeg';
          respHeaders['content-disposition'] = 'inline';
          respHeaders['access-control-allow-origin'] = '*';
          respHeaders['access-control-allow-headers'] = 'Range';

          res.writeHead(proxyRes.statusCode || 200, respHeaders);
          proxyRes.pipe(res);
        });

        proxyReq.on('error', (err) => {
          if (!res.headersSent) res.statusCode = 502;
          res.end(err.message);
        });

        req.on('close', () => {
          proxyReq.destroy();
        });
      } catch (err: any) {
        if (!res.headersSent) res.statusCode = 500;
        res.end(err.message);
      }
      return;
    }

    next();
  };

  return {
    name: 'music-api-plugin',
    configureServer(server: any) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server: any) {
      server.middlewares.use(handler);
    }
  };
}

export default defineConfig({
  plugins: [react(), musicApiPlugin()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    allowedHosts: true
  }
});
