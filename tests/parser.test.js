import { describe, it, expect } from 'vitest';
import { parseEventAttribute, isEventAttribute, parseAllEventAttributes } from '../src/parser.js';

describe('parser', () => {
  describe('isEventAttribute', () => {
    it('should identify mx-* attributes as event attributes', () => {
      expect(isEventAttribute('mx-click')).toBe(true);
      expect(isEventAttribute('mx-submit')).toBe(true);
      expect(isEventAttribute('mx-load')).toBe(true);
      expect(isEventAttribute('mx-mouseover')).toBe(true);
    });

    it('should not identify other attributes as event attributes', () => {
      expect(isEventAttribute('mt-on')).toBe(false);
      expect(isEventAttribute('class')).toBe(false);
      expect(isEventAttribute('id')).toBe(false);
      expect(isEventAttribute('mxpath')).toBe(false);
    });
  });

  describe('parseEventAttribute', () => {
    it('should parse basic event without modifiers', () => {
      const result = parseEventAttribute('mx-click', '@request:@inner');
      
      expect(result).toEqual({
        event: 'click',
        modifiers: [],
        capability: null,
        method: null,
        action: '@request',
        presentation: '@inner',
        target: null,
        presentationOption: null,
        debounceMs: null,
        throttleMs: null,
      });
    });

    it('should parse event with presentation and target', () => {
      const result = parseEventAttribute('mx-click', '@request:@id:target-div');
      
      expect(result.event).toBe('click');
      expect(result.action).toBe('@request');
      expect(result.presentation).toBe('@id');
      expect(result.target).toBe('target-div');
    });

    it('should parse event with presentation, target, and option', () => {
      const result = parseEventAttribute('mx-click', '@request:@id:target-div:outer');
      
      expect(result.event).toBe('click');
      expect(result.presentation).toBe('@id');
      expect(result.target).toBe('target-div');
      expect(result.presentationOption).toBe('outer');
    });

    it('should parse event with .prevent modifier', () => {
      const result = parseEventAttribute('mx-click.prevent', '@request:@inner');
      
      expect(result.event).toBe('click');
      expect(result.modifiers).toContain('prevent');
    });

    it('should parse event with .stop modifier', () => {
      const result = parseEventAttribute('mx-click.stop', '@request:@inner');
      
      expect(result.event).toBe('click');
      expect(result.modifiers).toContain('stop');
    });

    it('should parse event with multiple modifiers', () => {
      const result = parseEventAttribute('mx-click.prevent.stop', '@request:@inner');
      
      expect(result.event).toBe('click');
      expect(result.modifiers).toContain('prevent');
      expect(result.modifiers).toContain('stop');
    });

    it('should parse event with .debounce modifier', () => {
      const result = parseEventAttribute('mx-input.debounce', '@request:@inner');
      
      expect(result.event).toBe('input');
      expect(result.modifiers).toContain('debounce');
      expect(result.debounceMs).toBe(250);
    });

    it('should parse event with .debounce.500ms modifier', () => {
      const result = parseEventAttribute('mx-input.debounce.500ms', '@request:@inner');
      
      expect(result.event).toBe('input');
      expect(result.modifiers).toContain('debounce');
      expect(result.debounceMs).toBe(500);
    });

    it('should parse event with .throttle modifier', () => {
      const result = parseEventAttribute('mx-scroll.throttle', '@request:@inner');
      
      expect(result.event).toBe('scroll');
      expect(result.modifiers).toContain('throttle');
      expect(result.throttleMs).toBe(250);
    });

    it('should parse event with .throttle.100ms modifier', () => {
      const result = parseEventAttribute('mx-scroll.throttle.100ms', '@request:@inner');
      
      expect(result.event).toBe('scroll');
      expect(result.modifiers).toContain('throttle');
      expect(result.throttleMs).toBe(100);
    });

    it('should parse custom capability with method', () => {
      const result = parseEventAttribute('mx-click', 'Analytics.track:@inner');
      
      expect(result.event).toBe('click');
      expect(result.capability).toBe('Analytics');
      expect(result.method).toBe('track');
      expect(result.action).toBe(null);
      expect(result.presentation).toBe('@inner');
    });

    it('should parse custom capability without presentation', () => {
      const result = parseEventAttribute('mx-click', 'Tooltip.toggle');
      
      expect(result.event).toBe('click');
      expect(result.capability).toBe('Tooltip');
      expect(result.method).toBe('toggle');
      expect(result.presentation).toBe('@inner');
    });

    it('should parse @event action for controller', () => {
      const result = parseEventAttribute('mx-click', '@event:@controller:toggle');
      
      expect(result.event).toBe('click');
      expect(result.action).toBe('@event');
      expect(result.presentation).toBe('@controller');
      expect(result.target).toBe('toggle');
    });

    it('should return null for non-mx attributes', () => {
      const result = parseEventAttribute('mt-on', 'click:@request');
      
      expect(result).toBe(null);
    });

    it('should default presentation to @inner when not specified', () => {
      const result = parseEventAttribute('mx-click', '@request');
      
      expect(result.presentation).toBe('@inner');
    });
  });

  describe('parseAllEventAttributes', () => {
    it('should parse all mx-* attributes from an element', () => {
      const element = document.createElement('button');
      element.setAttribute('mx-click', '@request:@inner');
      element.setAttribute('mx-mouseover', 'Tooltip.show:@inner');
      
      const results = parseAllEventAttributes(element);
      
      expect(results).toHaveLength(2);
      expect(results[0].event).toBe('click');
      expect(results[1].event).toBe('mouseover');
    });

    it('should ignore non-mx attributes', () => {
      const element = document.createElement('button');
      element.setAttribute('mx-click', '@request:@inner');
      element.setAttribute('class', 'btn');
      element.setAttribute('id', 'submit-btn');
      
      const results = parseAllEventAttributes(element);
      
      expect(results).toHaveLength(1);
    });
  });
});
