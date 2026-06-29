import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { attachEventHandler } from '../src/events.js';
import { executeActionOrCapability } from '../src/capabilities.js';
import { parseEventAttribute } from '../src/parser.js';

vi.mock('../src/capabilities.js', () => ({
  executeActionOrCapability: vi.fn(),
}));

function createKeyboardEvent(key, props = {}) {
  const event = new KeyboardEvent('keydown', { key, ...props });
  return event;
}

function createMouseEvent(button, props = {}) {
  const event = new MouseEvent('click', { button, ...props });
  return event;
}

describe('key name modifiers', () => {
  let node;

  beforeEach(() => {
    node = document.createElement('div');
    vi.clearAllMocks();
  });

  it('should fire handler only on Enter key with .enter modifier', async () => {
    const parsedEvent = parseEventAttribute('mx-keydown.enter', '@request:@inner');
    await attachEventHandler(node, parsedEvent);

    node.dispatchEvent(createKeyboardEvent('Enter'));
    expect(executeActionOrCapability).toHaveBeenCalledTimes(1);

    vi.clearAllMocks();

    node.dispatchEvent(createKeyboardEvent('a'));
    expect(executeActionOrCapability).not.toHaveBeenCalled();
  });

  it('should fire handler only on Tab key with .tab modifier', async () => {
    const parsedEvent = parseEventAttribute('mx-keydown.tab', '@request:@inner');
    await attachEventHandler(node, parsedEvent);

    node.dispatchEvent(createKeyboardEvent('Tab'));
    expect(executeActionOrCapability).toHaveBeenCalledTimes(1);

    vi.clearAllMocks();

    node.dispatchEvent(createKeyboardEvent('Enter'));
    expect(executeActionOrCapability).not.toHaveBeenCalled();
  });

  it('should fire handler only on Escape key with .esc modifier', async () => {
    const parsedEvent = parseEventAttribute('mx-keydown.esc', '@request:@inner');
    await attachEventHandler(node, parsedEvent);

    node.dispatchEvent(createKeyboardEvent('Escape'));
    expect(executeActionOrCapability).toHaveBeenCalledTimes(1);

    vi.clearAllMocks();

    node.dispatchEvent(createKeyboardEvent('a'));
    expect(executeActionOrCapability).not.toHaveBeenCalled();
  });

  it('should fire handler only on Space key with .space modifier', async () => {
    const parsedEvent = parseEventAttribute('mx-keydown.space', '@request:@inner');
    await attachEventHandler(node, parsedEvent);

    node.dispatchEvent(createKeyboardEvent(' '));
    expect(executeActionOrCapability).toHaveBeenCalledTimes(1);

    vi.clearAllMocks();

    node.dispatchEvent(createKeyboardEvent('a'));
    expect(executeActionOrCapability).not.toHaveBeenCalled();
  });

  it('should parse key name modifier from attribute correctly', () => {
    const result = parseEventAttribute('mx-keydown.enter', '@request:@inner');
    expect(result.event).toBe('keydown');
    expect(result.modifiers).toContain('enter');
  });

  it('should fire on any key when no key name modifier is present', async () => {
    const parsedEvent = parseEventAttribute('mx-keydown', '@request:@inner');
    await attachEventHandler(node, parsedEvent);

    node.dispatchEvent(createKeyboardEvent('Enter'));
    node.dispatchEvent(createKeyboardEvent('a'));
    node.dispatchEvent(createKeyboardEvent('Escape'));

    expect(executeActionOrCapability).toHaveBeenCalledTimes(3);
  });
});

