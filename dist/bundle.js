//#region src/constants.js
/**
* Defines the custom attributes used by the library to bind events and data.
* @constant {Object}
*/
const ATTRIBUTES = {
	TRIGGER: "mt-on",
	CONTROLLER: "mt-controller",
	REQUEST_METHOD: "mt-method",
	REQUEST_PATH: "mt-path",
	REQUEST_DATA: "mt-data",
	PRESENTER: "mt-pr"
};

//#endregion
//#region src/actions.js
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
		headers: {}
	};
	if (!["GET", "HEAD"].includes(requestOptions.method)) if (node.tagName === "FORM") {
		const formData = new FormData(node);
		const params = new URLSearchParams();
		for (const pair of formData) params.append(pair[0], pair[1]);
		requestOptions.body = params;
	} else {
		const jsonData = JSON.parse(node.getAttribute(ATTRIBUTES.REQUEST_DATA) || "{}");
		requestOptions.body = JSON.stringify(jsonData);
		requestOptions.headers["Content-Type"] = "application/json";
	}
	return await fetch(node.getAttribute(ATTRIBUTES.REQUEST_PATH), requestOptions);
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
var actions_default = {
	"@request": request,
	"@event": triggerEvent
};

//#endregion
//#region src/presenter.js
const OUTER = "outer";
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
	if (option === OUTER) {
		outer(elementNode, response);
		return;
	}
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
		if (option === OUTER) {
			element.outerHTML = result;
			return;
		}
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
	node.insertAdjacentHTML("beforeend", await response.text());
}
/**
* Prepends the response text to the node.
* 
* @async
* @param {HTMLElement} node - The DOM element.
* @param {Response} response - The fetch response.
*/
async function prepend(node, response) {
	node.insertAdjacentHTML("afterbegin", await response.text());
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
	"@inner": inner,
	"@outer": outer,
	"@id": byId,
	"@class": byClass,
	"@append": append,
	"@prepend": prepend,
	"@controller": controller
};
/**
* Dispatches the response to the appropriate presenter based on attributes.
* 
* @param {HTMLElement} node - The DOM element.
* @param {Response} response - The fetch response.
*/
function present(node, response) {
	if (!node.hasAttribute(ATTRIBUTES.PRESENTER)) {
		inner(node, response);
		return;
	}
	const [action, whatever, option] = node.getAttribute(ATTRIBUTES.PRESENTER).split(":");
	PRESENTERS[action](node, response, whatever, option);
}

//#endregion
//#region src/events.js
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
		const response = await actions_default[action](node, options, event);
		if (!response) return;
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
	if (node.tagName !== "FORM") return;
	node.addEventListener("submit", async (event) => {
		event.preventDefault();
		event.stopPropagation();
		const response = await actions_default[action](node, options, event);
		if (!response) return;
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
	const response = await actions_default[action](node, options, DUMMY_EVENT);
	if (!response) return;
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
		const response = await actions_default[action](node, options, event);
		if (!response) return;
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
		const response = await actions_default[action](node, options, event);
		if (!response) return;
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
		const response = await actions_default[action](node, options, event);
		if (!response) return;
		present(node, response);
	});
}
var events_default = {
	click,
	submit,
	load,
	mouseover,
	mouseenter,
	mouseleave
};

//#endregion
//#region src/mate.js
const OBSERVER_CONFIG = {
	childList: true,
	subtree: true,
	attributes: true
};
/**
* Initializes event listeners and controllers for a node and its children.
* 
* @param {HTMLElement} node - The DOM element to initialize.
*/
function mateize(node) {
	node.querySelectorAll(`[${ATTRIBUTES.TRIGGER}]`).forEach((subNode) => {
		const [event$1, action$1, option$1] = subNode.getAttribute(ATTRIBUTES.TRIGGER).split(":");
		events_default[event$1](subNode, action$1, option$1);
	});
	node.querySelectorAll(`[${ATTRIBUTES.CONTROLLER}]`).forEach((subNode) => {
		const controller$1 = subNode.getAttribute(ATTRIBUTES.CONTROLLER);
		subNode.mtController = new window[controller$1](subNode);
	});
	if (!node.hasAttribute || !node.hasAttribute(ATTRIBUTES.TRIGGER)) return;
	const [event, action, option] = node.getAttribute(ATTRIBUTES.TRIGGER).split(":");
	events_default[event](node, action, option);
}
/**
* Processes DOM mutations to initialize new nodes.
* 
* @param {MutationRecord[]} mutations - List of mutation records.
*/
function processMutations(mutations) {
	mutations.forEach((mutation) => {
		if (mutation.type !== "childList") return;
		mutation.addedNodes.forEach((node) => {
			mateize(node);
		});
	});
}
/**
* Initializes the Mate library, observing the document for changes.
*/
function mate() {
	const observer = new MutationObserver(processMutations);
	document.addEventListener("DOMContentLoaded", () => {
		observer.observe(document, OBSERVER_CONFIG);
		mateize(document);
	});
}

//#endregion
//#region src/main.js
/**
* Starts the Mate application.
*/
mate();

//#endregion