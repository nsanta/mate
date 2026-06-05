import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mate from '../src/mate.js';

function mockFetchResponse(body = 'OK', status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(body),
    headers: { get: () => null },
  };
}

function initMate() {
  const teardown = mate();
  document.dispatchEvent(new Event('DOMContentLoaded'));
  return teardown;
}

function tick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('integration: full pipeline', () => {
  let teardown;

  beforeEach(() => {
    document.body.innerHTML = '';
    global.fetch = vi.fn();
  });

  afterEach(() => {
    if (teardown) {
      teardown();
      teardown = null;
    }
    vi.restoreAllMocks();
  });

  describe('basic @request flow', () => {
    it('clicking a button fires fetch and updates innerHTML', async () => {
      global.fetch.mockResolvedValue(mockFetchResponse('<p>loaded</p>'));

      const btn = document.createElement('button');
      btn.setAttribute('mx-click', '@request:@inner');
      btn.setAttribute('mx-path', '/api/data');
      document.body.appendChild(btn);

      teardown = initMate();

      btn.click();
      await tick();

      expect(global.fetch).toHaveBeenCalledWith('/api/data', { method: 'GET', headers: {} });
      expect(btn.innerHTML).toBe('<p>loaded</p>');
    });

    it('@request:@id:target updates a separate target element', async () => {
      global.fetch.mockResolvedValue(mockFetchResponse('hello target'));

      const btn = document.createElement('button');
      btn.setAttribute('mx-click', '@request:@id:target');
      btn.setAttribute('mx-path', '/api/data');
      document.body.appendChild(btn);

      const target = document.createElement('div');
      target.id = 'target';
      document.body.appendChild(target);

      teardown = initMate();

      btn.click();
      await tick();

      expect(target.innerHTML).toBe('hello target');
    });

    it('form submit sends POST with form data and updates innerHTML', async () => {
      global.fetch.mockResolvedValue(mockFetchResponse('saved'));

      const form = document.createElement('form');
      form.setAttribute('mx-submit', '@request:@inner');
      form.setAttribute('mx-method', 'POST');
      form.setAttribute('mx-path', '/api/save');

      const input = document.createElement('input');
      input.name = 'email';
      input.value = 'test@example.com';
      form.appendChild(input);

      const submitBtn = document.createElement('button');
      submitBtn.type = 'submit';
      form.appendChild(submitBtn);

      document.body.appendChild(form);

      teardown = initMate();

      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await tick();

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/save',
        expect.objectContaining({ method: 'POST' }),
      );
      expect(form.innerHTML).toContain('saved');
    });
  });

  describe('auto-load via mx-load', () => {
    it('element with mx-load fires immediately on init', async () => {
      global.fetch.mockResolvedValue(mockFetchResponse('initial'));

      const div = document.createElement('div');
      div.setAttribute('mx-load', '@request:@inner');
      div.setAttribute('mx-path', '/api/init');
      document.body.appendChild(div);

      teardown = initMate();

      await tick();

      expect(global.fetch).toHaveBeenCalledWith('/api/init', { method: 'GET', headers: {} });
      expect(div.innerHTML).toBe('initial');
    });
  });

  describe('MutationObserver picks up dynamic elements', () => {
    it('dynamically added button becomes interactive', async () => {
      global.fetch.mockResolvedValue(mockFetchResponse('dynamic'));

      teardown = initMate();
      await tick();

      const btn = document.createElement('button');
      btn.setAttribute('mx-click', '@request:@inner');
      btn.setAttribute('mx-path', '/api/dynamic');
      document.body.appendChild(btn);

      await tick();

      btn.click();
      await tick();

      expect(global.fetch).toHaveBeenCalledWith('/api/dynamic', { method: 'GET', headers: {} });
      expect(btn.innerHTML).toBe('dynamic');
    });
  });

  describe('controller integration', () => {
    it('@event:@controller:method calls the registered controller method', async () => {
      const calls = [];
      mate.registerController('Logger', class {
        constructor(node) { this.node = node; }
        log(...args) { calls.push(['log', args.length]); }
      });

      const div = document.createElement('div');
      div.setAttribute('mx-controller', 'Logger');
      div.setAttribute('mx-click', '@event:@controller:log');
      document.body.appendChild(div);

      teardown = initMate();
      await tick();

      div.click();
      await tick();

      expect(calls).toHaveLength(1);
      expect(calls[0][0]).toBe('log');

      mate.removeController('Logger');
    });
  });

  describe('@trigger event dispatch', () => {
    it('@trigger:custom fires a custom event that another handler picks up', async () => {
      const received = [];
      const target = document.createElement('div');
      target.id = 'trigger-target';
      target.addEventListener('ping', (e) => received.push(e.type));
      document.body.appendChild(target);

      const btn = document.createElement('button');
      btn.setAttribute('mx-click', '@trigger:ping:#trigger-target');
      document.body.appendChild(btn);

      teardown = initMate();
      await tick();

      btn.click();
      await tick();

      expect(received).toEqual(['ping']);
    });
  });

  describe('error handling (R3 integration)', () => {
    it('failed fetch dispatches mx-error event on the node', async () => {
      global.fetch.mockRejectedValue(new Error('boom'));

      const btn = document.createElement('button');
      btn.setAttribute('mx-click', '@request:@inner');
      btn.setAttribute('mx-path', '/api/broken');
      document.body.appendChild(btn);

      const errors = [];
      btn.addEventListener('mx-error', (e) => errors.push(e));

      teardown = initMate();
      await tick();

      btn.click();
      await tick();

      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('mx-error');
      expect(errors[0].detail.url).toBe('/api/broken');
      expect(errors[0].detail.error.message).toBe('boom');
    });

    it('failed fetch does not change innerHTML', async () => {
      global.fetch.mockRejectedValue(new Error('boom'));

      const btn = document.createElement('button');
      btn.innerHTML = 'original';
      btn.setAttribute('mx-click', '@request:@inner');
      btn.setAttribute('mx-path', '/api/broken');
      document.body.appendChild(btn);

      teardown = initMate();
      await tick();

      btn.click();
      await tick();

      expect(btn.innerHTML).toBe('original');
    });
  });

  describe('teardown (R1 integration)', () => {
    it('after teardown, dynamically added elements are not processed', async () => {
      teardown = initMate();
      await tick();

      teardown();
      teardown = null;

      const btn = document.createElement('button');
      btn.setAttribute('mx-click', '@request:@inner');
      btn.setAttribute('mx-path', '/api/after-teardown');
      document.body.appendChild(btn);

      global.fetch.mockClear();
      btn.click();
      await tick();

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('modifier integration', () => {
    it('.prevent on a link prevents navigation', async () => {
      const link = document.createElement('a');
      link.href = 'https://example.com';
      link.setAttribute('mx-click.prevent', '@request:@inner');
      link.setAttribute('mx-path', '/api/x');
      document.body.appendChild(link);

      global.fetch.mockResolvedValue(mockFetchResponse('ok'));

      teardown = initMate();
      await tick();

      const event = new Event('click', { bubbles: true, cancelable: true });
      link.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
    });

    it('.once fires only one fetch then no more', async () => {
      global.fetch.mockResolvedValue(mockFetchResponse('first'));

      const btn = document.createElement('button');
      btn.setAttribute('mx-click.once', '@request:@inner');
      btn.setAttribute('mx-path', '/api/once');
      document.body.appendChild(btn);

      teardown = initMate();
      await tick();

      btn.click();
      await tick();
      btn.click();
      await tick();
      btn.click();
      await tick();

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
