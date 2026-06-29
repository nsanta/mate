import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { server } from '../server/index.js';
import { WebSocket } from 'ws';
import mate from '../src/mate.js';

let baseURL;
let wsURL;

beforeAll(async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseURL = `http://localhost:${port}`;
  wsURL = `ws://localhost:${port}/ws`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

async function waitFor(fn, timeout = 3000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (fn()) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error(`waitFor timed out after ${timeout}ms`);
}

describe('HTTP API endpoints', () => {
  it('GET /api/hello returns styled HTML', async () => {
    const res = await fetch(`${baseURL}/api/hello`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Hello from the server!');
    expect(html).toMatch(/<div/);
  });

  it('GET /api/outer returns replacement button HTML', async () => {
    const res = await fetch(`${baseURL}/api/outer`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('I replaced the button!');
    expect(html).toMatch(/bg-violet-600/);
  });

  it('GET /api/text returns XSS payload as text/plain', async () => {
    const res = await fetch(`${baseURL}/api/text`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/text\/plain/);
    const text = await res.text();
    expect(text).toContain('<script>');
    expect(text).toContain('onerror');
  });

  it('GET /api/items returns HTML with a task item', async () => {
    const res = await fetch(`${baseURL}/api/items`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toMatch(/<div/);
    expect(html).toMatch(/class="flex items-center/);
  });

  it('GET /api/broadcast returns timestamped HTML', async () => {
    const res = await fetch(`${baseURL}/api/broadcast`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Updated');
  });

  it('GET /api/echo-headers echoes x-* and authorization headers', async () => {
    const res = await fetch(`${baseURL}/api/echo-headers`, {
      headers: {
        'x-custom-header': 'hello',
        authorization: 'Bearer TOKEN',
      },
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json['x-custom-header']).toBe('hello');
    expect(json.authorization).toBe('Bearer TOKEN');
  });

  it('GET /api/error returns 500', async () => {
    const res = await fetch(`${baseURL}/api/error`);
    expect(res.status).toBe(500);
  });

  it('POST /api/submit echoes the request body as HTML', async () => {
    const res = await fetch(`${baseURL}/api/submit`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'test', count: 7 }),
    });
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Server received:');
    expect(html).toContain('"name"');
    expect(html).toContain('test');
  });

  it('GET /api/echo echoes the key query param', async () => {
    const res = await fetch(`${baseURL}/api/echo?key=myKey`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('myKey');
  });

  it('GET /api/mouse-echo echoes the button query param', async () => {
    const res = await fetch(`${baseURL}/api/mouse-echo?button=left`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('left');
  });
});

describe('Stream endpoint', () => {
  it('delivers all 8 messages in order ending with Done!', async () => {
    const res = await fetch(`${baseURL}/stream/demo`);
    const text = await res.text();
    const lines = text.trim().split('\n');
    expect(lines).toHaveLength(8);
    expect(lines[0]).toBe('Initializing system...');
    expect(lines[7]).toBe('Done!');
  }, 8000);

  it('sets correct content-type and headers', async () => {
    const res = await fetch(`${baseURL}/stream/demo`);
    expect(res.headers.get('content-type')).toMatch(/text\/plain/);
    expect(res.headers.get('cache-control')).toBe('no-cache');
    await res.text();
  }, 8000);
});

describe('SSE endpoint', () => {
  it('sends Connected event immediately', async () => {
    const res = await fetch(`${baseURL}/sse/demo`);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    let text = '';
    while (!text.includes('\n\n')) {
      const { value, done } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
    }
    reader.cancel();

    const match = text.match(/^data: (.+)$/m);
    expect(match).not.toBeNull();
    const data = JSON.parse(match[1]);
    expect(data.message).toBe('Connected');
  });

  it('sends sequential events with incrementing count', async () => {
    const res = await fetch(`${baseURL}/sse/demo`);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    const events = [];
    let buffer = '';
    while (events.length < 2) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const chunk = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const match = chunk.match(/^data: (.+)$/m);
        if (match) events.push(JSON.parse(match[1]));
      }
    }
    reader.cancel();

    expect(events.length).toBeGreaterThanOrEqual(2);
    expect(events[0].message).toBe('Connected');
    expect(events[1].count).toBe(1);
  }, 5000);
});

describe('WebSocket endpoint', () => {
  it('sends connected message on connect', async () => {
    const messages = [];
    const ws = new WebSocket(wsURL);
    ws.on('message', (data) => messages.push(JSON.parse(data.toString())));
    await new Promise((resolve) => ws.on('open', resolve));
    await new Promise((r) => setTimeout(r, 100));
    ws.close();

    expect(messages).toHaveLength(1);
    expect(messages[0].type).toBe('connected');
  });

  it('echoes JSON messages', async () => {
    const messages = [];
    const ws = new WebSocket(wsURL);
    ws.on('message', (data) => messages.push(JSON.parse(data.toString())));
    await new Promise((resolve) => ws.on('open', resolve));

    ws.send(JSON.stringify({ type: 'ping', value: 42 }));
    await new Promise((r) => setTimeout(r, 100));
    ws.close();

    expect(messages).toHaveLength(2);
    expect(messages[1].type).toBe('echo');
    expect(messages[1].data).toEqual({ type: 'ping', value: 42 });
  });

  it('echoes plain text messages', async () => {
    const messages = [];
    const ws = new WebSocket(wsURL);
    ws.on('message', (data) => messages.push(JSON.parse(data.toString())));
    await new Promise((resolve) => ws.on('open', resolve));

    ws.send('hello world');
    await new Promise((r) => setTimeout(r, 100));
    ws.close();

    expect(messages).toHaveLength(2);
    expect(messages[1].type).toBe('echo');
    expect(messages[1].data).toBe('hello world');
  });
});

describe('HTML pages', () => {
  const pages = [
    ['/', 'mate.js'],
    ['/basics.html', 'Basics'],
    ['/presenters.html', 'Presenters'],
    ['/modifiers.html', 'Modifiers'],
    ['/keyboard.html', 'Keyboard'],
    ['/realtime.html', 'Real-Time'],
    ['/extensions.html', 'Extensions'],
    ['/advanced.html', 'Advanced'],
  ];

  for (const [path, title] of pages) {
    it(`GET ${path} returns 200 with "${title}" in title`, async () => {
      const res = await fetch(`${baseURL}${path}`);
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toMatch(new RegExp(`<title>[^<]*${title}`, 'i'));
    });
  }
});

describe('Static assets', () => {
  it('GET /dist/main.js serves the bundle', async () => {
    const res = await fetch(`${baseURL}/dist/main.js`);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body.length).toBeGreaterThan(1000);
  });

  it('GET /src/mate.js serves the source', async () => {
    const res = await fetch(`${baseURL}/src/mate.js`);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('export');
  });

  it('GET /controllers.js serves controllers', async () => {
    const res = await fetch(`${baseURL}/controllers.js`);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('Counter');
  });

  it('GET /app.js serves app setup', async () => {
    const res = await fetch(`${baseURL}/app.js`);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('import');
  });
});

describe('E2E: mate.js + real server', () => {
  let teardown;
  let realFetch;

  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    realFetch = global.fetch;
    global.fetch = (url, opts) => {
      const fullUrl = typeof url === 'string' && url.startsWith('http') ? url : `${baseURL}${url}`;
      return realFetch(fullUrl, opts);
    };
  });

  afterEach(() => {
    if (teardown) {
      teardown();
      teardown = null;
    }
    global.fetch = realFetch;
    vi.restoreAllMocks();
  });

  it('click → @request:@inner → real DOM update from /api/hello', async () => {
    const btn = document.createElement('button');
    btn.setAttribute('mx-click', '@request:@inner');
    btn.setAttribute('mx-path', '/api/hello');
    document.body.appendChild(btn);

    teardown = mate();
    document.dispatchEvent(new Event('DOMContentLoaded'));

    btn.click();
    await waitFor(() => btn.innerHTML.includes('Hello from the server!'));

    expect(btn.innerHTML).toMatch(/<div/);
    expect(btn.innerHTML).toContain('Hello from the server!');
  });

  it('mx-load auto-fires and updates DOM from /api/broadcast', async () => {
    const div = document.createElement('div');
    div.setAttribute('mx-load', '@request:@inner');
    div.setAttribute('mx-path', '/api/broadcast');
    document.body.appendChild(div);

    teardown = mate();
    document.dispatchEvent(new Event('DOMContentLoaded'));

    await waitFor(() => div.innerHTML.includes('Updated'));

    expect(div.innerHTML).toContain('Updated');
  });

  it('form submit → POST → DOM shows received data', async () => {
    const form = document.createElement('form');
    form.setAttribute('mx-submit', '@request:@inner');
    form.setAttribute('mx-method', 'POST');
    form.setAttribute('mx-path', '/api/submit');

    const input = document.createElement('input');
    input.name = 'username';
    input.value = 'alice';
    form.appendChild(input);

    document.body.appendChild(form);

    teardown = mate();
    document.dispatchEvent(new Event('DOMContentLoaded'));

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await waitFor(() => form.innerHTML.includes('Server received:'));

    expect(form.innerHTML).toContain('Server received:');
    expect(form.innerHTML).toContain('alice');
  });

  it('@request:@id updates a separate target element', async () => {
    const btn = document.createElement('button');
    btn.setAttribute('mx-click', '@request:@id:target-div');
    btn.setAttribute('mx-path', '/api/hello');
    document.body.appendChild(btn);

    const target = document.createElement('div');
    target.id = 'target-div';
    document.body.appendChild(target);

    teardown = mate();
    document.dispatchEvent(new Event('DOMContentLoaded'));

    btn.click();
    await waitFor(() => target.innerHTML.includes('Hello from the server!'));

    expect(target.innerHTML).toContain('Hello from the server!');
  });

  it('network error dispatches mx-error on the trigger element', async () => {
    const btn = document.createElement('button');
    btn.setAttribute('mx-click', '@request:@inner');
    btn.setAttribute('mx-path', 'https://invalid.invalid/fail');
    document.body.appendChild(btn);

    const errors = [];
    btn.addEventListener('mx-error', (e) => errors.push(e));

    teardown = mate();
    document.dispatchEvent(new Event('DOMContentLoaded'));

    btn.click();
    await waitFor(() => errors.length > 0, 5000);

    expect(errors).toHaveLength(1);
    expect(errors[0].type).toBe('mx-error');
    expect(errors[0].detail.url).toBe('https://invalid.invalid/fail');
  });

  it('meta tag mx-header is included in server request', async () => {
    const meta = document.createElement('meta');
    meta.setAttribute('mx-header', '');
    meta.setAttribute('name', 'X-Test-Header');
    meta.setAttribute('content', 'playground-test-value');
    document.head.appendChild(meta);

    const btn = document.createElement('button');
    btn.setAttribute('mx-click', '@request:@inner');
    btn.setAttribute('mx-path', '/api/echo-headers');
    document.body.appendChild(btn);

    teardown = mate();
    document.dispatchEvent(new Event('DOMContentLoaded'));

    btn.click();
    await waitFor(() => btn.textContent.includes('x-test-header'), 3000);

    const json = JSON.parse(btn.textContent.trim());
    expect(json['x-test-header']).toBe('playground-test-value');
  });
});
