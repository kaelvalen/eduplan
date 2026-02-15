const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Set working directory
const dir = path.join(__dirname, '..');

const app = next({ dev, hostname, port, dir });
const handle = app.getRequestHandler();

let server = null;

async function startServer() {
  try {
    await app.prepare();
    
    server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error occurred handling', req.url, err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });

    server.listen(port, hostname, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });

    return server;
  } catch (err) {
    console.error('Failed to start server:', err);
    throw err;
  }
}

function stopServer() {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        console.log('Server stopped');
        resolve();
      });
    } else {
      resolve();
    }
  });
}

module.exports = { startServer, stopServer, port };
