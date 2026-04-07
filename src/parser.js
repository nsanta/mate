/**
 * Parser for mx-* event-centric shorthand syntax.
 * 
 * Syntax: mx-{EVENT}[.modifiers]="{ACTION|CAPABILITY.method}[:{PRESENTATION}[:{TARGET}]]"
 * 
 * Examples:
 *   mx-click="@request:@inner"
 *   mx-click="@request:@id:target-div"
 *   mx-click.prevent="@request:@inner"
 *   mx-click.debounce.300ms="@request:@inner"
 *   mx-click="Analytics.track:@inner"
 *   mx-click="Tooltip.toggle"
 *   mx-click="@event:@controller:toggle"
 */

/**
 * @typedef {Object} ParsedEvent
 * @property {string} event - The DOM event name (click, submit, load, etc.)
 * @property {string[]} modifiers - Array of modifiers (prevent, stop, debounce, etc.)
 * @property {string|null} capability - Custom capability name (e.g., "Analytics")
 * @property {string|null} method - Method on capability (e.g., "track")
 * @property {string|null} action - Built-in action (@request, @event)
 * @property {string} presentation - Presentation mode (@inner, @outer, @id, etc.)
 * @property {string|null} target - Target for presentation (element ID, class, etc.)
 * @property {string|null} presentationOption - Additional option for presentation
 * @property {number|null} debounceMs - Debounce timing in milliseconds
 * @property {number|null} throttleMs - Throttle timing in milliseconds
 */

/**
 * Parse an mx-* attribute name and value into a structured object.
 * 
 * @param {string} attrName - The attribute name (e.g., "mx-click.prevent")
 * @param {string} attrValue - The attribute value (e.g., "@request:@id:target")
 * @returns {ParsedEvent|null} Parsed event configuration or null if invalid
 */
export function parseEventAttribute(attrName, attrValue) {
  const nameMatch = attrName.match(/^mx-(\w+)(?:\.(.*))?$/);
  if (!nameMatch) return null;

  const [, event, modifiersStr] = nameMatch;
  
  let debounceMs = null;
  let throttleMs = null;
  const parsedModifiers = [];
  
  if (modifiersStr) {
    let remaining = modifiersStr;
    
    const debounceMatch = remaining.match(/(?:^|\.)debounce(?:\.(\d+)ms)?/);
    if (debounceMatch) {
      debounceMs = debounceMatch[1] ? parseInt(debounceMatch[1], 10) : 250;
      parsedModifiers.push('debounce');
      remaining = remaining.replace(debounceMatch[0], '');
    }
    
    const throttleMatch = remaining.match(/(?:^|\.)throttle(?:\.(\d+)ms)?/);
    if (throttleMatch) {
      throttleMs = throttleMatch[1] ? parseInt(throttleMatch[1], 10) : 250;
      parsedModifiers.push('throttle');
      remaining = remaining.replace(throttleMatch[0], '');
    }
    
    const otherModifiers = remaining.split('.').filter(m => m.length > 0);
    parsedModifiers.push(...otherModifiers);
  }

  const valueParts = attrValue.split(':');
  
  let capability = null;
  let method = null;
  let action = null;
  
  const actionOrCapability = valueParts[0];
  
  if (actionOrCapability.startsWith('@')) {
    action = actionOrCapability;
  } else if (actionOrCapability.includes('.')) {
    const [cap, meth] = actionOrCapability.split('.');
    capability = cap;
    method = meth;
  } else {
    capability = actionOrCapability;
  }

  let presentation = '@inner';
  let target = null;
  let presentationOption = null;

  if (valueParts.length >= 2) {
    presentation = valueParts[1];
  }
  
  if (valueParts.length >= 3) {
    target = valueParts[2];
  }
  
  if (valueParts.length >= 4) {
    presentationOption = valueParts[3];
  }

  return {
    event,
    modifiers: parsedModifiers,
    capability,
    method,
    action,
    presentation,
    target,
    presentationOption,
    debounceMs,
    throttleMs,
  };
}

/**
 * Check if an attribute name is an mx-* event attribute.
 * 
 * @param {string} attrName - The attribute name to check
 * @returns {boolean} True if it's an mx-* event attribute
 */
export function isEventAttribute(attrName) {
  return /^mx-\w+/.test(attrName);
}

/**
 * Get all mx-* event attributes from an element.
 * 
 * @param {HTMLElement} element - The DOM element
 * @returns {Array<{name: string, value: string}>} Array of attribute name/value pairs
 */
export function getEventAttributes(element) {
  const attrs = [];
  if (!element || !element.attributes) return attrs;
  for (const attr of element.attributes) {
    if (isEventAttribute(attr.name)) {
      attrs.push({ name: attr.name, value: attr.value });
    }
  }
  return attrs;
}

/**
 * Parse all mx-* event attributes from an element.
 * 
 * @param {HTMLElement} element - The DOM element
 * @returns {Array<ParsedEvent>} Array of parsed event configurations
 */
export function parseAllEventAttributes(element) {
  const eventAttrs = getEventAttributes(element);
  return eventAttrs
    .map(({ name, value }) => parseEventAttribute(name, value))
    .filter(parsed => parsed !== null);
}

export default {
  parseEventAttribute,
  isEventAttribute,
  getEventAttributes,
  parseAllEventAttributes,
};
