import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import actions from '../src/actions.js';
import { ATTRIBUTES } from '../src/constants.js';

const sse = actions['@sse'];

class MockEventSource {
  constructor(url) {
    this.url = url;
    this.readyState = 0;
    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;
    this.close = vi.fn(() => {
      this.readyState = 2;
    });
    MockEventSource.instances.push(this);
  }

  _fireOpen() {
    this.readyState = 1;
    if (this.onopen) this.onopen();
  }

  _fireMessage(data) {
    if (this.onmessage) this.onmessage({ data });
  }

  _fireError() {
    if (this.onerror) this.onerror(new Event('error'));
  }
}
MockEventSource.instances = [];

describe('@sse action', () => {
  let node;

  beforeEach(() => {
    node = document.createElement('div');
    document.body.appendChild(node);
    MockEventSource.instances = [];
    global.EventSource = MockEventSource;
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    if (node.parentNode) node.parentNode.removeChild(node);
    vi.restoreAllMocks();
    delete global.EventSource;
  });

  describe('SSEClient lifecycle', () => {
    it('constructs EventSource with provided url', async () => {
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/sse');
      await sse(node, { presentation: '@inner' }, {});

      expect(MockEventSource.instances).toHaveLength(1);
      expect(MockEventSource.instances[0].url).toBe('/sse');
    });

    it('returns null and logs error when mx-path is missing', async () => {
      const result = await sse(node, { presentation: '@inner' }, {});

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('@sse requires mx-path attribute');
    });

    it('stores client on node._sseClient', async () => {
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/sse');
      const client = await sse(node, { presentation: '@inner' }, {});

      expect(node._sseClient).toBe(client);
    });

    it('stops previous client when invoked twice on same node', async () => {
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/sse');
      const first = await sse(node, { presentation: '@inner' }, {});
      const second = await sse(node, { presentation: '@inner' }, {});

      expect(second).not.toBe(first);
      expect(MockEventSource.instances).toHaveLength(2);
      expect(MockEventSource.instances[0].close).toHaveBeenCalled();
    });
  });

  describe('event handling', () => {
    it('updates DOM with "Connected" on open', async () => {
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/sse');
      await sse(node, { presentation: '@inner' }, {});

      MockEventSource.instances[0]._fireOpen();

      expect(node.innerHTML).toBe('Connected');
    });

    it('inserts plain text message via @append', async () => {
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/sse');
      await sse(node, { presentation: '@append' }, {});
      MockEventSource.instances[0]._fireOpen();

      MockEventSource.instances[0]._fireMessage('hello world');

      expect(node.innerHTML).toBe('Connectedhello world');
    });

    it('JSON-parses object messages and re-stringifies', async () => {
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/sse');
      await sse(node, { presentation: '@append' }, {});
      MockEventSource.instances[0]._fireOpen();

      MockEventSource.instances[0]._fireMessage('{"type":"ping","count":3}');

      expect(node.innerHTML).toBe('Connected{"type":"ping","count":3}');
    });

    it('keeps non-JSON text messages as raw text', async () => {
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/sse');
      await sse(node, { presentation: '@append' }, {});
      MockEventSource.instances[0]._fireOpen();

      MockEventSource.instances[0]._fireMessage('not json {');

      expect(node.innerHTML).toBe('Connectednot json {');
    });

    it('updates DOM with "Error connecting" on error', async () => {
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/sse');
      await sse(node, { presentation: '@inner' }, {});

      MockEventSource.instances[0]._fireError();

      expect(node.innerHTML).toBe('Error connecting');
    });
  });

  describe('stop()', () => {
    it('closes the underlying EventSource', async () => {
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/sse');
      const client = await sse(node, { presentation: '@inner' }, {});
      const es = MockEventSource.instances[0];

      client.stop();

      expect(es.close).toHaveBeenCalled();
    });

    it('RED: sets _manualClose flag to prevent reconnection after stop', async () => {
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/sse');
      const client = await sse(node, { presentation: '@inner' }, {});

      client.stop();

      expect(client._manualClose).toBe(true);
    });
  });

  describe('reconnection guard (Bug #3)', () => {
    it('RED: after stop(), simulated onerror does NOT schedule reconnect', async () => {
      vi.useFakeTimers();
      try {
        node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/sse');
        const client = await sse(node, { presentation: '@inner' }, {});

        client.stop();

        const instancesBefore = MockEventSource.instances.length;

        MockEventSource.instances[0]._fireError();
        vi.advanceTimersByTime(60000);

        expect(MockEventSource.instances.length).toBe(instancesBefore);
      } finally {
        vi.useRealTimers();
      }
    });

    it('RED: _scheduleReconnectIfNeeded early-returns when _manualClose is true', async () => {
      vi.useFakeTimers();
      try {
        node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/sse');
        const client = await sse(node, { presentation: '@inner' }, {});

        client._manualClose = true;
        const before = MockEventSource.instances.length;

        client._scheduleReconnectIfNeeded(node, {});
        vi.advanceTimersByTime(60000);

        expect(MockEventSource.instances.length).toBe(before);
      } finally {
        vi.useRealTimers();
      }
    });

    it('resets _manualClose on subsequent start()', async () => {
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/sse');
      const client = await sse(node, { presentation: '@inner' }, {});

      client.stop();
      expect(client._manualClose).toBe(true);

      client.start(node, { presentation: '@inner' });
      expect(client._manualClose).toBe(false);
    });
  });

  describe('exponential backoff', () => {
    it('uses jittered delay within [50%, 100%) of base reconnect delay', async () => {
      vi.useFakeTimers();
      try {
        node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/sse');
        const _client = await sse(node, { presentation: '@inner' }, {});

        const setTimeoutSpy = vi.spyOn(global, 'setTimeout');
        MockEventSource.instances[0]._fireError();

        expect(setTimeoutSpy).toHaveBeenCalledWith(
          expect.any(Function),
          expect.callThrough ? expect.any(Number) : expect.any(Number),
        );
        const delay = setTimeoutSpy.mock.calls[0][1];
        expect(delay).toBeGreaterThanOrEqual(500);
        expect(delay).toBeLessThanOrEqual(1000);
      } finally {
        vi.useRealTimers();
      }
    });

    it('resets backoff on successful open', async () => {
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/sse');
      const client = await sse(node, { presentation: '@inner' }, {});

      client._reconnectDelay = 10000;
      MockEventSource.instances[0]._fireOpen();

      expect(client._reconnectDelay).toBeLessThan(10000);
    });
  });

  describe('error closes EventSource to prevent native auto-reconnect (R2)', () => {
    it('RED: onerror closes the EventSource to suppress browser auto-reconnect', async () => {
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/sse');
      await sse(node, { presentation: '@inner' }, {});

      const es = MockEventSource.instances[0];
      es._fireError();

      expect(es.close).toHaveBeenCalled();
    });

    it('RED: onerror nullifies _es so native reconnect cannot fire events', async () => {
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/sse');
      const client = await sse(node, { presentation: '@inner' }, {});

      MockEventSource.instances[0]._fireError();

      expect(client._es).toBeNull();
    });

    it('after error, manual reconnect creates a NEW EventSource instance', async () => {
      vi.useFakeTimers();
      try {
        node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/sse');
        await sse(node, { presentation: '@inner' }, {});

        MockEventSource.instances[0]._fireError();
        vi.advanceTimersByTime(60000);

        expect(MockEventSource.instances.length).toBe(2);
        expect(MockEventSource.instances[1]).not.toBe(MockEventSource.instances[0]);
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
