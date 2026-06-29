import { mount, unmount } from 'svelte';
import { registerPresenter } from './presenter.js';

const components = new Map();
const instances = new WeakMap();

export function registerComponent(name, component) {
  components.set(name, component);
}

export function getComponent(name) {
  return components.get(name);
}

export function hasComponent(name) {
  return components.has(name);
}

async function sveltePresenter(node, response, componentName, _option) {
  const Component = components.get(componentName);
  if (!Component) {
    console.warn(
      `Svelte component "${componentName}" not registered. Use registerComponent("${componentName}", MyComponent).`,
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

  const existing = instances.get(node);
  if (existing) {
    unmount(existing);
  }

  const instance = mount(Component, {
    target: node,
    props: { data },
  });

  instances.set(node, instance);
}

registerPresenter('@svelte', sveltePresenter);

export default { registerComponent, getComponent, hasComponent };
