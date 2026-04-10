import { attachEventHandler } from './events.js';
import { ATTRIBUTES } from './constants.js';
import { parseAllEventAttributes } from './parser.js';
import capabilities from './capabilities.js';
import { registerPresenter, getPresenter, hasPresenter } from './presenter.js';

const OBSERVER_CONFIG = { childList: true, subtree: true, attributes: true };

function initController(node, attrName) {
  const controller = node.getAttribute(attrName);
  if (controller && window[controller]) {
    const controllerInstance = new window[controller](node);
    node.mxController = controllerInstance;
  }
}

function processNode(node) {
  if (!node.querySelectorAll) return;
  
  node.querySelectorAll(`[${ATTRIBUTES.CONTROLLER}]`).forEach((subNode) => {
    initController(subNode, ATTRIBUTES.CONTROLLER);
  });

  const allElements = node.querySelectorAll('*');
  allElements.forEach((el) => {
    const parsedEvents = parseAllEventAttributes(el);
    parsedEvents.forEach((parsed) => {
      attachEventHandler(el, parsed);
    });
  });

  if (node.hasAttribute) {
    initController(node, ATTRIBUTES.CONTROLLER);
    
    const parsedEvents = parseAllEventAttributes(node);
    parsedEvents.forEach((parsed) => {
      attachEventHandler(node, parsed);
    });
  }
}

function processMutations(mutations) {
  mutations.forEach((mutation) => {
    if (mutation.type !== "childList") { return; }
    mutation.addedNodes.forEach((node) => {
      processNode(node);
    });
  });
}

function mate() {
  const observer = new MutationObserver(processMutations);

  document.addEventListener("DOMContentLoaded", () => {
    observer.observe(document, OBSERVER_CONFIG);
    processNode(document);
  });
}

mate.registerCapability = capabilities.register;
mate.getCapability = capabilities.get;
mate.hasCapability = capabilities.has;
mate.removeCapability = capabilities.remove;
mate.registerPresenter = registerPresenter;
mate.getPresenter = getPresenter;
mate.hasPresenter = hasPresenter;

export default mate;
