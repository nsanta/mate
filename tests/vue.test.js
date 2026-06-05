import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registerComponent, getComponent, hasComponent } from '../src/vue.js';
import { present } from '../src/presenter.js';

vi.mock('vue', () => ({
  createApp: vi.fn(() => ({
    mount: vi.fn(),
    unmount: vi.fn(),
  })),
  h: vi.fn((component, props) => ({ component, props })),
}));

describe('@vue presenter', () => {
  let node;

  beforeEach(() => {
    node = document.createElement('div');
    document.body.appendChild(node);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should register and retrieve a Vue component', () => {
    const Card = { template: '<div />' };
    registerComponent('Card', Card);

    expect(hasComponent('Card')).toBe(true);
    expect(getComponent('Card')).toBe(Card);
  });

  it('should mount a Vue app with the registered component', async () => {
    const { createApp } = await import('vue');
    const mockMount = vi.fn();
    const mockUnmount = vi.fn();
    createApp.mockReturnValue({ mount: mockMount, unmount: mockUnmount });

    const Card = { template: '<div>{{ data.name }}</div>' };
    registerComponent('Card', Card);

    const response = { text: () => Promise.resolve('{"name":"John"}') };
    await present(node, response, '@vue', 'Card');

    expect(createApp).toHaveBeenCalled();
    expect(mockMount).toHaveBeenCalledWith(node);
  });

  it('should pass parsed JSON data as props via createApp', async () => {
    const { createApp } = await import('vue');
    createApp.mockReturnValue({ mount: vi.fn(), unmount: vi.fn() });

    const Card = { template: '<div />' };
    registerComponent('Card', Card);

    const response = { text: () => Promise.resolve('{"name":"John"}') };
    await present(node, response, '@vue', 'Card');

    expect(createApp).toHaveBeenCalled();
    const wrapperArg = createApp.mock.calls[0][0];
    expect(wrapperArg).toHaveProperty('render');
  });

  it('should unmount previous app before remounting', async () => {
    const { createApp } = await import('vue');
    const mockUnmount = vi.fn();
    createApp.mockReturnValue({ mount: vi.fn(), unmount: mockUnmount });

    registerComponent('Card', { template: '<div />' });

    const response1 = { text: () => Promise.resolve('1') };
    const response2 = { text: () => Promise.resolve('2') };

    await present(node, response1, '@vue', 'Card');
    await present(node, response2, '@vue', 'Card');

    expect(mockUnmount).toHaveBeenCalled();
  });

  it('should warn when component is not registered', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const response = { text: () => Promise.resolve('{}') };
    await present(node, response, '@vue', 'NonExistent');

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Vue component "NonExistent" not registered'),
    );
    warnSpy.mockRestore();
  });

  it('should use raw text when response is not valid JSON', async () => {
    const { createApp } = await import('vue');
    createApp.mockClear();
    createApp.mockReturnValue({ mount: vi.fn(), unmount: vi.fn() });

    registerComponent('Card', { template: '<div />' });

    const response = { text: () => Promise.resolve('plain text not json') };
    await present(node, response, '@vue', 'Card');

    const wrapperArg = createApp.mock.calls[0][0];
    expect(() => wrapperArg.render()).not.toThrow();
  });

  it('render function returns h() output', async () => {
    const { createApp, h } = await import('vue');
    createApp.mockClear();
    h.mockClear();
    h.mockReturnValueOnce('rendered-vnode');
    createApp.mockReturnValue({ mount: vi.fn(), unmount: vi.fn() });

    registerComponent('Card', { template: '<div />' });

    const response = { text: () => Promise.resolve('{"ok":true}') };
    await present(node, response, '@vue', 'Card');

    const wrapperArg = createApp.mock.calls[0][0];
    const result = wrapperArg.render();

    expect(result).toBe('rendered-vnode');
    expect(h).toHaveBeenCalledTimes(1);
  });
});
