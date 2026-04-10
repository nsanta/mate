import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mate from '../src/mate.js';
import { attachEventHandler } from '../src/events.js';
import { ATTRIBUTES } from '../src/constants.js';

vi.mock('../src/events.js', () => ({
    attachEventHandler: vi.fn(),
}));

describe('mate', () => {
    let observerCallback;
    let observeMock;

    beforeEach(() => {
        observeMock = vi.fn();
        const constructorSpy = vi.fn();

        global.MutationObserver = class {
            constructor(callback) {
                constructorSpy();
                observerCallback = callback;
            }
            observe(element, options) {
                observeMock(element, options);
            }
            disconnect() { }
        };
        global.MutationObserver.mockConstructor = constructorSpy;

        // Mock window.TestController
        window.TestController = class {
            constructor(node) {
                this.node = node;
            }
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
        delete window.TestController;
    });

    it('should initialize and observe document on DOMContentLoaded', () => {
        mate();

        const event = new Event('DOMContentLoaded');
        document.dispatchEvent(event);

        expect(global.MutationObserver.mockConstructor).toHaveBeenCalled();
        expect(observeMock).toHaveBeenCalledWith(document, expect.objectContaining({
            childList: true,
            subtree: true,
            attributes: true,
        }));
    });

    it('should attach event handlers to existing nodes using mx- syntax', () => {
        const node = document.createElement('div');
        node.setAttribute('mx-click', '@request:@inner');
        node.setAttribute('mt-path', '/test');
        document.body.appendChild(node);

        mate();
        document.dispatchEvent(new Event('DOMContentLoaded'));

        expect(attachEventHandler).toHaveBeenCalled();
        
        document.body.removeChild(node);
    });

    it('should initialize controllers', () => {
        const node = document.createElement('div');
        node.setAttribute(ATTRIBUTES.CONTROLLER, 'TestController');
        document.body.appendChild(node);

        mate();
        document.dispatchEvent(new Event('DOMContentLoaded'));

        expect(node.mtController).toBeInstanceOf(window.TestController);

        document.body.removeChild(node);
    });

    it('should handle mutations', () => {
        mate();
        document.dispatchEvent(new Event('DOMContentLoaded'));

        const newNode = document.createElement('div');
        newNode.setAttribute('mx-mouseover', '@request:@inner');

        const mutations = [{
            type: 'childList',
            addedNodes: [newNode],
        }];

        observerCallback(mutations);

        expect(attachEventHandler).toHaveBeenCalled();
    });
});
