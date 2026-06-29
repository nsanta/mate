import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { registerPresenter } from './presenter.js';

const components = new Map();
const roots = new WeakMap();

export function registerComponent(name, component) {
  components.set(name, component);
}

export function getComponent(name) {
  return components.get(name);
}

export function hasComponent(name) {
  return components.has(name);
}

async function reactPresenter(node, response, componentName, _option) {
  const Component = components.get(componentName);
  if (!Component) {
    console.warn(
      `React component "${componentName}" not registered. Use registerComponent("${componentName}", MyComponent).`,
    );
    return;
  }

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  let root = roots.get(node);
  if (!root) {
    root = createRoot(node);
    roots.set(node, root);
  }

  root.render(createElement(Component, { data }));
}

registerPresenter('@react', reactPresenter);

export default { registerComponent, getComponent, hasComponent };
