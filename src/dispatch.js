export async function triggerEvent(_node, _options, event) {
  return event;
}

export async function trigger(node, options, _event) {
  const { presentation: eventName, target } = options || {};

  if (!eventName || eventName.startsWith('@')) {
    console.warn(`@trigger requires an event name (e.g., @trigger:submit). Found: "${eventName}"`);
    return null;
  }

  const eventToTrigger = new Event(eventName, { bubbles: true, cancelable: true });
  const targetElement = target ? document.querySelector(target) : node;

  if (targetElement) {
    targetElement.dispatchEvent(eventToTrigger);
  } else {
    console.warn(`@trigger target "${target}" not found`);
  }

  return null;
}
