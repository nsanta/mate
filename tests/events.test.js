import { describe, it, expect, vi, beforeEach } from 'vitest';
import events from '../src/events.js';
import actions from '../src/actions.js';
import { present } from '../src/presenter.js';

// Mock dependencies
vi.mock('../src/actions.js', () => ({
    default: {
        testAction: vi.fn(),
    }
}));

vi.mock('../src/presenter.js', () => ({
    present: vi.fn(),
}));

describe('events', () => {
    let node;
    let event;

    beforeEach(() => {
        node = document.createElement('div');
        event = {
            preventDefault: vi.fn(),
            stopPropagation: vi.fn(),
        };
        vi.clearAllMocks();
    });

    describe('click', () => {
        it('should attach click listener and trigger action', async () => {
            actions.testAction.mockResolvedValue('response');

            events.click(node, 'testAction', 'option');

            // Simulate click
            const clickEvent = new Event('click');
            Object.assign(clickEvent, event);
            node.dispatchEvent(clickEvent);

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(actions.testAction).toHaveBeenCalledWith(node, 'option', expect.any(Event));
            expect(present).toHaveBeenCalledWith(node, 'response');
        });

        it('should not present if action returns null', async () => {
            actions.testAction.mockResolvedValue(null);

            events.click(node, 'testAction', 'option');

            const clickEvent = new Event('click');
            Object.assign(clickEvent, event);
            node.dispatchEvent(clickEvent);

            await new Promise(resolve => setTimeout(resolve, 0));

            expect(present).not.toHaveBeenCalled();
        });
    });

    describe('submit', () => {
        it('should attach submit listener to form', async () => {
            node = document.createElement('form');
            actions.testAction.mockResolvedValue('response');

            events.submit(node, 'testAction', 'option');

            const submitEvent = new Event('submit');
            Object.assign(submitEvent, event);
            node.dispatchEvent(submitEvent);

            await new Promise(resolve => setTimeout(resolve, 0));

            expect(actions.testAction).toHaveBeenCalled();
            expect(present).toHaveBeenCalled();
        });

        it('should ignore non-form elements', () => {
            const addEventListenerSpy = vi.spyOn(node, 'addEventListener');
            events.submit(node, 'testAction', 'option');
            expect(addEventListenerSpy).not.toHaveBeenCalled();
        });
    });

    describe('load', () => {
        it('should trigger action immediately', async () => {
            actions.testAction.mockResolvedValue('response');

            await events.load(node, 'testAction', 'option');

            expect(actions.testAction).toHaveBeenCalledWith(node, 'option', expect.any(Event));
            expect(present).toHaveBeenCalledWith(node, 'response', 'option');
        });
    });

    // Tests for mouseover, mouseenter, mouseleave follow similar pattern to click
    describe('mouseover', () => {
        it('should attach mouseover listener', async () => {
            actions.testAction.mockResolvedValue('response');
            events.mouseover(node, 'testAction', 'option');

            const mouseEvent = new Event('mouseover');
            Object.assign(mouseEvent, event);
            node.dispatchEvent(mouseEvent);

            await new Promise(resolve => setTimeout(resolve, 0));

            expect(actions.testAction).toHaveBeenCalled();
            expect(present).toHaveBeenCalled();
        });
    });
});
