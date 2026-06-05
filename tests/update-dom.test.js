import { describe, it, expect, beforeEach } from 'vitest';
import { updateDOM } from '../src/update-dom.js';
import { registerPresenter } from '../src/presenter.js';

describe('updateDOM', () => {
  let node;

  beforeEach(() => {
    node = document.createElement('div');
    document.body.appendChild(node);
  });

  describe('isUpdate=false (initial pass — delegates to presenter)', () => {
    it('replaces innerHTML via @inner presenter', async () => {
      await updateDOM(node, '<p>hello</p>', '@inner', undefined, undefined, false);
      expect(node.innerHTML).toBe('<p>hello</p>');
    });

    it('replaces outerHTML via @outer presenter', async () => {
      const parent = document.createElement('div');
      parent.appendChild(node);
      await updateDOM(node, '<span>replaced</span>', '@outer', undefined, undefined, false);
      expect(parent.innerHTML).toBe('<span>replaced</span>');
    });

    it('updates a separate target via @id presenter', async () => {
      const target = document.createElement('div');
      target.id = 't1';
      document.body.appendChild(target);

      await updateDOM(node, 'hello-id', '@id', 't1', undefined, false);
      expect(target.innerHTML).toBe('hello-id');
    });

    it('forwards target and presentationOption to presenter', async () => {
      const target = document.createElement('div');
      target.id = 't2';
      document.body.appendChild(target);

      await updateDOM(node, '<p>x</p>', '@id', 't2', 'outer', false);
      expect(document.getElementById('t2')).toBeNull();
    });
  });

  describe('isUpdate=true (incremental pass)', () => {
    it('@inner appends to existing innerHTML', async () => {
      node.innerHTML = 'before-';
      await updateDOM(node, 'after', '@inner', undefined, undefined, true);
      expect(node.innerHTML).toBe('before-after');
    });

    it('undefined presentation defaults to @inner behavior', async () => {
      node.innerHTML = 'a';
      await updateDOM(node, 'b', undefined, undefined, undefined, true);
      expect(node.innerHTML).toBe('ab');
    });

    it('@append uses insertAdjacentHTML beforeend', async () => {
      node.innerHTML = '<p>first</p>';
      await updateDOM(node, '<p>second</p>', '@append', undefined, undefined, true);
      expect(node.innerHTML).toBe('<p>first</p><p>second</p>');
    });

    it('@prepend uses insertAdjacentHTML afterbegin', async () => {
      node.innerHTML = '<p>first</p>';
      await updateDOM(node, '<p>zero</p>', '@prepend', undefined, undefined, true);
      expect(node.innerHTML).toBe('<p>zero</p><p>first</p>');
    });

    it('@id appends to target element innerHTML', async () => {
      const target = document.createElement('ul');
      target.id = 'list';
      target.innerHTML = '<li>one</li>';
      document.body.appendChild(target);

      await updateDOM(node, '<li>two</li>', '@id', 'list', undefined, true);
      expect(target.innerHTML).toBe('<li>one</li><li>two</li>');
    });

    it('@id is a no-op when target does not exist', async () => {
      const before = document.body.innerHTML;
      await updateDOM(node, '<li>x</li>', '@id', 'nonexistent', undefined, true);
      expect(document.body.innerHTML).toBe(before);
    });

    it('@id is a no-op when target arg is missing', async () => {
      const before = document.body.innerHTML;
      await updateDOM(node, '<li>x</li>', '@id', undefined, undefined, true);
      expect(document.body.innerHTML).toBe(before);
    });
  });

  describe('isUpdate=true with custom @-presentation', () => {
    it('delegates to registered presenter for unknown @-prefixed presentation', async () => {
      const calls = [];
      registerPresenter('@spy', async (n, response, target, option) => {
        calls.push({ target, option, content: await response.text() });
      });

      await updateDOM(node, 'spy-content', '@spy', 't3', 'opt', true);

      expect(calls).toHaveLength(1);
      expect(calls[0]).toEqual({ target: 't3', option: 'opt', content: 'spy-content' });
    });

    it('does not call presenter for non-@ presentation (silent no-op)', async () => {
      const calls = [];
      registerPresenter('@spy2', async () => calls.push('hit'));

      await updateDOM(node, 'x', 'plain-text', undefined, undefined, true);
      await updateDOM(node, 'x', '', undefined, undefined, true);

      expect(calls).toHaveLength(0);
    });
  });
});
