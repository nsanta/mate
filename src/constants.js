export const ATTRIBUTES = {
  CONTROLLER: 'mx-controller',
  REQUEST_METHOD: 'mx-method',
  REQUEST_PATH: 'mx-path',
  REQUEST_DATA: 'mx-data',
  HEADER_META: 'mx-header',
  EVENT_PREFIX: 'mx-',
};

export const MODIFIERS = {
  PREVENT: 'prevent',
  STOP: 'stop',
  STOP_IMMEDIATE: 'stopImmediate',
  ONCE: 'once',
  SELF: 'self',
  DEBOUNCE: 'debounce',
  THROTTLE: 'throttle',
  CAPTURE: 'capture',
  PASSIVE: 'passive',
  WINDOW: 'window',
  DOCUMENT: 'document',
  OUTSIDE: 'outside',
  // Key name modifiers
  ENTER: 'enter',
  TAB: 'tab',
  ESC: 'esc',
  SPACE: 'space',
  // System key modifiers
  CTRL: 'ctrl',
  SHIFT: 'shift',
  ALT: 'alt',
  META: 'meta',
  // Mouse button modifiers
  LEFT: 'left',
  MIDDLE: 'middle',
  RIGHT: 'right',
};

export const KEY_MAP = {
  enter: 'Enter',
  tab: 'Tab',
  esc: 'Escape',
  space: ' ',
};

export const SYSTEM_KEYS = {
  ctrl: 'ctrlKey',
  shift: 'shiftKey',
  alt: 'altKey',
  meta: 'metaKey',
};

export const MOUSE_BUTTONS = {
  left: 0,
  middle: 1,
  right: 2,
};
