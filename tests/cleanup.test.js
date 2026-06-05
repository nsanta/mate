import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mate from '../src/mate.js';
import actions from '../src/actions.js';
import { ATTRIBUTES } from '../src/constants.js';

const ws = actions['@ws'];
const sse = actions['@sse'];
const stream = actions['@stream'];

class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 0;
    this.binaryType = 'blob';
    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;
    this.onclose = null;
    this.close = vi.fn(() => {
      this.readyState = 3;
    });
  }
}
MockWebSocket.OPEN = 1;

class MockEventSource {
  constructor(url) {
    this.url = url;
    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;
    this.close = vi.fn();
  }
}

describe('connection cleanup on teardown (R1)', () => {
  let teardown;
  let node;

  beforeEach(() => {
    global.MutationObserver = class {
      observe() {}
      disconnect() {}
    };

    global.WebSocket = MockWebSocket;
    global.EventSource = MockEventSource;

    teardown = mate();

    node = document.createElement('div');
    document.body.appendChild(node);
    node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/test');
  });

  afterEach(() => {
    if (teardown) teardown();
    document.body.innerHTML = '';
    delete global.WebSocket;
    delete global.EventSource;
  });

  it('RED: teardown closes active WebSocket clients', async () => {
    await ws(node, { presentation: '@inner' });
    const client = node._wsClient;
    const mockWs = client.ws;

    teardown();
    teardown = null;

    expect(mockWs.close).toHaveBeenCalled();
  });

  it('RED: teardown stops active SSE clients', async () => {
    await sse(node, { presentation: '@inner' });
    const client = node._sseClient;
    const mockEs = client._es;
    expect(mockEs).toBeDefined();

    teardown();
    teardown = null;

    expect(mockEs.close).toHaveBeenCalled();
  });

  it('RED: teardown aborts active stream controllers', async () => {
    let capturedController;
    global.AbortController = class {
      constructor() {
        this.signal = {};
        this.abort = vi.fn();
        capturedController = this;
      }
    };

    let readResolve;
    global.fetch = vi.fn().mockImplementation(() => {
      return new Promise((resolve) => {
        readResolve = resolve;
      });
    });

    const streamPromise = stream(node, { presentation: '@inner' });

    teardown();
    teardown = null;

    expect(capturedController.abort).toHaveBeenCalled();

    readResolve?.({
      ok: true,
      body: { getReader: () => ({ read: () => Promise.resolve({ done: true }) }) },
    });
    await streamPromise;
    delete global.AbortController;
  });

  it('RED: teardown cleans up multiple connections on different nodes', async () => {
    const nodeA = document.createElement('div');
    nodeA.setAttribute(ATTRIBUTES.REQUEST_PATH, '/a');
    document.body.appendChild(nodeA);

    const nodeB = document.createElement('div');
    nodeB.setAttribute(ATTRIBUTES.REQUEST_PATH, '/b');
    document.body.appendChild(nodeB);

    await ws(nodeA, { presentation: '@inner' });
    await sse(nodeB, { presentation: '@inner' });

    const mockWs = nodeA._wsClient.ws;
    const sseEs = nodeB._sseClient._es;

    teardown();
    teardown = null;

    expect(mockWs.close).toHaveBeenCalled();
    expect(sseEs.close).toHaveBeenCalled();
  });

  it('RED: second teardown is a no-op (cleanups already ran)', async () => {
    await ws(node, { presentation: '@inner' });
    const client = node._wsClient;
    const mockWs = client.ws;

    teardown();
    mockWs.close.mockClear();

    teardown();

    expect(mockWs.close).not.toHaveBeenCalled();
  });
});
