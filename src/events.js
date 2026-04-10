import actions from './actions.js';
import { present } from './presenter.js';
import { MODIFIERS } from './constants.js';
import { executeActionOrCapability } from './capabilities.js';

const DUMMY_EVENT = new Event("__dummy__");

function applyModifiers(event, modifiers) {
  if (modifiers.includes(MODIFIERS.PREVENT)) {
    event.preventDefault();
  }
  if (modifiers.includes(MODIFIERS.STOP)) {
    event.stopPropagation();
  }
  if (modifiers.includes(MODIFIERS.STOP)) {
    event.stopImmediatePropagation();
  }
}

function createDebouncedHandler(handler, wait) {
  let timeoutId = null;
  return function(event, ...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => handler.call(this, event, ...args), wait);
  };
}

function createThrottledHandler(handler, wait) {
  let lastTime = 0;
  return function(event, ...args) {
    const now = Date.now();
    if (now - lastTime >= wait) {
      lastTime = now;
      return handler.call(this, event, ...args);
    }
  };
}

function wrapHandlerWithModifiers(handler, parsedEvent) {
  const { modifiers, debounceMs, throttleMs } = parsedEvent;
  
  let wrappedHandler = handler;
  
  if (debounceMs) {
    wrappedHandler = createDebouncedHandler(wrappedHandler, debounceMs);
  }
  
  if (throttleMs) {
    wrappedHandler = createThrottledHandler(wrappedHandler, throttleMs);
  }
  
  return async (event, node) => {
    applyModifiers(event, modifiers);
    
    if (modifiers.includes(MODIFIERS.SELF) && event.target !== node) {
      return;
    }
    
    if (modifiers.includes(MODIFIERS.ONCE)) {
      node.removeEventListener(parsedEvent.event, wrappedHandler);
    }
    
    return wrappedHandler(event, node);
  };
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
    return wrappedHandler(DUMMY_EVENT, node);
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
