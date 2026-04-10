import { describe, it, expect } from 'vitest';
import { ATTRIBUTES, MODIFIERS } from '../src/constants.js';

describe('ATTRIBUTES', () => {
    it('should have the correct values', () => {
        expect(ATTRIBUTES.CONTROLLER).toBe("mt-controller");
        expect(ATTRIBUTES.REQUEST_METHOD).toBe("mt-method");
        expect(ATTRIBUTES.REQUEST_PATH).toBe("mt-path");
        expect(ATTRIBUTES.REQUEST_DATA).toBe("mt-data");
        expect(ATTRIBUTES.HEADER_META).toBe("mt-header");
        expect(ATTRIBUTES.EVENT_PREFIX).toBe("mx-");
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
});
