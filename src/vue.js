import { createApp, h } from 'vue';
import { registerPresenter } from './presenter.js';

const components = new Map();
const apps = new WeakMap();

export function registerComponent(name, component) {
  components.set(name, component);
}

export function getComponent(name) {
  return components.get(name);
}

export function hasComponent(name) {
  return components.has(name);
}

async function vuePresenter(node, response, componentName, _option) {
  const Component = components.get(componentName);
  if (!Component) {
    console.warn(
      `Vue component "${componentName}" not registered. Use registerComponent("${componentName}", MyComponent).`,
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

  let app = apps.get(node);
  if (app) {
    app.unmount();
  }

  const wrapper = {
    render() {
      return h(Component, { data });
    },
  };

  app = createApp(wrapper);
  apps.set(node, app);
  app.mount(node);
}

registerPresenter('@vue', vuePresenter);

export default { registerComponent, getComponent, hasComponent };
