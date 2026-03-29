//#region src/constants.js
const ATTRIBUTES = {
	TRIGGER: "mt-on",
	CONTROLLER: "mt-controller",
	REQUEST_METHOD: "mt-method",
	REQUEST_PATH: "mt-path",
	REQUEST_DATA: "mt-data",
	PRESENTER: "mt-pr",
	EVENT_PREFIX: "mx-",
	MX_CONTROLLER: "mx-controller",
	MX_METHOD: "mx-method",
	MX_PATH: "mx-path",
	MX_DATA: "mx-data"
};
const MODIFIERS = {
	PREVENT: "prevent",
	STOP: "stop",
	ONCE: "once",
	SELF: "self",
	DEBOUNCE: "debounce",
	THROTTLE: "throttle",
	CAPTURE: "capture",
	PASSIVE: "passive",
	WINDOW: "window",
	DOCUMENT: "document",
	OUTSIDE: "outside"
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
async function inner(node, response) {
	node.innerHTML = await response.text();
}
async function outer(node, response) {
	node.outerHTML = await response.text();
}
async function byId(node, response, id, option) {
	const elementNode = document.getElementById(id);
	if (option === OUTER) {
		outer(elementNode, response);
		return;
	}
	inner(elementNode, response);
}
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
async function append(node, response) {
	node.insertAdjacentHTML("beforeend", await response.text());
}
async function prepend(node, response) {
	node.insertAdjacentHTML("afterbegin", await response.text());
}
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
function registerPresenter(name, handler) {
	PRESENTERS[name] = handler;
}
function getPresenter(name) {
	return PRESENTERS[name];
}
function hasPresenter(name) {
	return name in PRESENTERS;
}
async function present(node, response, presentation, target, option) {
	if (presentation) {
		const presenter$1 = PRESENTERS[presentation];
		if (presenter$1) {
			await presenter$1(node, response, target, option);
			return;
		}
		console.warn(`Presenter "${presentation}" not found`);
		await inner(node, response);
		return;
	}
	if (!node.hasAttribute(ATTRIBUTES.PRESENTER)) {
		await inner(node, response);
		return;
	}
	const [action, whatever, opt] = node.getAttribute(ATTRIBUTES.PRESENTER).split(":");
	const presenter = PRESENTERS[action];
	if (presenter) await presenter(node, response, whatever, opt);
	else {
		console.warn(`Presenter "${action}" not found`);
		await inner(node, response);
	}
}

//#endregion
//#region src/capabilities.js
const capabilities = /* @__PURE__ */ new Map();
function registerCapability(name, handler) {
	capabilities.set(name, handler);
}
function getCapability(name) {
	return capabilities.get(name);
}
function hasCapability(name) {
	return capabilities.has(name);
}
function removeCapability(name) {
	capabilities.delete(name);
}
function clearCapabilities() {
	capabilities.clear();
}
async function executeCapability(name, method, node, event, parsedEvent) {
	const capability = capabilities.get(name);
	if (!capability) {
		console.warn(`Capability "${name}" not found. Did you forget to register it?`);
		return null;
	}
	if (typeof capability === "function") return await capability(node, method, event, parsedEvent);
	if (typeof capability === "object" && capability[method]) return await capability[method](node, event, parsedEvent);
	console.warn(`Method "${method}" not found on capability "${name}"`);
	return null;
}
async function executeActionOrCapability(parsedEvent, node, event) {
	const { action, capability, method, presentation, target, presentationOption } = parsedEvent;
	let response = null;
	if (action && actions_default[action]) response = await actions_default[action](node, null, event);
	else if (capability) response = await executeCapability(capability, method, node, event, parsedEvent);
	else if (action === "@event") response = event;
	if (response) await present(node, response, presentation, target, presentationOption);
	return response;
}
var capabilities_default = {
	register: registerCapability,
	get: getCapability,
	has: hasCapability,
	remove: removeCapability,
	clear: clearCapabilities,
	execute: executeCapability,
	executeActionOrCapability
};

//#endregion
//#region src/events.js
const DUMMY_EVENT = new Event("__dummy__");
function applyModifiers(event, modifiers) {
	if (modifiers.includes(MODIFIERS.PREVENT)) event.preventDefault();
	if (modifiers.includes(MODIFIERS.STOP)) event.stopPropagation();
	if (modifiers.includes(MODIFIERS.STOP)) event.stopImmediatePropagation();
}
function createDebouncedHandler(handler, wait) {
	let timeoutId = null;
	return function(event, ...args) {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => handler.call(this, event, ...args), wait);
	};
}
function createThrottledHandler(handler, wait) {
	let lastTime = 0;
	return function(event, ...args) {
		const now = Date.now();
		if (now - lastTime >= wait) {
			lastTime = now;
			return handler.call(this, event, ...args);
		}
	};
}
function wrapHandlerWithModifiers(handler, parsedEvent) {
	const { modifiers, debounceMs, throttleMs } = parsedEvent;
	let wrappedHandler = handler;
	if (debounceMs) wrappedHandler = createDebouncedHandler(wrappedHandler, debounceMs);
	if (throttleMs) wrappedHandler = createThrottledHandler(wrappedHandler, throttleMs);
	return async (event, node) => {
		applyModifiers(event, modifiers);
		if (modifiers.includes(MODIFIERS.SELF) && event.target !== node) return;
		if (modifiers.includes(MODIFIERS.ONCE)) node.removeEventListener(parsedEvent.event, wrappedHandler);
		return wrappedHandler(event, node);
	};
}
function getEventTarget(node, modifiers) {
	if (modifiers.includes(MODIFIERS.WINDOW)) return window;
	if (modifiers.includes(MODIFIERS.DOCUMENT)) return document;
	return node;
}
async function attachEventHandler(node, parsedEvent) {
	const { event, modifiers } = parsedEvent;
	const handler = async (originalEvent) => {
		return await executeActionOrCapability(parsedEvent, node, originalEvent);
	};
	const wrappedHandler = wrapHandlerWithModifiers(handler, parsedEvent);
	const target = getEventTarget(node, modifiers);
	const listenerOptions = {
		capture: modifiers.includes(MODIFIERS.CAPTURE),
		passive: modifiers.includes(MODIFIERS.PASSIVE),
		once: modifiers.includes(MODIFIERS.ONCE)
	};
	const eventHandler = (e) => wrappedHandler(e, node);
	if (modifiers.includes(MODIFIERS.OUTSIDE)) {
		const outsideHandler = (e) => {
			if (!node.contains(e.target)) wrappedHandler(e, node);
		};
		document.addEventListener("click", outsideHandler, listenerOptions);
		return;
	}
	target.addEventListener(event, eventHandler, listenerOptions);
}
function click(node, action, options) {
	node.addEventListener("click", async (event) => {
		event.preventDefault();
		event.stopPropagation();
		const response = await actions_default[action](node, options, event);
		if (!response) return;
		present(node, response);
	});
}
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
async function load(node, action, options) {
	const response = await actions_default[action](node, options, DUMMY_EVENT);
	if (!response) return;
	present(node, response, options);
}
function mouseover(node, action, options) {
	node.addEventListener("mouseover", async (event) => {
		event.preventDefault();
		event.stopPropagation();
		const response = await actions_default[action](node, options, event);
		if (!response) return;
		present(node, response);
	});
}
function mouseenter(node, action, options) {
	node.addEventListener("mouseenter", async (event) => {
		event.preventDefault();
		event.stopPropagation();
		const response = await actions_default[action](node, options, event);
		if (!response) return;
		present(node, response);
	});
}
function mouseleave(node, action, options) {
	node.addEventListener("mouseleave", async (event) => {
		event.preventDefault();
		event.stopPropagation();
		const response = await actions_default[action](node, options, event);
		if (!response) return;
		present(node, response);
	});
}
const legacyEvents = {
	click,
	submit,
	load,
	mouseover,
	mouseenter,
	mouseleave
};
function handleLegacyEvent(eventName, node, action, options) {
	if (legacyEvents[eventName]) legacyEvents[eventName](node, action, options);
}

