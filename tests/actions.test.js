import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import actions from '../src/actions.js';
import { ATTRIBUTES } from '../src/constants.js';

describe('actions', () => {
    describe('@request', () => {
        const request = actions['@request'];

        beforeEach(() => {
            global.fetch = vi.fn();
            global.FormData = class {
                constructor(form) {
                    this.data = [];
                    if (form && form.elements) {
                        for (const el of form.elements) {
                            if (el.name && el.value && (!['checkbox', 'radio'].includes(el.type) || el.checked)) {
                                this.append(el.name, el.value);
                            }
                        }
                    }
                }
                append(key, value) {
                    this.data.push([key, value]);
                }
                *[Symbol.iterator]() {
                    yield* this.data;
                }
            };
            global.URLSearchParams = class {
                constructor(init) {
                    this.params = {};
                    if (init && typeof init[Symbol.iterator] === 'function') {
                        for (const [key, value] of init) {
                            this.append(key, value);
                        }
                    }
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

        it('should include headers from meta tags', async () => {
            const meta = document.createElement('meta');
            meta.setAttribute(ATTRIBUTES.HEADER_META, '');
            meta.setAttribute('name', 'Authorization');
            meta.setAttribute('content', 'Bearer: TOKEN');
            document.head.appendChild(meta);

            try {
                const node = document.createElement('div');
                node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/api/test');

                await request(node, {}, {});

                expect(global.fetch).toHaveBeenCalledWith('/api/test', {
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer: TOKEN',
                    },
                });
            } finally {
                document.head.removeChild(meta);
            }
        });

        it('should include multiple headers from meta tags', async () => {
            const meta1 = document.createElement('meta');
            meta1.setAttribute(ATTRIBUTES.HEADER_META, '');
            meta1.setAttribute('name', 'Authorization');
            meta1.setAttribute('content', 'Bearer: TOKEN');

            const meta2 = document.createElement('meta');
            meta2.setAttribute(ATTRIBUTES.HEADER_META, '');
            meta2.setAttribute('name', 'X-Custom-Header');
            meta2.setAttribute('content', 'custom-value');

            document.head.appendChild(meta1);
            document.head.appendChild(meta2);

            try {
                const node = document.createElement('div');
                node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/api/test');

                await request(node, {}, {});

                expect(global.fetch).toHaveBeenCalledWith('/api/test', {
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer: TOKEN',
                        'X-Custom-Header': 'custom-value',
                    },
                });
            } finally {
                document.head.removeChild(meta1);
                document.head.removeChild(meta2);
            }
        });

        describe('@form:<format> syntax', () => {
            let form;
            beforeEach(() => {
                form = document.createElement('form');
                const input1 = document.createElement('input');
                input1.name = 'username';
                input1.value = 'john_doe';
                const input2 = document.createElement('input');
                input2.name = 'email';
                input2.value = 'john@example.com';
                form.appendChild(input1);
                form.appendChild(input2);
                document.body.appendChild(form);
            });

            afterEach(() => {
                if (form && form.parentNode) {
                    document.body.removeChild(form);
                }
            });

            it('should submit form data as JSON with @form:json', async () => {
                const node = document.createElement('button');
                node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/api/test');
                node.setAttribute(ATTRIBUTES.REQUEST_METHOD, 'POST');
                node.setAttribute(ATTRIBUTES.REQUEST_DATA, '@form:json');
                form.appendChild(node);

                await request(node, {}, {});

                expect(global.fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                    }),
                    body: JSON.stringify({ username: 'john_doe', email: 'john@example.com' }),
                }));
            });

            it('should submit form data as URLSearchParams with @form:form', async () => {
                const node = document.createElement('button');
                node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/api/test');
                node.setAttribute(ATTRIBUTES.REQUEST_METHOD, 'POST');
                node.setAttribute(ATTRIBUTES.REQUEST_DATA, '@form:form');
                form.appendChild(node);

                await request(node, {}, {});

                expect(global.fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
                    method: 'POST',
                    body: expect.any(global.URLSearchParams),
                }));
            });

            it('should submit form data as FormData with @form:multipart', async () => {
                const node = document.createElement('button');
                node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/api/test');
                node.setAttribute(ATTRIBUTES.REQUEST_METHOD, 'POST');
                node.setAttribute(ATTRIBUTES.REQUEST_DATA, '@form:multipart');
                form.appendChild(node);

                await request(node, {}, {});

                expect(global.fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
                    method: 'POST',
                    body: expect.any(global.FormData),
                }));
            });

            it('should find the closest form if trigger is nested', async () => {
                const container = document.createElement('div');
                const node = document.createElement('button');
                node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/api/test');
                node.setAttribute(ATTRIBUTES.REQUEST_METHOD, 'POST');
                node.setAttribute(ATTRIBUTES.REQUEST_DATA, '@form:json');
                container.appendChild(node);
                form.appendChild(container);

                await request(node, {}, {});

                expect(global.fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
                    body: JSON.stringify({ username: 'john_doe', email: 'john@example.com' }),
                }));
            });

            it('should handle multiple values for the same key in @form:json', async () => {
                const checkbox1 = document.createElement('input');
                checkbox1.type = 'checkbox';
                checkbox1.name = 'roles';
                checkbox1.value = 'admin';
                checkbox1.checked = true;
                const checkbox2 = document.createElement('input');
                checkbox2.type = 'checkbox';
                checkbox2.name = 'roles';
                checkbox2.value = 'user';
                checkbox2.checked = true;
                form.appendChild(checkbox1);
                form.appendChild(checkbox2);

                const node = document.createElement('button');
                node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/api/test');
                node.setAttribute(ATTRIBUTES.REQUEST_METHOD, 'POST');
                node.setAttribute(ATTRIBUTES.REQUEST_DATA, '@form:json');
                form.appendChild(node);

                await request(node, {}, {});

                const fetchOptions = global.fetch.mock.calls[0][1];
                const body = JSON.parse(fetchOptions.body);
                expect(body.roles).toEqual(['admin', 'user']);
            });

            it('should warn and return null if no form is found', async () => {
                const node = document.createElement('button');
                node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/api/test');
                node.setAttribute(ATTRIBUTES.REQUEST_METHOD, 'POST');
                node.setAttribute(ATTRIBUTES.REQUEST_DATA, '@form:json');
                // node is not in document or form

                const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

                await request(node, {}, {});

                expect(consoleSpy).toHaveBeenCalledWith(
                    expect.stringContaining('@form:json requested but no form found'),
                    expect.any(HTMLElement)
                );
                expect(global.fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
                    method: 'POST',
                }));
                expect(global.fetch.mock.calls[0][1].body).toBeUndefined();

                consoleSpy.mockRestore();
            });
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

    describe('@stream', () => {
        const stream = actions['@stream'];

        beforeEach(() => {
            global.fetch = vi.fn();
        });

        it('should handle streaming responses', async () => {
            const node = document.createElement('div');
            node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/stream');

            const mockReader = {
                read: vi.fn()
                    .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('line1\n') })
                    .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('line2\n') })
                    .mockResolvedValueOnce({ done: true, value: null }),
            };

            const mockResponse = {
                ok: true,
                body: { getReader: () => mockReader },
            };

            global.fetch.mockResolvedValue(mockResponse);

            const result = await stream(node, { presentation: '@inner' }, {});

            expect(global.fetch).toHaveBeenCalledWith('/stream', {
                method: 'GET',
                headers: {},
                signal: expect.any(AbortSignal),
            });
            expect(result).toBeDefined();
            expect(result.chunks).toEqual(['line1', 'line2']);
        });

        it('should require mx-path attribute', async () => {
            const node = document.createElement('div');
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const result = await stream(node, {}, {});

            expect(consoleSpy).toHaveBeenCalledWith('@stream requires mx-path attribute');
            expect(result).toBeNull();

            consoleSpy.mockRestore();
        });

        it('should include headers from meta tags in stream requests', async () => {
            const meta = document.createElement('meta');
            meta.setAttribute(ATTRIBUTES.HEADER_META, '');
            meta.setAttribute('name', 'Authorization');
            meta.setAttribute('content', 'Bearer: STREAM_TOKEN');
            document.head.appendChild(meta);

            try {
                const node = document.createElement('div');
                node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/stream');

                const mockReader = {
                    read: vi.fn()
                        .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('line1\n') })
                        .mockResolvedValueOnce({ done: true, value: null }),
                };

                const mockResponse = {
                    ok: true,
                    body: { getReader: () => mockReader },
                };

                global.fetch.mockResolvedValue(mockResponse);

                await stream(node, { presentation: '@inner' }, {});

                expect(global.fetch).toHaveBeenCalledWith('/stream', {
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer: STREAM_TOKEN',
                    },
                    signal: expect.any(AbortSignal),
                });
            } finally {
                document.head.removeChild(meta);
            }
        });
    });

    describe('@ws', () => {
        const ws = actions['@ws'];

        beforeEach(() => {
            global.WebSocket = vi.fn(function MockWebSocket(url) {
                this.url = url;
                this.send = vi.fn();
                this.close = vi.fn();
                this.binaryType = 'arraybuffer';
                this.readyState = WebSocket.OPEN;
                setTimeout(() => {
                    if (this.onopen) this.onopen();
                }, 0);
            });
        });

        it('should establish WebSocket connection', async () => {
            const node = document.createElement('div');
            node.setAttribute(ATTRIBUTES.REQUEST_PATH, 'ws://localhost:3001/ws');

            const result = await ws(node, { presentation: '@inner' }, {});

            expect(global.WebSocket).toHaveBeenCalledWith('ws://localhost:3001/ws');
            expect(result).toBeDefined();
            expect(node._wsClient).toBeDefined();
        });

        it('should require mx-path attribute', async () => {
            const node = document.createElement('div');
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const result = await ws(node, {}, {});

            expect(consoleSpy).toHaveBeenCalledWith('@ws requires mx-path attribute');
            expect(result).toBeNull();

            consoleSpy.mockRestore();
        });
    });

    describe('@sse', () => {
        const sse = actions['@sse'];

        beforeEach(() => {
            global.EventSource = vi.fn(function MockEventSource(url) {
                this.url = url;
                this.close = vi.fn();
                this.readyState = EventSource.OPEN;
                setTimeout(() => {
                    if (this.onopen) this.onopen();
                }, 0);
            });
        });

        it('should establish SSE connection', async () => {
            const node = document.createElement('div');
            node.setAttribute(ATTRIBUTES.REQUEST_PATH, '/sse');

            const result = await sse(node, { presentation: '@inner' }, {});

            expect(global.EventSource).toHaveBeenCalledWith('/sse');
            expect(result).toBeDefined();
            expect(node._sseClient).toBeDefined();
        });

        it('should require mx-path attribute', async () => {
            const node = document.createElement('div');
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const result = await sse(node, {}, {});

            expect(consoleSpy).toHaveBeenCalledWith('@sse requires mx-path attribute');
            expect(result).toBeNull();

            consoleSpy.mockRestore();
        });
    });
});
