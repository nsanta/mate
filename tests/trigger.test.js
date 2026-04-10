import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { executeActionOrCapability } from '../src/capabilities.js';
import { parseEventAttribute } from '../src/parser.js';

describe('@trigger action', () => {
  let node;

  beforeEach(() => {
    node = document.createElement('div');
    document.body.appendChild(node);
  });

  afterEach(() => {
    if (node && node.parentNode) {
      node.parentNode.removeChild(node);
    }
    document.body.innerHTML = '';
  });

  it('should dispatch an event on the node itself', async () => {
    const handler = vi.fn();
    node.addEventListener('custom-event', handler);

    const parsedEvent = parseEventAttribute('mx-click', '@trigger:custom-event');
    await executeActionOrCapability(parsedEvent, node, new Event('click'));

    expect(handler).toHaveBeenCalled();
    const dispatchedEvent = handler.mock.calls[0][0];
    expect(dispatchedEvent.type).toBe('custom-event');
    expect(dispatchedEvent.bubbles).toBe(true);
  });

  it('should bubble up the DOM tree', async () => {
    const parent = document.createElement('div');
    parent.appendChild(node);
    document.body.appendChild(parent);

    const handler = vi.fn();
    parent.addEventListener('bubble-event', handler);

    const parsedEvent = parseEventAttribute('mx-click', '@trigger:bubble-event');
    await executeActionOrCapability(parsedEvent, node, new Event('click'));

    expect(handler).toHaveBeenCalled();
  });

  it('should trigger an event on a specific target element by ID', async () => {
    const target = document.createElement('div');
    target.id = 'target-element';
    document.body.appendChild(target);

    const handler = vi.fn();
    target.addEventListener('target-event', handler);

    const parsedEvent = parseEventAttribute('mx-click', '@trigger:target-event:#target-element');
    await executeActionOrCapability(parsedEvent, node, new Event('click'));

    expect(handler).toHaveBeenCalled();
  });

  it('should warn and do nothing if no event name is provided', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    const parsedEvent = parseEventAttribute('mx-click', '@trigger');
    await executeActionOrCapability(parsedEvent, node, new Event('click'));

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('@trigger requires an event name'));
    consoleSpy.mockRestore();
  });

  it('should handle @trigger:submit on a form', async () => {
    const form = document.createElement('form');
    const input = document.createElement('input');
    form.appendChild(input);
    document.body.appendChild(form);

    const submitHandler = vi.fn((e) => e.preventDefault());
    form.addEventListener('submit', submitHandler);

    const parsedEvent = parseEventAttribute('mx-input', '@trigger:submit');
    await executeActionOrCapability(parsedEvent, input, new Event('input'));

    expect(submitHandler).toHaveBeenCalled();
  });
});
