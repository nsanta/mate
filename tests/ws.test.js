import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import actions from '../src/actions.js';
import { ATTRIBUTES } from '../src/constants.js';

const ws = actions['@ws'];

class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 0;
    this.binaryType = 'blob';
    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;
    this.onclose = null;
    this.send = vi.fn();
    this.close = vi.fn(() => {
      this.readyState = 3;
    });
    MockWebSocket.instances.push(this);
  }

  _fireOpen() {
    this.readyState = 1;
    if (this.onopen) this.onopen();
  }

  _fireMessage(data) {
    if (this.onmessage) this.onmessage({ data });
  }

  _fireError(ev) {
    if (this.onerror) this.onerror(ev);
  }

  _fireClose(code = 1006, reason = '') {
    this.readyState = 3;
    if (this.onclose) this.onclose({ code, reason });
  }
}
MockWebSocket.instances = [];
MockWebSocket.OPEN = 1;
MockWebSocket.CLOSED = 3;

describe('@ws action', () => {
  let node;

  beforeEach(() => {
    node = document.createElement('div');
    document.body.appendChild(node);
    MockWebSocket.instances = [];
    global.WebSocket = MockWebSocket;
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    if (node.parentNode) node.parentNode.removeChild(node);
    vi.restoreAllMocks();
    delete global.WebSocket;
  });

  describe('ws() entry function', () => {
    it('constructs WebSocket with provided url', async () => {
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, 'ws://example.com');
      await ws(node, { presentation: '@inner' }, {});

      expect(MockWebSocket.instances).toHaveLength(1);
      expect(MockWebSocket.instances[0].url).toBe('ws://example.com');
    });

    it('returns null and logs error when mx-path is missing', async () => {
      const result = await ws(node, { presentation: '@inner' }, {});

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('@ws requires mx-path attribute');
    });

    it('stores client on node._wsClient', async () => {
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, 'ws://example.com');
      const client = await ws(node, { presentation: '@inner' }, {});

      expect(node._wsClient).toBe(client);
    });

    it('closes previous client when invoked twice on same node', async () => {
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, 'ws://example.com');
      const first = await ws(node, { presentation: '@inner' }, {});
      const second = await ws(node, { presentation: '@inner' }, {});

      expect(second).not.toBe(first);
      expect(first._manualClose).toBe(true);
    });

    it('sets binaryType to "arraybuffer" on the WebSocket', async () => {
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, 'ws://example.com');
      await ws(node, { presentation: '@inner' }, {});

      expect(MockWebSocket.instances[0].binaryType).toBe('arraybuffer');
    });
  });

  describe('event handling', () => {
    it('updates DOM with "Connected" on open', async () => {
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, 'ws://example.com');
      await ws(node, { presentation: '@inner' }, {});

      MockWebSocket.instances[0]._fireOpen();

      expect(node.innerHTML).toBe('Connected');
    });

    it('JSON-parses object string messages and re-stringifies data', async () => {
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, 'ws://example.com');
      await ws(node, { presentation: '@append' }, {});
      MockWebSocket.instances[0]._fireOpen();

      MockWebSocket.instances[0]._fireMessage('{"hello":"world"}');

      expect(node.innerHTML).toBe('Connected{"hello":"world"}');
    });

    it('keeps non-JSON text messages as raw text', async () => {
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, 'ws://example.com');
      await ws(node, { presentation: '@append' }, {});
      MockWebSocket.instances[0]._fireOpen();

      MockWebSocket.instances[0]._fireMessage('plain text');

      expect(node.innerHTML).toBe('Connectedplain text');
    });

    it('RED: handles binary ArrayBuffer messages deterministically (no empty {} payload)', async () => {
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, 'ws://example.com');
      await ws(node, { presentation: '@append' }, {});
      MockWebSocket.instances[0]._fireOpen();

      const buffer = new ArrayBuffer(8);
      MockWebSocket.instances[0]._fireMessage(buffer);

      expect(node.innerHTML).toContain('"type":"binary"');
      expect(node.innerHTML).toContain('"size":8');
      expect(node.innerHTML).not.toContain('"data":{}');
    });

    it('handles number messages as string', async () => {
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, 'ws://example.com');
      await ws(node, { presentation: '@append' }, {});
      MockWebSocket.instances[0]._fireOpen();

      MockWebSocket.instances[0]._fireMessage(42);

      expect(node.innerHTML).toBe('Connected42');
    });

    it('fires error path on ws.onerror (updates DOM)', async () => {
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, 'ws://example.com');
      await ws(node, { presentation: '@inner' }, {});

      const err = { message: 'boom' };
      MockWebSocket.instances[0]._fireError(err);

      expect(node.innerHTML).not.toBe('');
    });

    it('fires closed path on ws.onclose (updates DOM)', async () => {
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, 'ws://example.com');
      await ws(node, { presentation: '@inner' }, {});

      MockWebSocket.instances[0]._fireClose(1000, 'normal');

      expect(node.innerHTML).not.toBe('');
    });
  });

  describe('send()', () => {
    it('stringifies object payload via JSON.stringify', async () => {
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, 'ws://example.com');
      const client = await ws(node, { presentation: '@inner' }, {});
      MockWebSocket.instances[0]._fireOpen();

      client.send({ message: 'hello' });

      expect(MockWebSocket.instances[0].send).toHaveBeenCalledWith('{"message":"hello"}');
    });

    it('passes string payload as-is', async () => {
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, 'ws://example.com');
      const client = await ws(node, { presentation: '@inner' }, {});
      MockWebSocket.instances[0]._fireOpen();

      client.send('raw string');

      expect(MockWebSocket.instances[0].send).toHaveBeenCalledWith('raw string');
    });

    it('does not send when WebSocket is not OPEN', async () => {
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, 'ws://example.com');
      const client = await ws(node, { presentation: '@inner' }, {});

      client.send('dropped');

      expect(MockWebSocket.instances[0].send).not.toHaveBeenCalled();
    });
  });

  describe('close()', () => {
    it('sets _manualClose flag', async () => {
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, 'ws://example.com');
      const client = await ws(node, { presentation: '@inner' }, {});

      client.close();

      expect(client._manualClose).toBe(true);
    });

    it('calls ws.close() and clears ws reference', async () => {
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, 'ws://example.com');
      const client = await ws(node, { presentation: '@inner' }, {});
      const mockWs = MockWebSocket.instances[0];

      client.close();

      expect(mockWs.close).toHaveBeenCalled();
      expect(client.ws).toBeNull();
    });

    it('prevents reconnection after close', async () => {
      vi.useFakeTimers();
      try {
        node.setAttribute(ATTRIBUTES.REQUEST_PATH, 'ws://example.com');
        const client = await ws(node, { presentation: '@inner' }, {});

        client.close();
        const before = MockWebSocket.instances.length;

        client._scheduleReconnectIfNeeded(node, {});
        vi.advanceTimersByTime(60000);

        expect(MockWebSocket.instances.length).toBe(before);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('reconnection', () => {
    it('schedules reconnect after abnormal close (not _manualClose)', async () => {
      vi.useFakeTimers();
      try {
        node.setAttribute(ATTRIBUTES.REQUEST_PATH, 'ws://example.com');
        await ws(node, { presentation: '@inner' }, {});

        MockWebSocket.instances[0]._fireClose(1006, 'abnormal');
        vi.advanceTimersByTime(60000);

        expect(MockWebSocket.instances.length).toBeGreaterThan(1);
      } finally {
        vi.useRealTimers();
      }
    });

    it('applies exponential backoff (delay grows)', async () => {
      vi.useFakeTimers();
      try {
        node.setAttribute(ATTRIBUTES.REQUEST_PATH, 'ws://example.com');
        const client = await ws(node, { presentation: '@inner' }, {});

        const initialDelay = client._reconnectDelay;
        MockWebSocket.instances[0]._fireClose(1006);
        vi.advanceTimersByTime(60000);

        expect(client._reconnectDelay).toBeGreaterThanOrEqual(initialDelay);
      } finally {
        vi.useRealTimers();
      }
    });

    it('resets backoff on successful reconnect', async () => {
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, 'ws://example.com');
      const client = await ws(node, { presentation: '@inner' }, {});

      client._reconnectDelay = 10000;
      MockWebSocket.instances[0]._fireOpen();

      expect(client._reconnectDelay).toBeLessThan(10000);
    });
  });

  describe('teardown on re-connect', () => {
    it('nulls ws reference on close (handler teardown happens on subsequent connect)', async () => {
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, 'ws://example.com');
      const client = await ws(node, { presentation: '@inner' }, {});

      client.close();

      expect(client.ws).toBeNull();
      expect(client._manualClose).toBe(true);
    });
  });
});
