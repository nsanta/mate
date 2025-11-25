import { ATTRIBUTES } from './constants.js';

const INNER = 'inner';
const OUTER = 'outer';

/**
 * Updates the innerHTML of the node with the response text.
 * 
 * @async
 * @param {HTMLElement} node - The DOM element.
 * @param {Response} response - The fetch response.
 */
async function inner(node, response) {
  node.innerHTML = await response.text();
}

/**
 * Updates the outerHTML of the node with the response text.
 * 
 * @async
 * @param {HTMLElement} node - The DOM element.
 * @param {Response} response - The fetch response.
 */
async function outer(node, response) {
  node.outerHTML = await response.text();
}

/**
 * Updates an element by ID with the response text.
 * 
 * @async
 * @param {HTMLElement} node - The DOM element (unused).
 * @param {Response} response - The fetch response.
 * @param {string} id - The ID of the target element.
 * @param {string} option - 'inner' or 'outer'.
 */
async function byId(node, response, id, option) {
  const elementNode = document.getElementById(id);
  if (option === OUTER) { outer(elementNode, response); return; }
  inner(elementNode, response);
}

/**
 * Updates elements by class name with the response text.
 * 
 * @async
 * @param {HTMLElement} node - The DOM element (unused).
 * @param {Response} response - The fetch response.
 * @param {string} klass - The class name of the target elements.
 * @param {string} option - 'inner' or 'outer'.
 */
async function byClass(node, response, klass, option) {
  const result = await response.text();
  Array.from(document.getElementsByClassName(klass)).forEach((element) => {
    if (option === OUTER) { element.outerHTML = result; return; }
    element.innerHTML = result;
  });
}

/**
 * Appends the response text to the node.
 * 
 * @async
 * @param {HTMLElement} node - The DOM element.
 * @param {Response} response - The fetch response.
 */
async function append(node, response) {
  node.insertAdjacentHTML('beforeend', await response.text());
}

/**
 * Prepends the response text to the node.
 * 
 * @async
 * @param {HTMLElement} node - The DOM element.
 * @param {Response} response - The fetch response.
 */
async function prepend(node, response) {
  node.insertAdjacentHTML('afterbegin', await response.text());
}

/**
 * Calls a method on the node's controller with the response.
 * 
 * @async
 * @param {HTMLElement} node - The DOM element.
 * @param {Response} response - The fetch response.
 * @param {string} func - The name of the function to call on the controller.
 */
async function controller(node, response, func) {
  node.mtController[func](response);
}

const PRESENTERS = {
  '@inner': inner,
  '@outer': outer,
  '@id': byId,
  '@class': byClass,
  '@append': append,
  '@prepend': prepend,
  '@controller': controller,
}

/**
 * Dispatches the response to the appropriate presenter based on attributes.
 * 
 * @param {HTMLElement} node - The DOM element.
 * @param {Response} response - The fetch response.
 */
export function present(node, response) {
  if (!node.hasAttribute(ATTRIBUTES.PRESENTER)) { inner(node, response); return; }
  const present = node.getAttribute(ATTRIBUTES.PRESENTER);
  const [action, whatever, option] = present.split(":");
  PRESENTERS[action](node, response, whatever, option);
}
