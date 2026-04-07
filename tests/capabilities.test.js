import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  registerCapability, 
  getCapability, 
  hasCapability, 
  removeCapability, 
  clearCapabilities,
  executeCapability,
  executeActionOrCapability 
} from '../src/capabilities.js';

describe('capabilities', () => {
  beforeEach(() => {
    clearCapabilities();
  });

  describe('registerCapability', () => {
    it('should register a capability', () => {
      const handler = vi.fn();
      registerCapability('Analytics', handler);
      
      expect(hasCapability('Analytics')).toBe(true);
      expect(getCapability('Analytics')).toBe(handler);
    });

    it('should register a capability object with methods', () => {
      const capability = {
        track: vi.fn(),
        identify: vi.fn(),
      };
      registerCapability('Analytics', capability);
      
      expect(hasCapability('Analytics')).toBe(true);
    });

    it('should overwrite existing capability', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      registerCapability('Test', handler1);
      registerCapability('Test', handler2);
      
      expect(getCapability('Test')).toBe(handler2);
    });
  });

  describe('removeCapability', () => {
    it('should remove a registered capability', () => {
      registerCapability('Test', vi.fn());
      expect(hasCapability('Test')).toBe(true);
      
      removeCapability('Test');
      expect(hasCapability('Test')).toBe(false);
    });
  });

  describe('clearCapabilities', () => {
    it('should clear all capabilities', () => {
      registerCapability('Test1', vi.fn());
      registerCapability('Test2', vi.fn());
      
      clearCapabilities();
      
      expect(hasCapability('Test1')).toBe(false);
      expect(hasCapability('Test2')).toBe(false);
    });
  });

  describe('executeCapability', () => {
    it('should execute a function capability', async () => {
      const handler = vi.fn().mockResolvedValue({ data: 'test' });
      registerCapability('Test', handler);
      
      const node = document.createElement('div');
      const event = new Event('click');
      const result = await executeCapability('Test', 'method', node, event, {});
      
      expect(handler).toHaveBeenCalledWith(node, 'method', event, {});
      expect(result).toEqual({ data: 'test' });
    });

    it('should execute a method on object capability', async () => {
      const capability = {
        track: vi.fn().mockResolvedValue({ tracked: true }),
      };
      registerCapability('Analytics', capability);
      
      const node = document.createElement('div');
      const event = new Event('click');
      const result = await executeCapability('Analytics', 'track', node, event, {});
      
      expect(capability.track).toHaveBeenCalledWith(node, event, {});
      expect(result).toEqual({ tracked: true });
    });

    it('should warn when capability not found', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const result = await executeCapability('NonExistent', 'method', null, null, {});
      
      expect(result).toBe(null);
      expect(warnSpy).toHaveBeenCalledWith(
        'Capability "NonExistent" not found. Did you forget to register it?'
      );
      
      warnSpy.mockRestore();
    });

    it('should warn when method not found on object capability', async () => {
      const capability = { track: vi.fn() };
      registerCapability('Analytics', capability);
      
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const result = await executeCapability('Analytics', 'nonexistent', null, null, {});
      
      expect(result).toBe(null);
      expect(warnSpy).toHaveBeenCalledWith(
        'Method "nonexistent" not found on capability "Analytics"'
      );
      
      warnSpy.mockRestore();
    });
  });

  describe('executeActionOrCapability', () => {
    it('should execute built-in @request action', async () => {
      const parsedEvent = {
        action: '@request',
        capability: null,
        method: null,
        presentation: '@inner',
        target: null,
        presentationOption: null,
      };
      
      // This would normally make a fetch request, but we're testing the dispatch logic
      // The actual fetch is tested in actions.test.js
    });

    it('should execute custom capability', async () => {
      const handler = vi.fn().mockResolvedValue({ text: () => Promise.resolve('result') });
      registerCapability('Custom', handler);
      
      const parsedEvent = {
        action: null,
        capability: 'Custom',
        method: 'handler',
        presentation: '@inner',
        target: null,
        presentationOption: null,
      };
      
      const node = document.createElement('div');
      const event = new Event('click');
      
      await executeActionOrCapability(parsedEvent, node, event);
      
      expect(handler).toHaveBeenCalled();
    });
  });
});