//#endregion
//#region src/parser.js
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
function parseEventAttribute(attrName, attrValue) {
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
			parsedModifiers.push("debounce");
			remaining = remaining.replace(debounceMatch[0], "");
		}
		const throttleMatch = remaining.match(/(?:^|\.)throttle(?:\.(\d+)ms)?/);
		if (throttleMatch) {
			throttleMs = throttleMatch[1] ? parseInt(throttleMatch[1], 10) : 250;
			parsedModifiers.push("throttle");
			remaining = remaining.replace(throttleMatch[0], "");
		}
		const otherModifiers = remaining.split(".").filter((m) => m.length > 0);
		parsedModifiers.push(...otherModifiers);
	}
	const valueParts = attrValue.split(":");
	let capability = null;
	let method = null;
	let action = null;
	const actionOrCapability = valueParts[0];
	if (actionOrCapability.startsWith("@")) action = actionOrCapability;
	else if (actionOrCapability.includes(".")) {
		const [cap, meth] = actionOrCapability.split(".");
		capability = cap;
		method = meth;
	} else capability = actionOrCapability;
	let presentation = "@inner";
	let target = null;
	let presentationOption = null;
	if (valueParts.length >= 2) presentation = valueParts[1];
	if (valueParts.length >= 3) target = valueParts[2];
	if (valueParts.length >= 4) presentationOption = valueParts[3];
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
		throttleMs
	};
}
/**
* Check if an attribute name is an mx-* event attribute.
* 
* @param {string} attrName - The attribute name to check
* @returns {boolean} True if it's an mx-* event attribute
*/
function isEventAttribute(attrName) {
	return /^mx-\w+/.test(attrName);
}
/**
* Get all mx-* event attributes from an element.
* 
* @param {HTMLElement} element - The DOM element
* @returns {Array<{name: string, value: string}>} Array of attribute name/value pairs
*/
function getEventAttributes(element) {
	const attrs = [];
	if (!element || !element.attributes) return attrs;
	for (const attr of element.attributes) if (isEventAttribute(attr.name)) attrs.push({
		name: attr.name,
		value: attr.value
	});
	return attrs;
}
/**
* Parse all mx-* event attributes from an element.
* 
* @param {HTMLElement} element - The DOM element
* @returns {Array<ParsedEvent>} Array of parsed event configurations
*/
function parseAllEventAttributes(element) {
	return getEventAttributes(element).map(({ name, value }) => parseEventAttribute(name, value)).filter((parsed) => parsed !== null);
}

