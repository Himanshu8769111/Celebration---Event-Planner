/**
 * CELEBRAI LOCAL DEV SERVER
 * Zero-dependency native Node.js HTTP server supporting all celebration assets,
 * mime types, and automatic fallback if port is busy.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 8080;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.mjs': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

function startServer(port) {
  const server = http.createServer((req, res) => {
    // Strip query strings and hashes
    let parsedUrl = req.url.split('?')[0].split('#')[0];
    if (parsedUrl === '/' || parsedUrl === '') {
      parsedUrl = '/index.html';
    }

    // Prevent directory traversal attacks
    const safePath = path.normalize(parsedUrl).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(ROOT_DIR, safePath);

    fs.stat(filePath, (statErr, stats) => {
      if (statErr || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end('404 Not Found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      });

      fs.createReadStream(filePath).pipe(res);
    });
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${port} in use, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });

  server.listen(port, () => {
    console.log(`\n======================================================`);
    console.log(`  ✨ CelebraAI Event Architect is running!`);
    console.log(`  🌐 Local:   http://localhost:${port}/`);
    console.log(`======================================================\n`);
  });
}

startServer(DEFAULT_PORT);
