import { describe, it, expect, vi, beforeEach } from 'vitest';
import actions from '../src/actions.js';
import { ATTRIBUTES } from '../src/constants.js';

describe('actions', () => {
    describe('@request', () => {
        const request = actions['@request'];

        beforeEach(() => {
            global.fetch = vi.fn();
            global.FormData = class {
                constructor() {
                    this.data = [];
                }
                append(key, value) {
                    this.data.push([key, value]);
                }
                *[Symbol.iterator]() {
                    yield* this.data;
                }
            };
            global.URLSearchParams = class {
                constructor() {
                    this.params = {};
                }
                append(key, value) {
                    this.params[key] = value;
                }
            };
        });

        it('should make a GET request by default', async () => {
            const node = document.createElement('div');
            node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/api/test');

            await request(node, {}, {});

            expect(global.fetch).toHaveBeenCalledWith('/api/test', {
                method: 'GET',
                headers: {},
            });
        });

        it('should make a POST request with JSON data', async () => {
            const node = document.createElement('div');
            node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/api/test');
            node.setAttribute(ATTRIBUTES.REQUEST_METHOD, 'POST');
            node.setAttribute(ATTRIBUTES.REQUEST_DATA, '{"foo":"bar"}');

            await request(node, {}, {});

            expect(global.fetch).toHaveBeenCalledWith('/api/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ foo: 'bar' }),
            });
        });

        it('should make a POST request with FormData for forms', async () => {
            const node = document.createElement('form');
            node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/api/test');
            node.setAttribute(ATTRIBUTES.REQUEST_METHOD, 'POST');

            // Mock FormData iteration since jsdom might not fully support it or we want to control it
            // Actually, let's rely on our mock above if needed, or better, spy on URLSearchParams

            await request(node, {}, {});

            expect(global.fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
                method: 'POST',
                headers: {},
                // body check is tricky with mocked classes, but we can check if it's an instance of URLSearchParams
                body: expect.any(global.URLSearchParams),
            }));
        });
    });

    describe('@event', () => {
        const triggerEvent = actions['@event'];

        it('should return the event', async () => {
            const event = { type: 'click' };
            const result = await triggerEvent(null, null, event);
            expect(result).toBe(event);
        });
    });
});
