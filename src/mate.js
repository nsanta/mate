import { attachEventHandler } from './events.js';
import { ATTRIBUTES } from './constants.js';
import { parseAllEventAttributes } from './parser.js';
import capabilities from './capabilities.js';
import controllers from './controllers.js';
import { registerPresenter, getPresenter, hasPresenter } from './presenter.js';
import { runCleanups } from './cleanup.js';

const OBSERVER_CONFIG = { childList: true, subtree: true };

function initController(node, attrName) {
  const name = node.getAttribute(attrName);
  if (!name) return;
  const ControllerClass = controllers.resolve(name);
  if (ControllerClass) {
    node.mxController = new ControllerClass(node);
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
  if (processMutations.disabled) return;
  mutations.forEach((mutation) => {
    if (mutation.type !== 'childList') { return; }
    mutation.addedNodes.forEach((node) => {
      processNode(node);
    });
  });
}

function mate() {
  processMutations.disabled = false;
  const observer = new MutationObserver(processMutations);

  const onReady = () => {
    observer.observe(document, OBSERVER_CONFIG);
    processNode(document);
  };

  document.addEventListener('DOMContentLoaded', onReady);

  return function teardown() {
    document.removeEventListener('DOMContentLoaded', onReady);
    processMutations.disabled = true;
    observer.disconnect();
    runCleanups();
  };
}

mate.registerCapability = capabilities.register;
mate.getCapability = capabilities.get;
mate.hasCapability = capabilities.has;
mate.removeCapability = capabilities.remove;
mate.registerController = controllers.register;
mate.getController = controllers.get;
mate.hasController = controllers.has;
mate.removeController = controllers.remove;
mate.clearControllers = controllers.clear;
mate.registerPresenter = registerPresenter;
mate.getPresenter = getPresenter;
mate.hasPresenter = hasPresenter;

export default mate;
