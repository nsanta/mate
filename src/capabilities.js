import actions from './actions.js';
import { present } from './presenter.js';

const capabilities = new Map();

export function registerCapability(name, handler) {
  capabilities.set(name, handler);
}

export function getCapability(name) {
  return capabilities.get(name);
}

export function hasCapability(name) {
  return capabilities.has(name);
}

export function removeCapability(name) {
  capabilities.delete(name);
}

export function clearCapabilities() {
  capabilities.clear();
}

export async function executeCapability(name, method, node, event, parsedEvent) {
  const capability = capabilities.get(name);
  if (!capability) {
    console.warn(`Capability "${name}" not found. Did you forget to register it?`);
    return null;
  }

  if (typeof capability === 'function') {
    return await capability(node, method, event, parsedEvent);
  }

  if (typeof capability === 'object' && capability[method]) {
    return await capability[method](node, event, parsedEvent);
  }

  console.warn(`Method "${method}" not found on capability "${name}"`);
  return null;
}

export async function executeActionOrCapability(parsedEvent, node, event) {
  const { action, capability, method, presentation, target, presentationOption } = parsedEvent;

  let response = null;

  if (action && actions[action]) {
    response = await actions[action](node, null, event);
  } else if (capability) {
    response = await executeCapability(capability, method, node, event, parsedEvent);
  } else if (action === '@event') {
    response = event;
  }

  if (response) {
    await present(node, response, presentation, target, presentationOption);
  }

  return response;
}

export default {
  register: registerCapability,
  get: getCapability,
  has: hasCapability,
  remove: removeCapability,
  clear: clearCapabilities,
  execute: executeCapability,
  executeActionOrCapability,
};
