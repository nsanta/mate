import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import actions from '../src/actions.js';
import { ATTRIBUTES } from '../src/constants.js';

const stream = actions['@stream'];

function encode(chunks) {
  return chunks.map((c) => new TextEncoder().encode(c));
}

function makeReader(chunkValues) {
  const encoded = encode(chunkValues);
  let i = 0;
  return {
    read: vi.fn(() => {
      if (i < encoded.length) {
        return Promise.resolve({ done: false, value: encoded[i++] });
      }
      return Promise.resolve({ done: true, value: null });
    }),
  };
}

function makeResponse(reader, ok = true) {
  return {
    ok,
    body: { getReader: () => reader },
  };
}

describe('@stream action', () => {
  let node;
  let fetchSpy;

  beforeEach(() => {
    node = document.createElement('div');
    document.body.appendChild(node);
    fetchSpy = vi.fn();
    global.fetch = fetchSpy;
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    if (node.parentNode) node.parentNode.removeChild(node);
    vi.restoreAllMocks();
  });

  describe('StreamResponse class', () => {
    it('chunks accumulate via append()', async () => {
      fetchSpy.mockResolvedValue(makeResponse(makeReader(['a\n', 'b\n'])));
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/s');

      const result = await stream(node, { presentation: '@inner' }, {});

      expect(result.chunks).toEqual(['a', 'b']);
    });

    it('text() returns concatenated chunks', async () => {
      fetchSpy.mockResolvedValue(makeResponse(makeReader(['hello\n', 'world\n'])));
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/s');

      const result = await stream(node, { presentation: '@inner' }, {});

      expect(await result.text()).toBe('helloworld');
    });

    it('complete() sets isComplete=true', async () => {
      fetchSpy.mockResolvedValue(makeResponse(makeReader(['x\n'])));
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/s');

      const result = await stream(node, { presentation: '@inner' }, {});

      expect(result.isComplete).toBe(true);
    });
  });

  describe('chunk parsing', () => {
    it('emits one DOM update per newline-delimited line (first replaces, subsequent append)', async () => {
      fetchSpy.mockResolvedValue(makeResponse(makeReader(['line1\nline2\nline3\n'])));
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/s');

      await stream(node, { presentation: '@inner' }, {});

      expect(node.innerHTML).toBe('line1line2line3');
    });

    it('buffers partial chunks across reads', async () => {
      fetchSpy.mockResolvedValue(makeResponse(makeReader(['par', 'tial\ncom', 'plete\n'])));
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/s');

      await stream(node, { presentation: '@inner' }, {});

      expect(node.innerHTML).toBe('partialcomplete');
    });

    it('flushes trailing buffer without newline at stream end', async () => {
      fetchSpy.mockResolvedValue(makeResponse(makeReader(['first\n', 'tail-no-newline'])));
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/s');

      const result = await stream(node, { presentation: '@inner' }, {});

      expect(result.chunks).toEqual(['first', 'tail-no-newline']);
    });

    it('handles empty stream (done immediately)', async () => {
      fetchSpy.mockResolvedValue(makeResponse(makeReader([])));
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/s');

      const result = await stream(node, { presentation: '@inner' }, {});

      expect(result.chunks).toEqual([]);
      expect(node.innerHTML).toBe('');
    });

    it('skips empty lines between newlines', async () => {
      fetchSpy.mockResolvedValue(makeResponse(makeReader(['a\n\nb\n'])));
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/s');

      const result = await stream(node, { presentation: '@inner' }, {});

      expect(result.chunks).toEqual(['a', 'b']);
    });
  });

  describe('presentation modes (stream context)', () => {
    it('@append inserts each chunk at end', async () => {
      fetchSpy.mockResolvedValue(makeResponse(makeReader(['one\n', 'two\n'])));
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/s');
      node.innerHTML = '<span>orig</span>';

      await stream(node, { presentation: '@append' }, {});

      expect(node.innerHTML).toBe('<span>orig</span>onetwo');
    });

    it('@prepend inserts each chunk at start (later chunks appear first)', async () => {
      fetchSpy.mockResolvedValue(makeResponse(makeReader(['one\n', 'two\n'])));
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/s');
      node.innerHTML = '<span>orig</span>';

      await stream(node, { presentation: '@prepend' }, {});

      expect(node.innerHTML).toBe('twoone<span>orig</span>');
    });

    it('@id writes to element by id (first replaces, subsequent append)', async () => {
      const target = document.createElement('div');
      target.id = 'stream-target';
      document.body.appendChild(target);

      try {
        fetchSpy.mockResolvedValue(makeResponse(makeReader(['a\n', 'b\n'])));
        node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/s');

        await stream(node, { presentation: '@id', target: 'stream-target' }, {});

        expect(target.innerHTML).toBe('ab');
      } finally {
        document.body.removeChild(target);
      }
    });

    it('first chunk replaces innerHTML, subsequent chunks append (default @inner behavior)', async () => {
      fetchSpy.mockResolvedValue(makeResponse(makeReader(['initial\n', 'more\n'])));
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/s');
      node.innerHTML = '<span>old</span>';

      await stream(node, { presentation: '@inner' }, {});

      expect(node.innerHTML).toBe('initialmore');
    });
  });

  describe('error handling', () => {
    it('returns null and logs error when mx-path is missing', async () => {
      const result = await stream(node, { presentation: '@inner' }, {});

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('@stream requires mx-path attribute');
    });

    it('logs "Stream error:" wrapper when HTTP response is not ok', async () => {
      fetchSpy.mockResolvedValue(makeResponse(makeReader([]), false));
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/s');

      const result = await stream(node, { presentation: '@inner' }, {});

      expect(console.error).toHaveBeenCalledWith(
        'Stream error:',
        expect.objectContaining({
          message: expect.stringContaining('Stream failed'),
        }),
      );
      expect(result.chunks).toEqual([]);
    });

    it('logs "Stream cancelled" on abort (not error)', async () => {
      const abortError = new Error('aborted');
      abortError.name = 'AbortError';
      fetchSpy.mockRejectedValue(abortError);
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/s');

      const result = await stream(node, { presentation: '@inner' }, {});

      expect(console.log).toHaveBeenCalledWith('Stream cancelled');
      expect(console.error).not.toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.chunks).toEqual([]);
    });

    it('logs error on non-abort stream failure', async () => {
      fetchSpy.mockRejectedValue(new Error('network down'));
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/s');

      await stream(node, { presentation: '@inner' }, {});

      expect(console.error).toHaveBeenCalledWith('Stream error:', expect.any(Error));
    });

    it('clears _streamAbortController after completion', async () => {
      fetchSpy.mockResolvedValue(makeResponse(makeReader(['x\n'])));
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/s');

      await stream(node, { presentation: '@inner' }, {});

      expect(node._streamAbortController).toBeNull();
    });
  });

  describe('abort', () => {
    it('exposes AbortController on node._streamAbortController', async () => {
      let capturedSignal;
      fetchSpy.mockImplementation((url, opts) => {
        capturedSignal = opts.signal;
        return Promise.resolve(makeResponse(makeReader(['x\n'])));
      });
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/s');

      await stream(node, { presentation: '@inner' }, {});

      expect(capturedSignal).toBeInstanceOf(AbortSignal);
    });

    it('passes AbortSignal to fetch', async () => {
      fetchSpy.mockResolvedValue(makeResponse(makeReader(['x\n'])));
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/s');

      await stream(node, { presentation: '@inner' }, {});

      expect(fetchSpy).toHaveBeenCalledWith(
        '/s',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        }),
      );
    });
  });

  describe('HTTP method and headers', () => {
    it('uses GET by default', async () => {
      fetchSpy.mockResolvedValue(makeResponse(makeReader(['x\n'])));
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/s');

      await stream(node, { presentation: '@inner' }, {});

      expect(fetchSpy).toHaveBeenCalledWith(
        '/s',
        expect.objectContaining({
          method: 'GET',
        }),
      );
    });

    it('honors mx-method attribute', async () => {
      fetchSpy.mockResolvedValue(makeResponse(makeReader(['x\n'])));
      node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/s');
      node.setAttribute(ATTRIBUTES.REQUEST_METHOD, 'POST');

      await stream(node, { presentation: '@inner' }, {});

      expect(fetchSpy).toHaveBeenCalledWith(
        '/s',
        expect.objectContaining({
          method: 'POST',
        }),
      );
    });

    it('includes meta headers in stream request', async () => {
      const meta = document.createElement('meta');
      meta.setAttribute(ATTRIBUTES.HEADER_META, '');
      meta.setAttribute('name', 'Authorization');
      meta.setAttribute('content', 'Bearer: STREAM');
      document.head.appendChild(meta);

      try {
        fetchSpy.mockResolvedValue(makeResponse(makeReader(['x\n'])));
        node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/s');

        await stream(node, { presentation: '@inner' }, {});

        expect(fetchSpy).toHaveBeenCalledWith(
          '/s',
          expect.objectContaining({
            headers: { Authorization: 'Bearer: STREAM' },
          }),
        );
      } finally {
        document.head.removeChild(meta);
      }
    });
  });
});
