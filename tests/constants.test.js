import { describe, it, expect } from 'vitest';
import { ATTRIBUTES } from '../src/constants.js';

describe('ATTRIBUTES', () => {
    it('should have the correct values', () => {
        expect(ATTRIBUTES).toEqual({
            TRIGGER: "mt-on",
            CONTROLLER: "mt-controller",
            REQUEST_METHOD: "mt-method",
            REQUEST_PATH: "mt-path",
            REQUEST_DATA: "mt-data",
            PRESENTER: "mt-pr",
        });
    });
});
