import { MODIFIERS, KEY_MAP, SYSTEM_KEYS, MOUSE_BUTTONS } from './constants.js';
import { executeActionOrCapability } from './capabilities.js';

function applyModifiers(event, modifiers) {
  if (modifiers.includes(MODIFIERS.PREVENT)) {
    event.preventDefault();
  }
  if (modifiers.includes(MODIFIERS.STOP)) {
    event.stopPropagation();
  }
  if (modifiers.includes(MODIFIERS.STOP_IMMEDIATE)) {
    event.stopImmediatePropagation();
  }
}

function createDebouncedHandler(handler, wait) {
  let timeoutId = null;
  return function (event, ...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => handler.call(this, event, ...args), wait);
  };
}

function createThrottledHandler(handler, wait) {
  let lastTime = 0;
  return function (event, ...args) {
    const now = Date.now();
    if (now - lastTime >= wait) {
      lastTime = now;
      return handler.call(this, event, ...args);
    }
  };
}

function wrapHandlerWithModifiers(handler, parsedEvent) {
  const { event: eventName, modifiers, debounceMs, throttleMs } = parsedEvent;

  let wrappedHandler = handler;

  if (debounceMs) {
    wrappedHandler = createDebouncedHandler(wrappedHandler, debounceMs);
  }

  if (throttleMs) {
    wrappedHandler = createThrottledHandler(wrappedHandler, throttleMs);
  }

  return async (event, node) => {
    if (eventName === 'submit') {
      event.preventDefault();
    }
    applyModifiers(event, modifiers);

    if (modifiers.includes(MODIFIERS.SELF) && event.target !== node) {
      return;
    }

    if (!matchesKeyModifiers(event, modifiers)) {
      return;
    }

    if (!matchesSystemKeyModifiers(event, modifiers)) {
      return;
    }

    if (!matchesMouseModifiers(event, modifiers)) {
      return;
    }

    return wrappedHandler(event, node);
  };
}

function matchesKeyModifiers(event, modifiers) {
  const active = modifiers.filter((m) => m in KEY_MAP);
  if (active.length === 0) return true;
  return active.some((m) => event.key === KEY_MAP[m]);
}

function matchesSystemKeyModifiers(event, modifiers) {
  const active = modifiers.filter((m) => m in SYSTEM_KEYS);
  if (active.length === 0) return true;
  return active.every((m) => event[SYSTEM_KEYS[m]]);
}

function matchesMouseModifiers(event, modifiers) {
  const active = modifiers.filter((m) => m in MOUSE_BUTTONS);
  if (active.length === 0) return true;
  return active.some((m) => event.button === MOUSE_BUTTONS[m]);
}

function getEventTarget(node, modifiers) {
  if (modifiers.includes(MODIFIERS.WINDOW)) {
    return window;
  }
  if (modifiers.includes(MODIFIERS.DOCUMENT)) {
    return document;
  }
  return node;
}

export async function attachEventHandler(node, parsedEvent) {
  const { event, modifiers } = parsedEvent;

  const handler = async (originalEvent) => {
    const response = await executeActionOrCapability(parsedEvent, node, originalEvent);
    return response;
  };

  const wrappedHandler = wrapHandlerWithModifiers(handler, parsedEvent);

  if (event === 'load') {
    if (modifiers.includes(MODIFIERS.WINDOW) || modifiers.includes(MODIFIERS.DOCUMENT)) {
      const target = getEventTarget(node, modifiers);
      const loadHandler = () => {
        const fakeEvent = new Event('load');
        Object.defineProperty(fakeEvent, 'target', { value: node, configurable: true });
        wrappedHandler(fakeEvent, node);
      };
      target.addEventListener('load', loadHandler, { once: modifiers.includes(MODIFIERS.ONCE) });
      return;
    }

    const fakeEvent = new Event('load');
    Object.defineProperty(fakeEvent, 'target', { value: node, configurable: true });
    return wrappedHandler(fakeEvent, node);
  }

  const commonOptions = {
    capture: modifiers.includes(MODIFIERS.CAPTURE),
    passive: modifiers.includes(MODIFIERS.PASSIVE),
  };

  if (modifiers.includes(MODIFIERS.OUTSIDE)) {
    const outsideHandler = (e) => {
      if (!node.contains(e.target)) {
        wrappedHandler(e, node);
        if (modifiers.includes(MODIFIERS.ONCE)) {
          document.removeEventListener('click', outsideHandler, commonOptions);
        }
      }
    };
    document.addEventListener('click', outsideHandler, commonOptions);
    return;
  }

  const target = getEventTarget(node, modifiers);
  const eventHandler = (e) => wrappedHandler(e, node);

  target.addEventListener(event, eventHandler, {
    ...commonOptions,
    once: modifiers.includes(MODIFIERS.ONCE),
  });
}
