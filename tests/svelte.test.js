import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registerComponent, getComponent, hasComponent } from '../src/svelte.js';
import { present } from '../src/presenter.js';

vi.mock('svelte', () => ({
  mount: vi.fn(() => ({})),
  unmount: vi.fn(),
}));

describe('@svelte presenter', () => {
  let node;

  beforeEach(() => {
    node = document.createElement('div');
    document.body.appendChild(node);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should register and retrieve a Svelte component', () => {
    const Card = function Card() {};
    registerComponent('Card', Card);

    expect(hasComponent('Card')).toBe(true);
    expect(getComponent('Card')).toBe(Card);
  });

  it('should mount a registered component with JSON data', async () => {
    const { mount } = await import('svelte');
    const Card = function Card() {};
    registerComponent('Card', Card);

    const response = { text: () => Promise.resolve('{"name":"John"}') };
    await present(node, response, '@svelte', 'Card');

    expect(mount).toHaveBeenCalledWith(Card, {
      target: node,
      props: { data: { name: 'John' } },
    });
  });

  it('should pass raw text when response is not valid JSON', async () => {
    const { mount } = await import('svelte');
    const Display = function Display() {};
    registerComponent('Display', Display);

    const response = { text: () => Promise.resolve('<p>Hello</p>') };
    await present(node, response, '@svelte', 'Display');

    expect(mount).toHaveBeenCalledWith(Display, {
      target: node,
      props: { data: '<p>Hello</p>' },
    });
  });

  it('should unmount previous instance before remounting', async () => {
    const { mount, unmount } = await import('svelte');
    const mockInstance = {};
    mount.mockReturnValueOnce(mockInstance);

    const Counter = function Counter() {};
    registerComponent('Counter', Counter);

    const response1 = { text: () => Promise.resolve('1') };
    const response2 = { text: () => Promise.resolve('2') };

    await present(node, response1, '@svelte', 'Counter');
    await present(node, response2, '@svelte', 'Counter');

    expect(unmount).toHaveBeenCalledWith(mockInstance);
  });

  it('should warn when component is not registered', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const response = { text: () => Promise.resolve('{}') };
    await present(node, response, '@svelte', 'NonExistent');

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Svelte component "NonExistent" not registered'),
    );
    warnSpy.mockRestore();
  });
});
