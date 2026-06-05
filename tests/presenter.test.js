import { describe, it, expect, vi, beforeEach } from 'vitest';
import { present, registerPresenter, getPresenter, hasPresenter } from '../src/presenter.js';

describe('presenter', () => {
  let node;
  let response;

  beforeEach(() => {
    node = document.createElement('div');
    response = {
      text: vi.fn().mockResolvedValue('<p>content</p>'),
    };
  });

  it('should default to innerHTML if no presentation provided', async () => {
    await present(node, response);
    expect(node.innerHTML).toBe('<p>content</p>');
  });

  it('should handle @inner', async () => {
    await present(node, response, '@inner');
    expect(node.innerHTML).toBe('<p>content</p>');
  });

  it('should handle @outer', async () => {
    // outerHTML requires the node to have a parent
    const parent = document.createElement('div');
    parent.appendChild(node);

    await present(node, response, '@outer');

    expect(parent.innerHTML).toBe('<p>content</p>');
  });

  it('should handle @id', async () => {
    const target = document.createElement('div');
    target.id = 'target-id';
    document.body.appendChild(target);

    await present(node, response, '@id', 'target-id');

    expect(target.innerHTML).toBe('<p>content</p>');
    document.body.removeChild(target);
  });

  it('should handle @class', async () => {
    const target1 = document.createElement('div');
    target1.className = 'target-class';
    const target2 = document.createElement('div');
    target2.className = 'target-class';
    document.body.appendChild(target1);
    document.body.appendChild(target2);

    await present(node, response, '@class', 'target-class');

    expect(target1.innerHTML).toBe('<p>content</p>');
    expect(target2.innerHTML).toBe('<p>content</p>');

    document.body.removeChild(target1);
    document.body.removeChild(target2);
  });

  it('should handle @controller', async () => {
    const mockController = {
      update: vi.fn(),
    };
    node.mxController = mockController;

    await present(node, response, '@controller', 'update');

    expect(mockController.update).toHaveBeenCalledWith(response);
  });

  it('should handle @append', async () => {
    node.innerHTML = '<span>existing</span>';

    await present(node, response, '@append');

    expect(node.innerHTML).toBe('<span>existing</span><p>content</p>');
  });

  it('should handle @prepend', async () => {
    node.innerHTML = '<span>existing</span>';

    await present(node, response, '@prepend');

    expect(node.innerHTML).toBe('<p>content</p><span>existing</span>');
  });

  it('RED: @id with missing target logs warning and does not throw', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(present(node, response, '@id', 'nonexistent-id')).resolves.not.toThrow();

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('nonexistent-id'));
    warnSpy.mockRestore();
  });

  it('RED: @id:@outer awaits outer() — rejection propagates', async () => {
    const parent = document.createElement('div');
    parent.appendChild(node);
    document.body.appendChild(parent);

    const target = document.createElement('div');
    target.id = 'reject-target';
    document.body.appendChild(target);

    const rejectingResponse = {
      text: vi.fn().mockRejectedValue(new Error('network failure')),
    };

    await expect(present(node, rejectingResponse, '@id', 'reject-target', 'outer')).rejects.toThrow(
      'network failure',
    );

    document.body.removeChild(target);
    document.body.removeChild(parent);
  });

  it('RED: @id:@inner awaits inner() — rejection propagates', async () => {
    const target = document.createElement('div');
    target.id = 'reject-inner-target';
    document.body.appendChild(target);

    const rejectingResponse = {
      text: vi.fn().mockRejectedValue(new Error('decode error')),
    };

    await expect(
      present(node, rejectingResponse, '@id', 'reject-inner-target', 'inner'),
    ).rejects.toThrow('decode error');

    document.body.removeChild(target);
  });

  describe('@text (XSS-safe)', () => {
    it('RED: sets textContent instead of innerHTML', async () => {
      await present(node, response, '@text');
      expect(node.textContent).toBe('<p>content</p>');
      expect(node.querySelector('p')).toBeNull();
    });

    it('RED: does not execute embedded script tags', async () => {
      const xssPayload = { text: vi.fn().mockResolvedValue('<script>alert("XSS")</script>') };
      await present(node, xssPayload, '@text');
      expect(node.textContent).toBe('<script>alert("XSS")</script>');
      expect(node.querySelectorAll('script')).toHaveLength(0);
    });

    it('RED: does not trigger onerror handlers', async () => {
      const xssPayload = {
        text: vi.fn().mockResolvedValue('<img src=x onerror="alert(1)">'),
      };
      await present(node, xssPayload, '@text');
      expect(node.textContent).toBe('<img src=x onerror="alert(1)">');
      expect(node.querySelectorAll('img')).toHaveLength(0);
    });

    it('RED: @id:target:text sets textContent on remote element', async () => {
      const target = document.createElement('div');
      target.id = 'text-target';
      document.body.appendChild(target);

      await present(node, response, '@id', 'text-target', 'text');

      expect(target.textContent).toBe('<p>content</p>');
      expect(target.querySelector('p')).toBeNull();

      document.body.removeChild(target);
    });

    it('RED: @class:klass:text sets textContent on multiple elements', async () => {
      const a = document.createElement('div');
      a.className = 'text-klass';
      const b = document.createElement('div');
      b.className = 'text-klass';
      document.body.appendChild(a);
      document.body.appendChild(b);

      await present(node, response, '@class', 'text-klass', 'text');

      expect(a.textContent).toBe('<p>content</p>');
      expect(b.textContent).toBe('<p>content</p>');

      document.body.removeChild(a);
      document.body.removeChild(b);
    });
  });

  describe('registry API', () => {
    it('registerPresenter adds a new presenter', async () => {
      const custom = vi.fn().mockResolvedValue(undefined);
      registerPresenter('@custom-test', custom);

      expect(hasPresenter('@custom-test')).toBe(true);
      expect(getPresenter('@custom-test')).toBe(custom);

      await present(node, response, '@custom-test');
      expect(custom).toHaveBeenCalledWith(node, response, undefined, undefined);
    });

    it('hasPresenter returns false for unregistered names', () => {
      expect(hasPresenter('@does-not-exist')).toBe(false);
    });

    it('getPresenter returns undefined for unregistered names', () => {
      expect(getPresenter('@does-not-exist')).toBeUndefined();
    });
  });

  describe('unknown presenter fallback', () => {
    it('warns and falls back to @inner when presenter not found', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await present(node, response, '@bogus');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('@bogus'));
      expect(node.innerHTML).toBe('<p>content</p>');
      consoleSpy.mockRestore();
    });
  });

  describe('@class with option=outer', () => {
    it('replaces outerHTML on all matching elements when option is outer', async () => {
      const a = document.createElement('span');
      a.className = 'outer-klass';
      const b = document.createElement('span');
      b.className = 'outer-klass';
      const parent = document.createElement('div');
      parent.appendChild(a);
      parent.appendChild(b);
      document.body.appendChild(parent);

      await present(node, response, '@class', 'outer-klass', 'outer');

      expect(parent.innerHTML).toBe('<p>content</p><p>content</p>');
      document.body.removeChild(parent);
    });
  });

  describe('@id with option=outer', () => {
    it('replaces outerHTML on the target element', async () => {
      const target = document.createElement('span');
      target.id = 'outer-id-target';
      const parent = document.createElement('div');
      parent.appendChild(target);
      document.body.appendChild(parent);

      await present(node, response, '@id', 'outer-id-target', 'outer');

      expect(parent.innerHTML).toBe('<p>content</p>');
      document.body.removeChild(parent);
    });
  });
});
