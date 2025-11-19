import { ATTRIBUTES } from './constants.js';

/**
 * Default configuration options for requests.
 * @constant {Object}
 */
const DEFAULT_OPTIONS = { method: "GET" };

/**
 * Performs an HTTP request based on the element's attributes.
 * 
 * @async
 * @param {HTMLElement} node - The DOM element triggering the request.
 * @param {Object} options - Additional options for the request.
 * @param {Event} event - The event that triggered the action.
 * @returns {Promise<Response>} The fetch response.
 */
async function request(node, options, event) {
  const requestOptions = {
    method: node.getAttribute(ATTRIBUTES.REQUEST_METHOD) || DEFAULT_OPTIONS.method,
    headers: {},
  };

  if (!['GET', 'HEAD'].includes(requestOptions.method)) {
    if (node.tagName === 'FORM') {
      const formData = new FormData(node);
      const params = new URLSearchParams();
      for (const pair of formData) {
        params.append(pair[0], pair[1]);
      }
      requestOptions.body = params;
    } else {
      const jsonData = JSON.parse(node.getAttribute(ATTRIBUTES.REQUEST_DATA) || '{}');
      requestOptions.body = JSON.stringify(jsonData);
      requestOptions.headers['Content-Type'] = 'application/json';
    }
  }

  return await fetch(
    node.getAttribute(ATTRIBUTES.REQUEST_PATH),
    requestOptions,
  );
}

/**
 * Triggers a custom event or simply passes the event through.
 * 
 * @async
 * @param {HTMLElement} node - The DOM element.
 * @param {Object} options - Options for the event.
 * @param {Event} event - The original event.
 * @returns {Promise<Event>} The event object.
 */
async function triggerEvent(node, options, event) {
  return event;
}


export default {
  "@request": request,
  "@event": triggerEvent,
};