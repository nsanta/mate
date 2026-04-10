import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3030; // Or any desired port

// Configure CORS
// To allow all origins:
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Serve static files from a directory named 'public' and 'dist
app.use(express.static(path.join(__dirname, 'public')));
app.use('/dist', (express.static(path.join(__dirname, '../dist'))));

app.get('/test-content', (req, res) => {
  res.send('<div class="p-4 bg-green-100 text-green-800 rounded-md border border-green-200">Content loaded successfully from server! Timestamp: ' + new Date().toLocaleTimeString() + '</div>');
});

app.post('/submit-form', (req, res) => {
  const contentType = req.headers['content-type'];
  let bodyDisplay = req.body;

  if (contentType?.includes('multipart/form-data')) {
    bodyDisplay = "{Multipart Data Detected - server needs special middleware to parse}";
  } else {
    bodyDisplay = req.body;
  }

  res.send(`
    <div class="p-4 bg-sky-50 border border-sky-200 rounded-md text-sky-900">
      <div class="font-bold mb-1">Server Received:</div>
      <div class="text-xs font-mono mb-2">Content-Type: ${contentType}</div>
      <pre class="bg-white p-2 border rounded overflow-auto max-h-40 text-xs">${bodyDisplay}</pre>
    </div>
  `);
});

app.post('/api/action', (req, res) => {
  res.send(`<div class="p-4 bg-purple-100 text-purple-800 rounded-md border border-purple-200">JSON Data received: <pre class="text-xs mt-2">${JSON.stringify(req.body, null, 2)}</pre></div>`);
});


app.listen(port, () => {
  console.log(`Static server with CORS support listening at http://localhost:${port}`);
});