describe('system key modifiers', () => {
  let node;

  beforeEach(() => {
    node = document.createElement('div');
    vi.clearAllMocks();
  });

  it('should fire handler only when Ctrl is held with .ctrl modifier', async () => {
    const parsedEvent = parseEventAttribute('mx-keydown.ctrl', '@request:@inner');
    await attachEventHandler(node, parsedEvent);

    node.dispatchEvent(createKeyboardEvent('a', { ctrlKey: true }));
    expect(executeActionOrCapability).toHaveBeenCalledTimes(1);

    vi.clearAllMocks();

    node.dispatchEvent(createKeyboardEvent('a', { ctrlKey: false }));
    expect(executeActionOrCapability).not.toHaveBeenCalled();
  });

  it('should fire handler only when Shift is held with .shift modifier', async () => {
    const parsedEvent = parseEventAttribute('mx-keydown.shift', '@request:@inner');
    await attachEventHandler(node, parsedEvent);

    node.dispatchEvent(createKeyboardEvent('a', { shiftKey: true }));
    expect(executeActionOrCapability).toHaveBeenCalledTimes(1);

    vi.clearAllMocks();

    node.dispatchEvent(createKeyboardEvent('a', { shiftKey: false }));
    expect(executeActionOrCapability).not.toHaveBeenCalled();
  });

  it('should fire handler only when Alt is held with .alt modifier', async () => {
    const parsedEvent = parseEventAttribute('mx-keydown.alt', '@request:@inner');
    await attachEventHandler(node, parsedEvent);

    node.dispatchEvent(createKeyboardEvent('a', { altKey: true }));
    expect(executeActionOrCapability).toHaveBeenCalledTimes(1);

    vi.clearAllMocks();

    node.dispatchEvent(createKeyboardEvent('a', { altKey: false }));
    expect(executeActionOrCapability).not.toHaveBeenCalled();
  });

  it('should fire handler only when Meta is held with .meta modifier', async () => {
    const parsedEvent = parseEventAttribute('mx-keydown.meta', '@request:@inner');
    await attachEventHandler(node, parsedEvent);

    node.dispatchEvent(createKeyboardEvent('a', { metaKey: true }));
    expect(executeActionOrCapability).toHaveBeenCalledTimes(1);

    vi.clearAllMocks();

    node.dispatchEvent(createKeyboardEvent('a', { metaKey: false }));
    expect(executeActionOrCapability).not.toHaveBeenCalled();
  });

  it('should require both keys when .ctrl.shift are combined', async () => {
    const parsedEvent = parseEventAttribute('mx-keydown.ctrl.shift', '@request:@inner');
    await attachEventHandler(node, parsedEvent);

    node.dispatchEvent(createKeyboardEvent('a', { ctrlKey: true, shiftKey: true }));
    expect(executeActionOrCapability).toHaveBeenCalledTimes(1);

    vi.clearAllMocks();

    node.dispatchEvent(createKeyboardEvent('a', { ctrlKey: true, shiftKey: false }));
    expect(executeActionOrCapability).not.toHaveBeenCalled();

    vi.clearAllMocks();

    node.dispatchEvent(createKeyboardEvent('a', { ctrlKey: false, shiftKey: true }));
    expect(executeActionOrCapability).not.toHaveBeenCalled();
  });

  it('should combine key name and system key modifiers', async () => {
    const parsedEvent = parseEventAttribute('mx-keydown.enter.ctrl', '@request:@inner');
    await attachEventHandler(node, parsedEvent);

    node.dispatchEvent(createKeyboardEvent('Enter', { ctrlKey: true }));
    expect(executeActionOrCapability).toHaveBeenCalledTimes(1);

    vi.clearAllMocks();

    node.dispatchEvent(createKeyboardEvent('Enter', { ctrlKey: false }));
    expect(executeActionOrCapability).not.toHaveBeenCalled();

    vi.clearAllMocks();

    node.dispatchEvent(createKeyboardEvent('a', { ctrlKey: true }));
    expect(executeActionOrCapability).not.toHaveBeenCalled();
  });
});

describe('mouse button modifiers', () => {
  let node;

  beforeEach(() => {
    node = document.createElement('div');
    document.body.appendChild(node);
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (node.parentNode) node.parentNode.removeChild(node);
  });

  it('should fire handler only on left click with .left modifier', async () => {
    const parsedEvent = parseEventAttribute('mx-click.left', '@request:@inner');
    await attachEventHandler(node, parsedEvent);

    node.dispatchEvent(createMouseEvent(0));
    expect(executeActionOrCapability).toHaveBeenCalledTimes(1);

    vi.clearAllMocks();

    node.dispatchEvent(createMouseEvent(1));
    node.dispatchEvent(createMouseEvent(2));
    expect(executeActionOrCapability).not.toHaveBeenCalled();
  });

  it('should fire handler only on middle click with .middle modifier', async () => {
    const parsedEvent = parseEventAttribute('mx-click.middle', '@request:@inner');
    await attachEventHandler(node, parsedEvent);

    node.dispatchEvent(createMouseEvent(1));
    expect(executeActionOrCapability).toHaveBeenCalledTimes(1);

    vi.clearAllMocks();

    node.dispatchEvent(createMouseEvent(0));
    node.dispatchEvent(createMouseEvent(2));
    expect(executeActionOrCapability).not.toHaveBeenCalled();
  });

  it('should fire handler only on right click with .right modifier', async () => {
    const parsedEvent = parseEventAttribute('mx-click.right', '@request:@inner');
    await attachEventHandler(node, parsedEvent);

    node.dispatchEvent(createMouseEvent(2));
    expect(executeActionOrCapability).toHaveBeenCalledTimes(1);

    vi.clearAllMocks();

    node.dispatchEvent(createMouseEvent(0));
    node.dispatchEvent(createMouseEvent(1));
    expect(executeActionOrCapability).not.toHaveBeenCalled();
  });

  it('should fire on any mouse button when no modifier is present', async () => {
    const parsedEvent = parseEventAttribute('mx-click', '@request:@inner');
    await attachEventHandler(node, parsedEvent);

    node.dispatchEvent(createMouseEvent(0));
    node.dispatchEvent(createMouseEvent(1));
    node.dispatchEvent(createMouseEvent(2));

    expect(executeActionOrCapability).toHaveBeenCalledTimes(3);
  });

  it('should parse mouse button modifier from attribute correctly', () => {
    const result = parseEventAttribute('mx-click.right', '@request:@inner');
    expect(result.event).toBe('click');
    expect(result.modifiers).toContain('right');
  });
});