//#endregion
//#region src/mate.js
const OBSERVER_CONFIG = {
	childList: true,
	subtree: true,
	attributes: true
};
function initController(node, attrName) {
	const controller$1 = node.getAttribute(attrName);
	if (controller$1 && window[controller$1]) node.mtController = new window[controller$1](node);
}
function processNode(node) {
	if (!node.querySelectorAll) return;
	node.querySelectorAll(`[${ATTRIBUTES.TRIGGER}]`).forEach((subNode) => {
		const [event, action, option] = subNode.getAttribute(ATTRIBUTES.TRIGGER).split(":");
		handleLegacyEvent(event, subNode, action, option);
	});
	node.querySelectorAll(`[${ATTRIBUTES.CONTROLLER}]`).forEach((subNode) => {
		initController(subNode, ATTRIBUTES.CONTROLLER);
	});
	node.querySelectorAll(`[${ATTRIBUTES.MX_CONTROLLER}]`).forEach((subNode) => {
		initController(subNode, ATTRIBUTES.MX_CONTROLLER);
	});
	node.querySelectorAll("*").forEach((el) => {
		parseAllEventAttributes(el).forEach((parsed) => {
			attachEventHandler(el, parsed);
		});
	});
	if (node.hasAttribute && node.hasAttribute(ATTRIBUTES.TRIGGER)) {
		const [event, action, option] = node.getAttribute(ATTRIBUTES.TRIGGER).split(":");
		handleLegacyEvent(event, node, action, option);
	}
	if (node.hasAttribute) {
		initController(node, ATTRIBUTES.CONTROLLER);
		initController(node, ATTRIBUTES.MX_CONTROLLER);
		parseAllEventAttributes(node).forEach((parsed) => {
			attachEventHandler(node, parsed);
		});
	}
}
function processMutations(mutations) {
	mutations.forEach((mutation) => {
		if (mutation.type !== "childList") return;
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
mate.registerCapability = capabilities_default.register;
mate.getCapability = capabilities_default.get;
mate.hasCapability = capabilities_default.has;
mate.removeCapability = capabilities_default.remove;
mate.registerPresenter = registerPresenter;
mate.getPresenter = getPresenter;
mate.hasPresenter = hasPresenter;
var mate_default = mate;

//#endregion
//#region src/main.js
/**
* Starts the Mate application.
*/
mate_default();

//#endregion