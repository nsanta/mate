import events from './events.js';
import { ATTRIBUTES } from './constants.js';

const OBSERVER_CONFIG = { childList: true, subtree: true, attributes: true }

/**
 * Initializes event listeners and controllers for a node and its children.
 * 
 * @param {HTMLElement} node - The DOM element to initialize.
 */
function mateize(node) {
  node.querySelectorAll(`[${ATTRIBUTES.TRIGGER}]`).forEach((subNode) => {
    const [event, action, option] = subNode.getAttribute(ATTRIBUTES.TRIGGER).split(":");
    events[event](subNode, action, option);
  });

  node.querySelectorAll(`[${ATTRIBUTES.CONTROLLER}]`).forEach((subNode) => {
    const controller = subNode.getAttribute(ATTRIBUTES.CONTROLLER);
    const controllerInstance = new window[controller](subNode);
    subNode.mtController = controllerInstance;
  });

  if (!node.hasAttribute || !node.hasAttribute(ATTRIBUTES.TRIGGER)) { return; }
  const [event, action, option] = node.getAttribute(ATTRIBUTES.TRIGGER).split(":");
  events[event](node, action, option);
}

/**
 * Processes DOM mutations to initialize new nodes.
 * 
 * @param {MutationRecord[]} mutations - List of mutation records.
 */
function processMutations(mutations) {
  mutations.forEach((mutation) => {
    if (mutation.type !== "childList") { return; }
    mutation.addedNodes.forEach((node) => {
      mateize(node);
    });
  });
};

/**
 * Initializes the Mate library, observing the document for changes.
 */
export default function mate() {
  const observer = new MutationObserver(processMutations);

  document.addEventListener("DOMContentLoaded", () => {
    observer.observe(document, OBSERVER_CONFIG);
    mateize(document);
  })
}