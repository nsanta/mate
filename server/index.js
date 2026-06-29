import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import http from 'http';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3030;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/dist', express.static(path.join(__dirname, '../dist')));
app.use('/src', express.static(path.join(__dirname, '../src')));

const MESSAGES = [
  'Initializing system...',
  'Loading dependencies...',
  'Connecting to database...',
  'Fetching user data...',
  'Processing records...',
  'Generating report...',
  'Finalizing...',
  'Done!',
];

const COLORS = ['indigo', 'emerald', 'amber', 'rose', 'sky', 'violet', 'orange', 'teal'];

function styledBox(text, color = 'indigo') {
  const bg = { indigo: 'indigo-50', emerald: 'emerald-50', amber: 'amber-50', rose: 'rose-50', sky: 'sky-50', violet: 'violet-50', orange: 'orange-50', teal: 'teal-50' }[color] || 'indigo-50';
  const border = { indigo: 'indigo-200', emerald: 'emerald-200', amber: 'amber-200', rose: 'rose-200', sky: 'sky-200', violet: 'violet-200', orange: 'orange-200', teal: 'teal-200' }[color] || 'indigo-200';
  const text_color = { indigo: 'indigo-800', emerald: 'emerald-800', amber: 'amber-800', rose: 'rose-800', sky: 'sky-800', violet: 'violet-800', orange: 'orange-800', teal: 'teal-800' }[color] || 'indigo-800';
  return `<div class="p-4 bg-${bg} text-${text_color} rounded-md border border-${border}">${text}</div>`;
}

app.get('/api/hello', (_req, res) => {
  res.send(styledBox('Hello from the server! ' + new Date().toLocaleTimeString()));
});

app.get('/api/outer', (_req, res) => {
  res.send('<div class="px-4 py-2 bg-violet-600 text-white rounded-md">I replaced the button!</div>');
});

app.get('/api/text', (_req, res) => {
  res.type('text/plain').send('<script>alert("XSS!")</script><img src=x onerror=alert(1)>');
});

app.get('/api/items', (_req, res) => {
  const items = [
    'Build a prototype',
    'Write documentation',
    'Fix critical bugs',
    'Deploy to production',
    'Celebrate the release',
  ];
  const item = items[Math.floor(Math.random() * items.length)];
  res.send(`<div class="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded text-sm text-gray-700">${item}</div>`);
});

app.get('/api/broadcast', (_req, res) => {
  res.send('<div class="text-sm font-medium text-teal-700">Updated ' + new Date().toLocaleTimeString() + '</div>');
});

app.get('/api/echo-headers', (req, res) => {
  const headers = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (key.startsWith('x-') || key === 'authorization' || key === 'content-type') {
      headers[key] = value;
    }
  }
  res.json(headers);
});

app.get('/api/error', (_req, res) => {
  res.status(500).send('Internal Server Error');
});

const upload = multer();

app.post('/api/submit', upload.none(), (req, res) => {
  const body = { ...req.body };
  const formatted = typeof body === 'object' ? JSON.stringify(body, null, 2) : String(body);
  res.send(`<div class="p-4 bg-sky-50 border border-sky-200 rounded-md text-sky-900">
    <div class="font-bold mb-1">Server received:</div>
    <pre class="bg-white p-2 border rounded text-xs mt-2 overflow-auto max-h-40">${formatted}</pre>
  </div>`);
});

app.get('/api/echo', (req, res) => {
  const key = req.query.key || 'none';
  res.send(`<span class="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded text-sm font-mono">${key}</span>`);
});

app.get('/api/mouse-echo', (req, res) => {
  const button = req.query.button || 'unknown';
  res.send(`<span class="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded text-sm font-mono">${button} click</span>`);
});

app.get('/stream/demo', (req, res) => {
  res.set({
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  let i = 0;
  const interval = setInterval(() => {
    if (i < MESSAGES.length) {
      res.write(MESSAGES[i] + '\n');
      i++;
    } else {
      clearInterval(interval);
      res.end();
    }
  }, 500);

  req.on('close', () => clearInterval(interval));
});

app.get('/sse/demo', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  res.write(`data: ${JSON.stringify({ message: 'Connected', time: new Date().toLocaleTimeString() })}\n\n`);

  let count = 0;
  const interval = setInterval(() => {
    count++;
    const data = { message: `Event #${count}`, time: new Date().toLocaleTimeString(), count };
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }, 2000);

  req.on('close', () => clearInterval(interval));
});

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'connected', message: 'WebSocket connected', time: new Date().toLocaleTimeString() }));

  ws.on('message', (data) => {
    const text = data.toString();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
    ws.send(JSON.stringify({ type: 'echo', data: parsed, time: new Date().toLocaleTimeString() }));
  });
});

const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  server.listen(port, () => {
    console.log(`mate.js demo server running at http://localhost:${port}`);
  });
}

export { app, server, wss };
