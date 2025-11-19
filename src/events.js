import actions from './actions.js';
import { present } from './presenter.js';

const DUMMY_EVENT = new Event("__dummy__");

/**
 * Attaches a click event listener to the node.
 * 
 * @param {HTMLElement} node - The DOM element.
 * @param {string} action - The action to perform.
 * @param {string} options - Options for the action.
 */
function click(node, action, options) {
  node.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const response = await actions[action](node, options, event);
    if (!response) { return; }
    present(node, response);
  });
}

/**
 * Attaches a submit event listener to the node (must be a FORM).
 * 
 * @param {HTMLElement} node - The DOM element.
 * @param {string} action - The action to perform.
 * @param {string} options - Options for the action.
 */
function submit(node, action, options) {
  if (node.tagName !== 'FORM') { return }
  node.addEventListener("submit", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const response = await actions[action](node, options, event);
    if (!response) { return; }
    present(node, response);
  });
}

/**
 * Triggers an action immediately (simulating a load event).
 * 
 * @async
 * @param {HTMLElement} node - The DOM element.
 * @param {string} action - The action to perform.
 * @param {string} options - Options for the action.
 */
async function load(node, action, options) {
  const response = await actions[action](node, options, DUMMY_EVENT);
  if (!response) { return; }
  present(node, response, options);
}

/**
 * Attaches a mouseover event listener to the node.
 * 
 * @param {HTMLElement} node - The DOM element.
 * @param {string} action - The action to perform.
 * @param {string} options - Options for the action.
 */
function mouseover(node, action, options) {
  node.addEventListener("mouseover", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const response = await actions[action](node, options, event);
    if (!response) { return; }
    present(node, response);
  });
}

/**
 * Attaches a mouseenter event listener to the node.
 * 
 * @param {HTMLElement} node - The DOM element.
 * @param {string} action - The action to perform.
 * @param {string} options - Options for the action.
 */
function mouseenter(node, action, options) {
  node.addEventListener("mouseenter", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const response = await actions[action](node, options, event);
    if (!response) { return; }
    present(node, response);
  });
}

/**
 * Attaches a mouseleave event listener to the node.
 * 
 * @param {HTMLElement} node - The DOM element.
 * @param {string} action - The action to perform.
 * @param {string} options - Options for the action.
 */
function mouseleave(node, action, options) {
  node.addEventListener("mouseleave", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const response = await actions[action](node, options, event);
    if (!response) { return; }
    present(node, response);
  });
}



export default {
  click,
  submit,
  load,
  mouseover,
  mouseenter,
  mouseleave,
}