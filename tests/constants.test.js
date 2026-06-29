import { describe, it, expect } from 'vitest';
import { ATTRIBUTES, MODIFIERS, KEY_MAP, SYSTEM_KEYS, MOUSE_BUTTONS } from '../src/constants.js';

describe('ATTRIBUTES', () => {
  it('should have the correct values', () => {
    expect(ATTRIBUTES.CONTROLLER).toBe('mx-controller');
    expect(ATTRIBUTES.REQUEST_METHOD).toBe('mx-method');
    expect(ATTRIBUTES.REQUEST_PATH).toBe('mx-path');
    expect(ATTRIBUTES.REQUEST_DATA).toBe('mx-data');
    expect(ATTRIBUTES.HEADER_META).toBe('mx-header');
    expect(ATTRIBUTES.EVENT_PREFIX).toBe('mx-');
  });
});

describe('MODIFIERS', () => {
  it('should have the correct values', () => {
    expect(MODIFIERS.PREVENT).toBe('prevent');
    expect(MODIFIERS.STOP).toBe('stop');
    expect(MODIFIERS.ONCE).toBe('once');
    expect(MODIFIERS.SELF).toBe('self');
    expect(MODIFIERS.DEBOUNCE).toBe('debounce');
    expect(MODIFIERS.THROTTLE).toBe('throttle');
    expect(MODIFIERS.CAPTURE).toBe('capture');
    expect(MODIFIERS.PASSIVE).toBe('passive');
    expect(MODIFIERS.WINDOW).toBe('window');
    expect(MODIFIERS.DOCUMENT).toBe('document');
    expect(MODIFIERS.OUTSIDE).toBe('outside');
  });

  it('should have key name modifiers', () => {
    expect(MODIFIERS.ENTER).toBe('enter');
    expect(MODIFIERS.TAB).toBe('tab');
    expect(MODIFIERS.ESC).toBe('esc');
    expect(MODIFIERS.SPACE).toBe('space');
  });

  it('should have system key modifiers', () => {
    expect(MODIFIERS.CTRL).toBe('ctrl');
    expect(MODIFIERS.SHIFT).toBe('shift');
    expect(MODIFIERS.ALT).toBe('alt');
    expect(MODIFIERS.META).toBe('meta');
  });

  it('should have mouse button modifiers', () => {
    expect(MODIFIERS.LEFT).toBe('left');
    expect(MODIFIERS.MIDDLE).toBe('middle');
    expect(MODIFIERS.RIGHT).toBe('right');
  });

  it('should have stopImmediate modifier (separate from stop)', () => {
    expect(MODIFIERS.STOP_IMMEDIATE).toBe('stopImmediate');
    expect(MODIFIERS.STOP_IMMEDIATE).not.toBe(MODIFIERS.STOP);
  });
});

describe('KEY_MAP', () => {
  it('should map modifier names to event.key values', () => {
    expect(KEY_MAP.enter).toBe('Enter');
    expect(KEY_MAP.tab).toBe('Tab');
    expect(KEY_MAP.esc).toBe('Escape');
    expect(KEY_MAP.space).toBe(' ');
  });
});

describe('SYSTEM_KEYS', () => {
  it('should map modifier names to event property names', () => {
    expect(SYSTEM_KEYS.ctrl).toBe('ctrlKey');
    expect(SYSTEM_KEYS.shift).toBe('shiftKey');
    expect(SYSTEM_KEYS.alt).toBe('altKey');
    expect(SYSTEM_KEYS.meta).toBe('metaKey');
  });
});

describe('MOUSE_BUTTONS', () => {
  it('should map modifier names to event.button values', () => {
    expect(MOUSE_BUTTONS.left).toBe(0);
    expect(MOUSE_BUTTONS.middle).toBe(1);
    expect(MOUSE_BUTTONS.right).toBe(2);
  });
});
