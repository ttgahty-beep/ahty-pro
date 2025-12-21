
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.data': 'application/octet-stream',
};

const server = http.createServer((req, res) => {
  // Handle clean URLs and fallbacks
  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);

  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // If file not found, serve index.html for SPA routing (unless it's an asset)
      if (!req.url.match(/\.(js|css|png|jpg|gif|svg|ico|wasm|data)$/)) {
          filePath = path.join(DIST_DIR, 'index.html');
          serveFile(filePath, res);
      } else {
          res.writeHead(404);
          res.end('Not Found');
      }
    } else {
      // If directory, try index.html
      if (fs.statSync(filePath).isDirectory()) {
          filePath = path.join(filePath, 'index.html');
      }
      serveFile(filePath, res);
    }
  });
});

function serveFile(filePath, res) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            res.writeHead(500);
            res.end('Server Error: ' + error.code);
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
}

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