describe('modifier combinations with existing modifiers', () => {
  let node;

  beforeEach(() => {
    node = document.createElement('div');
    document.body.appendChild(node);
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (node.parentNode) node.parentNode.removeChild(node);
  });

  it('should combine .enter with .prevent', async () => {
    const parsedEvent = parseEventAttribute('mx-keydown.enter.prevent', '@request:@inner');
    await attachEventHandler(node, parsedEvent);

    const event = createKeyboardEvent('Enter');
    const preventSpy = vi.spyOn(event, 'preventDefault');
    node.dispatchEvent(event);

    expect(executeActionOrCapability).toHaveBeenCalledTimes(1);
    expect(preventSpy).toHaveBeenCalled();
  });

  it('should combine .right with .prevent', async () => {
    const parsedEvent = parseEventAttribute('mx-click.right.prevent', '@request:@inner');
    await attachEventHandler(node, parsedEvent);

    const event = createMouseEvent(2);
    const preventSpy = vi.spyOn(event, 'preventDefault');
    node.dispatchEvent(event);

    expect(executeActionOrCapability).toHaveBeenCalledTimes(1);
    expect(preventSpy).toHaveBeenCalled();
  });

  it('should combine .enter with .once', async () => {
    const parsedEvent = parseEventAttribute('mx-keydown.enter.once', '@request:@inner');
    await attachEventHandler(node, parsedEvent);

    node.dispatchEvent(createKeyboardEvent('Enter'));
    node.dispatchEvent(createKeyboardEvent('Enter'));

    expect(executeActionOrCapability).toHaveBeenCalledTimes(1);
  });

  it('should not interfere with .debounce modifier', () => {
    const result = parseEventAttribute('mx-keydown.enter.debounce.300ms', '@request:@inner');
    expect(result.modifiers).toContain('enter');
    expect(result.modifiers).toContain('debounce');
    expect(result.debounceMs).toBe(300);
  });

  it('should not interfere with .window modifier', async () => {
    const parsedEvent = parseEventAttribute('mx-keydown.enter.window', '@request:@inner');
    const windowSpy = vi.spyOn(window, 'addEventListener');

    await attachEventHandler(node, parsedEvent);

    expect(windowSpy).toHaveBeenCalledWith('keydown', expect.any(Function), expect.any(Object));
    windowSpy.mockRestore();
  });
});

describe('.stop and .stopImmediate modifier semantics', () => {
  let node;

  beforeEach(() => {
    node = document.createElement('div');
    document.body.appendChild(node);
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (node.parentNode) node.parentNode.removeChild(node);
  });

  it('RED: .stop alone calls stopPropagation but NOT stopImmediatePropagation', async () => {
    const parsedEvent = parseEventAttribute('mx-click.stop', '@request:@inner');
    await attachEventHandler(node, parsedEvent);

    const event = new Event('click');
    const stopSpy = vi.spyOn(event, 'stopPropagation');
    const stopImmediateSpy = vi.spyOn(event, 'stopImmediatePropagation');
    node.dispatchEvent(event);

    expect(stopSpy).toHaveBeenCalled();
    expect(stopImmediateSpy).not.toHaveBeenCalled();
  });

  it('RED: .stopImmediate alone calls stopImmediatePropagation', async () => {
    const parsedEvent = parseEventAttribute('mx-click.stopImmediate', '@request:@inner');
    await attachEventHandler(node, parsedEvent);

    const event = new Event('click');
    const stopImmediateSpy = vi.spyOn(event, 'stopImmediatePropagation');
    node.dispatchEvent(event);

    expect(stopImmediateSpy).toHaveBeenCalled();
  });

  it('RED: .stop.stopImmediate calls both stopPropagation and stopImmediatePropagation', async () => {
    const parsedEvent = parseEventAttribute('mx-click.stop.stopImmediate', '@request:@inner');
    await attachEventHandler(node, parsedEvent);

    const event = new Event('click');
    const stopSpy = vi.spyOn(event, 'stopPropagation');
    const stopImmediateSpy = vi.spyOn(event, 'stopImmediatePropagation');
    node.dispatchEvent(event);

    expect(stopSpy).toHaveBeenCalled();
    expect(stopImmediateSpy).toHaveBeenCalled();
  });
});
