import { describe, it, expect, vi, beforeEach } from 'vitest';
import { present } from '../src/presenter.js';
import { ATTRIBUTES } from '../src/constants.js';

describe('presenter', () => {
    let node;
    let response;

    beforeEach(() => {
        node = document.createElement('div');
        response = {
            text: vi.fn().mockResolvedValue('<p>content</p>'),
        };
    });

    it('should default to innerHTML if no presenter attribute', async () => {
        await present(node, response);
        expect(node.innerHTML).toBe('<p>content</p>');
    });

    it('should handle @inner', async () => {
        node.setAttribute(ATTRIBUTES.PRESENTER, '@inner:_:_');
        await present(node, response);
        expect(node.innerHTML).toBe('<p>content</p>');
    });

    it('should handle @outer', async () => {
        // outerHTML requires the node to have a parent
        const parent = document.createElement('div');
        parent.appendChild(node);
        node.setAttribute(ATTRIBUTES.PRESENTER, '@outer:_:_');

        await present(node, response);

        expect(parent.innerHTML).toBe('<p>content</p>');
    });

    it('should handle @id', async () => {
        const target = document.createElement('div');
        target.id = 'target-id';
        document.body.appendChild(target);

        node.setAttribute(ATTRIBUTES.PRESENTER, '@id:target-id:_');

        await present(node, response);

        expect(target.innerHTML).toBe('<p>content</p>');
        document.body.removeChild(target);
    });

    it('should handle @class', async () => {
        const target1 = document.createElement('div');
        target1.className = 'target-class';
        const target2 = document.createElement('div');
        target2.className = 'target-class';
        document.body.appendChild(target1);
        document.body.appendChild(target2);

        node.setAttribute(ATTRIBUTES.PRESENTER, '@class:target-class:_');

        await present(node, response);

        expect(target1.innerHTML).toBe('<p>content</p>');
        expect(target2.innerHTML).toBe('<p>content</p>');

        document.body.removeChild(target1);
        document.body.removeChild(target2);
    });

    it('should handle @controller', async () => {
        const mockController = {
            update: vi.fn(),
        };
        node.mtController = mockController;
        node.setAttribute(ATTRIBUTES.PRESENTER, '@controller:update:_');

        await present(node, response);

        expect(mockController.update).toHaveBeenCalledWith(response);
    });

    it('should handle @append', async () => {
        node.innerHTML = '<span>existing</span>';
        node.setAttribute(ATTRIBUTES.PRESENTER, '@append:_:_');

        await present(node, response);

        expect(node.innerHTML).toBe('<span>existing</span><p>content</p>');
    });

    it('should handle @prepend', async () => {
        node.innerHTML = '<span>existing</span>';
        node.setAttribute(ATTRIBUTES.PRESENTER, '@prepend:_:_');

        await present(node, response);

        expect(node.innerHTML).toBe('<p>content</p><span>existing</span>');
    });
});
