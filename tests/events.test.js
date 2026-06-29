import { describe, it, expect, vi, beforeEach } from 'vitest';
import { attachEventHandler } from '../src/events.js';
import { executeActionOrCapability } from '../src/capabilities.js';

// Mock dependencies
vi.mock('../src/capabilities.js', () => ({
  executeActionOrCapability: vi.fn(),
}));

describe('events', () => {
  let node;

  beforeEach(() => {
    node = document.createElement('div');
    vi.clearAllMocks();
  });

  describe('attachEventHandler', () => {
    it('should trigger immediately for load events', async () => {
      const parsedEvent = {
        event: 'load',
        modifiers: [],
        action: 'testAction',
      };

      await attachEventHandler(node, parsedEvent);

      expect(executeActionOrCapability).toHaveBeenCalledWith(parsedEvent, node, expect.any(Event));
    });

    it('should attach listeners for other events', async () => {
      const parsedEvent = {
        event: 'click',
        modifiers: [],
        action: 'testAction',
      };

      await attachEventHandler(node, parsedEvent);

      // Simulate click
      const clickEvent = new Event('click');
      node.dispatchEvent(clickEvent);

      expect(executeActionOrCapability).toHaveBeenCalledWith(parsedEvent, node, expect.any(Event));
    });

    it('should handle prevent modifier', async () => {
      const parsedEvent = {
        event: 'click',
        modifiers: ['prevent'],
        action: 'testAction',
      };

      await attachEventHandler(node, parsedEvent);

      const clickEvent = new Event('click');
      const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
      node.dispatchEvent(clickEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should automatically prevent default for submit events', async () => {
      const parsedEvent = {
        event: 'submit',
        modifiers: [],
        action: 'testAction',
      };

      await attachEventHandler(node, parsedEvent);

      const submitEvent = new Event('submit', { cancelable: true });
      const preventDefaultSpy = vi.spyOn(submitEvent, 'preventDefault');
      node.dispatchEvent(submitEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should handle once modifier', async () => {
      const parsedEvent = {
        event: 'click',
        modifiers: ['once'],
        action: 'testAction',
      };

      await attachEventHandler(node, parsedEvent);

      node.dispatchEvent(new Event('click'));
      node.dispatchEvent(new Event('click'));

      expect(executeActionOrCapability).toHaveBeenCalledTimes(1);
    });

    it('should handle .window modifier', async () => {
      const parsedEvent = {
        event: 'keydown',
        modifiers: ['window'],
        action: 'testAction',
      };

      const windowSpy = vi.spyOn(window, 'addEventListener');
      await attachEventHandler(node, parsedEvent);

      expect(windowSpy).toHaveBeenCalledWith('keydown', expect.any(Function), expect.any(Object));
      windowSpy.mockRestore();
    });

    it('should handle .outside modifier', async () => {
      const parsedEvent = {
        event: 'click',
        modifiers: ['outside'],
        action: 'testAction',
      };

      const docSpy = vi.spyOn(document, 'addEventListener');
      await attachEventHandler(node, parsedEvent);

      expect(docSpy).toHaveBeenCalledWith('click', expect.any(Function), expect.any(Object));

      docSpy.mockRestore();
    });

    it('should handle .outside with .once modifier', async () => {
      const parsedEvent = {
        event: 'click',
        modifiers: ['outside', 'once'],
        action: 'testAction',
      };

      const docAddSpy = vi.spyOn(document, 'addEventListener');
      const docRemoveSpy = vi.spyOn(document, 'removeEventListener');

      await attachEventHandler(node, parsedEvent);

      // get the handler
      const handler = docAddSpy.mock.calls[0][1];

      // Trigger outside
      handler({ target: document.body });

      expect(executeActionOrCapability).toHaveBeenCalledTimes(1);
      expect(docRemoveSpy).toHaveBeenCalledWith('click', handler, expect.any(Object));

      docAddSpy.mockRestore();
      docRemoveSpy.mockRestore();
    });
  });

  describe('.once modifier — listener reference correctness', () => {
    it('RED: .once.debounce handler fires exactly once after delay; second click within window is ignored', async () => {
      const parsedEvent = {
        event: 'click',
        modifiers: ['once', 'debounce'],
        action: 'testAction',
        debounceMs: 50,
      };

      await attachEventHandler(node, parsedEvent);

      node.dispatchEvent(new Event('click'));
      node.dispatchEvent(new Event('click'));

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(executeActionOrCapability).toHaveBeenCalledTimes(1);
    });

    it('RED: .once listener is actually removed (verified via addEventListener spy)', async () => {
      const parsedEvent = {
        event: 'click',
        modifiers: ['once'],
        action: 'testAction',
      };

      const addSpy = vi.spyOn(node, 'addEventListener');
      const removeSpy = vi.spyOn(node, 'removeEventListener');

      await attachEventHandler(node, parsedEvent);

      const options = addSpy.mock.calls[0][2];
      expect(options).toEqual(expect.objectContaining({ once: true }));

      const registeredHandler = addSpy.mock.calls[0][1];

      node.dispatchEvent(new Event('click'));

      for (const call of removeSpy.mock.calls) {
        const [, handler] = call;
        if (handler) {
          expect(handler).toBe(registeredHandler);
        }
      }

      addSpy.mockRestore();
      removeSpy.mockRestore();
    });
  });

  describe('load event with modifiers', () => {
    it('RED: mx-load.window attaches listener to window, not immediate fire', async () => {
      const parsedEvent = {
        event: 'load',
        modifiers: ['window'],
        action: 'testAction',
      };

      const windowSpy = vi.spyOn(window, 'addEventListener');
      vi.clearAllMocks();

      await attachEventHandler(node, parsedEvent);

      expect(windowSpy).toHaveBeenCalledWith('load', expect.any(Function), expect.any(Object));
      expect(executeActionOrCapability).not.toHaveBeenCalled();

      windowSpy.mockRestore();
    });

    it('RED: mx-load.document attaches listener to document, not immediate fire', async () => {
      const parsedEvent = {
        event: 'load',
        modifiers: ['document'],
        action: 'testAction',
      };

      const docSpy = vi.spyOn(document, 'addEventListener');
      vi.clearAllMocks();

      await attachEventHandler(node, parsedEvent);

      expect(docSpy).toHaveBeenCalledWith('load', expect.any(Function), expect.any(Object));
      expect(executeActionOrCapability).not.toHaveBeenCalled();

      docSpy.mockRestore();
    });

    it('RED: mx-load honors .self modifier (target must equal node)', async () => {
      const parsedEvent = {
        event: 'load',
        modifiers: ['self'],
        action: 'testAction',
      };

      await attachEventHandler(node, parsedEvent);

      expect(executeActionOrCapability).toHaveBeenCalledTimes(1);
      const firedEvent = executeActionOrCapability.mock.calls[0][2];
      expect(firedEvent.target).toBe(node);
    });

    it('mx-load.debounce honors the delay (action does not fire synchronously)', async () => {
      vi.clearAllMocks();
      const parsedEvent = {
        event: 'load',
        modifiers: ['debounce'],
        action: 'testAction',
        debounceMs: 80,
      };

      await attachEventHandler(node, parsedEvent);

      expect(executeActionOrCapability).not.toHaveBeenCalled();

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(executeActionOrCapability).toHaveBeenCalledTimes(1);
    });

    it('mx-load.once fires exactly once even when invoked twice via wrapper', async () => {
      vi.clearAllMocks();
      const parsedEvent = {
        event: 'load',
        modifiers: ['once'],
        action: 'testAction',
      };

      await attachEventHandler(node, parsedEvent);

      expect(executeActionOrCapability).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    it('should invoke handler immediately on first call and skip subsequent calls within window', async () => {
      vi.useFakeTimers();
      const parsedEvent = {
        event: 'scroll',
        modifiers: ['throttle'],
        throttleMs: 100,
        action: 'testAction',
      };

      await attachEventHandler(node, parsedEvent);
      node.dispatchEvent(new Event('scroll'));
      node.dispatchEvent(new Event('scroll'));
      node.dispatchEvent(new Event('scroll'));

      expect(executeActionOrCapability).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(150);
      node.dispatchEvent(new Event('scroll'));
      expect(executeActionOrCapability).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });
  });

  describe('key modifier non-match', () => {
    it('should NOT fire when key modifier is specified but event key differs', async () => {
      const parsedEvent = {
        event: 'keydown',
        modifiers: ['enter'],
        action: 'testAction',
      };

      await attachEventHandler(node, parsedEvent);
      const nonEnterEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      node.dispatchEvent(nonEnterEvent);

      expect(executeActionOrCapability).not.toHaveBeenCalled();
    });
  });

  describe('load event with .window modifier', () => {
    it('should attach load listener to window when .window modifier present', async () => {
      const parsedEvent = {
        event: 'load',
        modifiers: ['window'],
        action: 'testAction',
      };

      await attachEventHandler(node, parsedEvent);

      expect(executeActionOrCapability).not.toHaveBeenCalled();

      window.dispatchEvent(new Event('load'));

      expect(executeActionOrCapability).toHaveBeenCalledWith(
        parsedEvent,
        node,
        expect.any(Event),
      );
    });

    it('should attach load listener to document when .document modifier present', async () => {
      const parsedEvent = {
        event: 'load',
        modifiers: ['document'],
        action: 'testAction',
      };

      await attachEventHandler(node, parsedEvent);

      expect(executeActionOrCapability).not.toHaveBeenCalled();

      document.dispatchEvent(new Event('load'));

      expect(executeActionOrCapability).toHaveBeenCalledWith(
        parsedEvent,
        node,
        expect.any(Event),
      );
    });
  });
});
