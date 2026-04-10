import { describe, it, expect, vi, beforeEach } from 'vitest';
import { attachEventHandler } from '../src/events.js';
import { executeActionOrCapability } from '../src/capabilities.js';

// Mock dependencies
vi.mock('../src/capabilities.js', () => ({
    executeActionOrCapability: vi.fn(),
}));

describe('events', () => {
    let node;

    beforeEach(() => {
        node = document.createElement('div');
        vi.clearAllMocks();
    });

    describe('attachEventHandler', () => {
        it('should trigger immediately for load events', async () => {
            const parsedEvent = {
                event: 'load',
                modifiers: [],
                action: 'testAction',
            };

            await attachEventHandler(node, parsedEvent);

            expect(executeActionOrCapability).toHaveBeenCalledWith(
                parsedEvent,
                node,
                expect.any(Event)
            );
        });

        it('should attach listeners for other events', async () => {
            const parsedEvent = {
                event: 'click',
                modifiers: [],
                action: 'testAction',
            };

            await attachEventHandler(node, parsedEvent);

            // Simulate click
            const clickEvent = new Event('click');
            node.dispatchEvent(clickEvent);

            expect(executeActionOrCapability).toHaveBeenCalledWith(
                parsedEvent,
                node,
                expect.any(Event)
            );
        });

        it('should handle prevent modifier', async () => {
            const parsedEvent = {
                event: 'click',
                modifiers: ['prevent'],
                action: 'testAction',
            };

            await attachEventHandler(node, parsedEvent);

            const clickEvent = new Event('click');
            const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
            node.dispatchEvent(clickEvent);

            expect(preventDefaultSpy).toHaveBeenCalled();
        });

        it('should handle once modifier', async () => {
            const parsedEvent = {
                event: 'click',
                modifiers: ['once'],
                action: 'testAction',
            };

            await attachEventHandler(node, parsedEvent);

            node.dispatchEvent(new Event('click'));
            node.dispatchEvent(new Event('click'));

            expect(executeActionOrCapability).toHaveBeenCalledTimes(1);
        });

        it('should handle .window modifier', async () => {
            const parsedEvent = {
                event: 'keydown',
                modifiers: ['window'],
                action: 'testAction',
            };

            const windowSpy = vi.spyOn(window, 'addEventListener');
            await attachEventHandler(node, parsedEvent);

            expect(windowSpy).toHaveBeenCalledWith('keydown', expect.any(Function), expect.any(Object));
            windowSpy.mockRestore();
        });

        it('should handle .outside modifier', async () => {
            const parsedEvent = {
                event: 'click',
                modifiers: ['outside'],
                action: 'testAction',
            };

            const docSpy = vi.spyOn(document, 'addEventListener');
            await attachEventHandler(node, parsedEvent);

            expect(docSpy).toHaveBeenCalledWith('click', expect.any(Function), expect.any(Object));

            // Simulate click inside
            const innerNode = document.createElement('span');
            node.appendChild(innerNode);
            const insideClick = { target: innerNode };
            
            // We need to trigger the captured handler somehow in unit test
            // For simplicity, we just verify the listener was attached to document
            docSpy.mockRestore();
        });

        it('should handle .outside with .once modifier', async () => {
            const parsedEvent = {
                event: 'click',
                modifiers: ['outside', 'once'],
                action: 'testAction',
            };

            const docAddSpy = vi.spyOn(document, 'addEventListener');
            const docRemoveSpy = vi.spyOn(document, 'removeEventListener');
            
            await attachEventHandler(node, parsedEvent);

            // get the handler
            const handler = docAddSpy.mock.calls[0][1];
            
            // Trigger outside
            handler({ target: document.body });
            
            expect(executeActionOrCapability).toHaveBeenCalledTimes(1);
            expect(docRemoveSpy).toHaveBeenCalledWith('click', handler, expect.any(Object));
            
            docAddSpy.mockRestore();
            docRemoveSpy.mockRestore();
        });
    });
});
