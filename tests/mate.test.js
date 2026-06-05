import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mate from '../src/mate.js';
import { attachEventHandler } from '../src/events.js';
import { ATTRIBUTES } from '../src/constants.js';
import { clearControllers } from '../src/controllers.js';

vi.mock('../src/events.js', () => ({
  attachEventHandler: vi.fn(),
}));

describe('mate', () => {
  let observerCallback;
  let observeMock;

  beforeEach(() => {
    observeMock = vi.fn();
    const constructorSpy = vi.fn();

    global.MutationObserver = class {
      constructor(callback) {
        constructorSpy();
        observerCallback = callback;
      }
      observe(element, options) {
        observeMock(element, options);
      }
      disconnect() {}
    };
    global.MutationObserver.mockConstructor = constructorSpy;

    // Mock window.TestController
    window.TestController = class {
      constructor(node) {
        this.node = node;
      }
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete window.TestController;
  });

  it('should initialize and observe document on DOMContentLoaded', () => {
    mate();

    const event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);

    expect(global.MutationObserver.mockConstructor).toHaveBeenCalled();
    expect(observeMock).toHaveBeenCalledWith(
      document,
      expect.objectContaining({
        childList: true,
        subtree: true,
      }),
    );
  });

  it('should attach event handlers to existing nodes using mx- syntax', () => {
    const node = document.createElement('div');
    node.setAttribute('mx-click', '@request:@inner');
    node.setAttribute('mx-path', '/test');
    document.body.appendChild(node);

    mate();
    document.dispatchEvent(new Event('DOMContentLoaded'));

    expect(attachEventHandler).toHaveBeenCalled();

    document.body.removeChild(node);
  });

  it('should initialize controllers', () => {
    const node = document.createElement('div');
    node.setAttribute(ATTRIBUTES.CONTROLLER, 'TestController');
    document.body.appendChild(node);

    mate();
    document.dispatchEvent(new Event('DOMContentLoaded'));

    expect(node.mxController).toBeInstanceOf(window.TestController);

    document.body.removeChild(node);
  });

  it('should handle mutations', () => {
    mate();
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const newNode = document.createElement('div');
    newNode.setAttribute('mx-mouseover', '@request:@inner');

    const mutations = [
      {
        type: 'childList',
        addedNodes: [newNode],
      },
    ];

    observerCallback(mutations);

    expect(attachEventHandler).toHaveBeenCalled();
  });

  it('RED: attribute mutations are ignored (only childList is processed)', () => {
    mate();
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const mutations = [
      {
        type: 'attributes',
        attributeName: 'mx-click',
        target: document.createElement('div'),
      },
    ];

    observerCallback(mutations);

    expect(attachEventHandler).not.toHaveBeenCalled();
  });

  describe('controller registry', () => {
    class RegistryController {
      constructor(node) {
        this.node = node;
        this.fromRegistry = true;
      }
    }

    afterEach(() => {
      if (typeof mate.removeController === 'function') {
        mate.removeController('RegistryController');
      }
      delete window.RegistryController;
    });

    it('RED: mate.registerController is a function', () => {
      expect(typeof mate.registerController).toBe('function');
    });

    it('RED: registered controller can be retrieved', () => {
      mate.registerController('RegistryController', RegistryController);

      expect(mate.hasController('RegistryController')).toBe(true);
      expect(mate.getController('RegistryController')).toBe(RegistryController);
    });

    it('RED: removeController clears the registry', () => {
      mate.registerController('RegistryController', RegistryController);
      mate.removeController('RegistryController');

      expect(mate.hasController('RegistryController')).toBe(false);
      expect(mate.getController('RegistryController')).toBeUndefined();
    });

    it('RED: mx-controller instantiates from registry (not window)', () => {
      mate.registerController('RegistryController', RegistryController);

      const node = document.createElement('div');
      node.setAttribute(ATTRIBUTES.CONTROLLER, 'RegistryController');
      document.body.appendChild(node);

      mate();
      document.dispatchEvent(new Event('DOMContentLoaded'));

      expect(node.mxController).toBeInstanceOf(RegistryController);
      expect(node.mxController.fromRegistry).toBe(true);

      document.body.removeChild(node);
    });

    it('RED: registry takes precedence over window global', () => {
      class WindowController {
        constructor(node) {
          this.node = node;
          this.fromWindow = true;
        }
      }
      class PreferredController {
        constructor(node) {
          this.node = node;
          this.fromRegistry = true;
        }
      }
      window.WindowController = WindowController;
      mate.registerController('WindowController', PreferredController);

      const node = document.createElement('div');
      node.setAttribute(ATTRIBUTES.CONTROLLER, 'WindowController');
      document.body.appendChild(node);

      mate();
      document.dispatchEvent(new Event('DOMContentLoaded'));

      expect(node.mxController).toBeInstanceOf(PreferredController);
      expect(node.mxController.fromRegistry).toBe(true);

      document.body.removeChild(node);
      mate.removeController('WindowController');
    });

    it('RED: window fallback still works when controller not in registry (backward compat)', () => {
      class LegacyController {
        constructor(node) {
          this.node = node;
          this.legacy = true;
        }
      }
      window.LegacyController = LegacyController;

      const node = document.createElement('div');
      node.setAttribute(ATTRIBUTES.CONTROLLER, 'LegacyController');
      document.body.appendChild(node);

      mate();
      document.dispatchEvent(new Event('DOMContentLoaded'));

      expect(node.mxController).toBeInstanceOf(LegacyController);
      expect(node.mxController.legacy).toBe(true);

      document.body.removeChild(node);
      delete window.LegacyController;
    });

    it('clearControllers empties the registry', () => {
      class A { constructor() {} }
      mate.registerController('A', A);
      expect(mate.hasController('A')).toBe(true);

      clearControllers();

      expect(mate.hasController('A')).toBe(false);
    });

    it('mx-controller with unregistered name does not throw and sets no mxController', () => {
      const node = document.createElement('div');
      node.setAttribute(ATTRIBUTES.CONTROLLER, 'DoesNotExist');
      document.body.appendChild(node);

      expect(() => {
        mate();
        document.dispatchEvent(new Event('DOMContentLoaded'));
      }).not.toThrow();

      expect(node.mxController).toBeUndefined();
      document.body.removeChild(node);
    });
  });

  describe('teardown', () => {
    let disconnectMock;

    beforeEach(() => {
      disconnectMock = vi.fn();
      global.MutationObserver = class {
        constructor(callback) {
          observerCallback = callback;
        }
        observe() {}
        disconnect() {
          disconnectMock();
        }
      };
    });

    it('RED: mate() returns a teardown function', () => {
      const teardown = mate();
      expect(typeof teardown).toBe('function');
    });

    it('RED: teardown disconnects the MutationObserver', () => {
      const teardown = mate();
      document.dispatchEvent(new Event('DOMContentLoaded'));

      expect(disconnectMock).not.toHaveBeenCalled();

      teardown();

      expect(disconnectMock).toHaveBeenCalledTimes(1);
    });

    it('RED: after teardown, new mutations are not processed', () => {
      const teardown = mate();
      document.dispatchEvent(new Event('DOMContentLoaded'));

      teardown();

      attachEventHandler.mockClear();
      const newNode = document.createElement('div');
      newNode.setAttribute('mx-click', '@request:@inner');
      observerCallback([{ type: 'childList', addedNodes: [newNode] }]);

      expect(attachEventHandler).not.toHaveBeenCalled();
    });
  });
});
