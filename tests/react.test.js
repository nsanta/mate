import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registerComponent, getComponent, hasComponent } from '../src/react.js';
import { present } from '../src/presenter.js';

vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({
    render: vi.fn(),
    unmount: vi.fn(),
  })),
}));

describe('@react presenter', () => {
  let node;

  beforeEach(() => {
    node = document.createElement('div');
    document.body.appendChild(node);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should register and retrieve a React component', () => {
    const Card = () => null;
    registerComponent('Card', Card);

    expect(hasComponent('Card')).toBe(true);
    expect(getComponent('Card')).toBe(Card);
  });

  it('should render a registered component with JSON data', async () => {
    const { createRoot } = await import('react-dom/client');
    const mockRender = vi.fn();
    createRoot.mockReturnValue({ render: mockRender });

    const Card = (_props) => null;
    registerComponent('Card', Card);

    const response = { text: () => Promise.resolve('{"name":"John"}') };
    await present(node, response, '@react', 'Card');

    expect(mockRender).toHaveBeenCalled();
    const renderedElement = mockRender.mock.calls[0][0];
    expect(renderedElement.props.data).toEqual({ name: 'John' });
  });

  it('should pass raw text when response is not valid JSON', async () => {
    const { createRoot } = await import('react-dom/client');
    const mockRender = vi.fn();
    createRoot.mockReturnValue({ render: mockRender });

    const Display = (_props) => null;
    registerComponent('Display', Display);

    const response = { text: () => Promise.resolve('<p>Hello</p>') };
    await present(node, response, '@react', 'Display');

    expect(mockRender).toHaveBeenCalled();
    const renderedElement = mockRender.mock.calls[0][0];
    expect(renderedElement.props.data).toBe('<p>Hello</p>');
  });

  it('should reuse root on subsequent renders for the same node', async () => {
    const { createRoot } = await import('react-dom/client');
    const mockRender = vi.fn();
    createRoot.mockReturnValue({ render: mockRender });

    registerComponent('Counter', () => null);

    const response1 = { text: () => Promise.resolve('{"count":1}') };
    const response2 = { text: () => Promise.resolve('{"count":2}') };

    await present(node, response1, '@react', 'Counter');
    await present(node, response2, '@react', 'Counter');

    expect(mockRender).toHaveBeenCalledTimes(2);
  });

  it('should warn when component is not registered', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const response = { text: () => Promise.resolve('{"ok":true}') };
    await present(node, response, '@react', 'NonExistent');

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('React component "NonExistent" not registered'),
    );
    warnSpy.mockRestore();
  });
});
