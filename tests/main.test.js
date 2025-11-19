import { describe, it, expect, vi } from 'vitest';

// We need to mock mate.js before importing main.js
// However, main.js executes immediately upon import.
// To test this, we can use dynamic imports or just rely on side-effects if possible.
// But vitest modules are cached.
// A better approach for main.js which just calls a function is to verify that function is called.

vi.mock('../src/mate.js', () => ({
    default: vi.fn(),
}));

import mate from '../src/mate.js';

describe('main', () => {
    it('should call mate() on import', async () => {
        await import('../src/main.js');
        expect(mate).toHaveBeenCalled();
    });
});
