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
  const target = getEventTarget(node, modifiers);
  
  const listenerOptions = {
    capture: modifiers.includes(MODIFIERS.CAPTURE),
    passive: modifiers.includes(MODIFIERS.PASSIVE),
    once: modifiers.includes(MODIFIERS.ONCE),
  };
  
  const eventHandler = (e) => wrappedHandler(e, node);
  
  if (modifiers.includes(MODIFIERS.OUTSIDE)) {
    const outsideHandler = (e) => {
      if (!node.contains(e.target)) {
        wrappedHandler(e, node);
      }
    };
    document.addEventListener('click', outsideHandler, listenerOptions);
    return;
  }
  
  target.addEventListener(event, eventHandler, listenerOptions);
}

function click(node, action, options) {
  node.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const response = await actions[action](node, options, event);
    if (!response) { return; }
    present(node, response);
  });
}

function submit(node, action, options) {
  if (node.tagName !== 'FORM') { return }
  node.addEventListener("submit", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const response = await actions[action](node, options, event);
    if (!response) { return; }
    present(node, response);
  });
}

async function load(node, action, options) {
  const response = await actions[action](node, options, DUMMY_EVENT);
  if (!response) { return; }
  present(node, response, options);
}

function mouseover(node, action, options) {
  node.addEventListener("mouseover", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const response = await actions[action](node, options, event);
    if (!response) { return; }
    present(node, response);
  });
}

function mouseenter(node, action, options) {
  node.addEventListener("mouseenter", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const response = await actions[action](node, options, event);
    if (!response) { return; }
    present(node, response);
  });
}

function mouseleave(node, action, options) {
  node.addEventListener("mouseleave", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const response = await actions[action](node, options, event);
    if (!response) { return; }
    present(node, response);
  });
}

const legacyEvents = {
  click,
  submit,
  load,
  mouseover,
  mouseenter,
  mouseleave,
};

export function handleLegacyEvent(eventName, node, action, options) {
  if (legacyEvents[eventName]) {
    legacyEvents[eventName](node, action, options);
  }
}

export default legacyEvents;
