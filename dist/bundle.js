//#region src/constants.js
const ATTRIBUTES = {
	CONTROLLER: "mt-controller",
	REQUEST_METHOD: "mt-method",
	REQUEST_PATH: "mt-path",
	REQUEST_DATA: "mt-data",
	HEADER_META: "mt-header",
	EVENT_PREFIX: "mx-"
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
		const presenter = PRESENTERS[presentation];
		if (presenter) {
			await presenter(node, response, target, option);
			return;
		}
		console.warn(`Presenter "${presentation}" not found`);
		await inner(node, response);
		return;
	}
	await inner(node, response);
}

//#endregion
//#region src/actions.js
/**
* Default configuration options for requests.
* @constant {Object}
*/
const DEFAULT_OPTIONS = { method: "GET" };
function collectMetaHeaders() {
	const headers = {};
	document.querySelectorAll(`meta[${ATTRIBUTES.HEADER_META}]`).forEach((meta) => {
		const name = meta.getAttribute("name");
		const content = meta.getAttribute("content");
		if (name && content) headers[name] = content;
	});
	return headers;
}
/**
* Performs an HTTP request based on element's attributes.
*
* @async
* @param {HTMLElement} node - The DOM element triggering the request.
* @param {Object} options - Additional options for request.
* @param {Event} event - The event that triggered the action.
* @returns {Promise<Response>} The fetch response.
*/
async function request(node, options, event) {
	const requestOptions = {
		method: node.getAttribute(ATTRIBUTES.REQUEST_METHOD) || DEFAULT_OPTIONS.method,
		headers: collectMetaHeaders()
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
/**
* Streaming response class that mimics Response interface for presenter compatibility.
*/
var StreamResponse = class {
	constructor() {
		this.chunks = [];
		this.isComplete = false;
	}
	text() {
		return Promise.resolve(this.chunks.join(""));
	}
	append(chunk) {
		this.chunks.push(chunk);
		this.isComplete = false;
	}
	complete() {
		this.isComplete = true;
	}
};
/**
* Performs an HTTP Stream request for real-time updates.
*
* @async
* @param {HTMLElement} node - The DOM element triggering the stream.
* @param {Object} options - Additional options (presentation, target, etc.).
* @param {Event} event - The event that triggered the action.
* @returns {Promise<StreamResponse>} The stream response object.
*/
async function stream(node, options, event) {
	const url = node.getAttribute(ATTRIBUTES.REQUEST_PATH);
	const method = node.getAttribute(ATTRIBUTES.REQUEST_METHOD) || "GET";
	if (!url) {
		console.error("@stream requires mt-path attribute");
		return null;
	}
	const streamResponse = new StreamResponse();
	const abortController = new AbortController();
	node._streamAbortController = abortController;
	try {
		const response = await fetch(url, {
			method,
			headers: collectMetaHeaders(),
			signal: abortController.signal
		});
		if (!response.ok || !response.body) throw new Error(`Stream failed: ${response.status}`);
		const reader = response.body.getReader();
		const decoder = new TextDecoder("utf-8");
		let buffer = "";
		let isFirstChunk = true;
		const { presentation, target, presentationOption } = options || {};
		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				if (buffer) {
					streamResponse.append(buffer);
					if (!isFirstChunk) await updateDOM(node, buffer, presentation, target, presentationOption);
				}
				streamResponse.complete();
				break;
			}
			buffer += decoder.decode(value, { stream: true });
			let newlineIndex;
			while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
				const line = buffer.slice(0, newlineIndex);
				buffer = buffer.slice(newlineIndex + 1);
				if (line) {
					streamResponse.append(line);
					if (isFirstChunk) {
						isFirstChunk = false;
						await updateDOM(node, line, presentation, target, presentationOption);
					} else await updateDOM(node, line, presentation, target, presentationOption, true);
				}
			}
		}
	} catch (error) {
		if (error.name === "AbortError") console.log("Stream cancelled");
		else console.error("Stream error:", error);
	} finally {
		node._streamAbortController = null;
	}
	return streamResponse;
}
/**
* Helper function to update DOM with streamed content.
*/
async function updateDOM(node, content, presentation, target, presentationOption, isUpdate = false) {
	const targetElement = target ? (target.startsWith("#") ? document.getElementById(target.slice(1)) : document.querySelector(target)) || node : node;
	if (!targetElement) {
		console.warn("Target element not found");
		return;
	}
	switch (presentation) {
		case "@inner":
		case void 0:
			if (isUpdate) targetElement.innerHTML += content;
			else targetElement.innerHTML = content;
			break;
		case "@append":
			targetElement.insertAdjacentHTML("beforeend", content);
			break;
		case "@prepend":
			targetElement.insertAdjacentHTML("afterbegin", content);
			break;
		case "@id":
			if (target) {
				const elem = document.getElementById(target);
				if (elem) if (isUpdate) elem.innerHTML += content;
				else elem.innerHTML = content;
			}
			break;
		default: if (presentation && presentation.startsWith("@")) await present(node, { text: () => Promise.resolve(content) }, presentation, target, presentationOption);
	}
}
/**
* WebSocket client for bidirectional communication.
*/
var WebSocketClient = class {
	constructor(url) {
		this.url = url;
		this.ws = null;
		this._manualClose = false;
		this._reconnectDelay = 1e3;
		this._maxDelay = 3e4;
		this._backoffGrow = 1.5;
	}
	connect(node, options) {
		if (this.ws) this._teardown();
		this._manualClose = false;
		this.ws = new WebSocket(this.url);
		this.ws.binaryType = "arraybuffer";
		this.ws.onopen = () => {
			this._resetBackoff();
			this._handleMessage(node, {
				type: "connected",
				data: "Connected"
			}, options);
		};
		this.ws.onmessage = (ev) => {
			let data;
			if (typeof ev.data === "string") try {
				data = JSON.parse(ev.data);
			} catch {
				data = ev.data;
			}
			else if (ev.data instanceof ArrayBuffer) data = {
				type: "binary",
				data: ev.data
			};
			else data = ev.data;
			this._handleMessage(node, {
				type: "message",
				data
			}, options);
		};
		this.ws.onerror = (ev) => {
			this._handleMessage(node, {
				type: "error",
				data: ev
			}, options);
		};
		this.ws.onclose = (ev) => {
			this._scheduleReconnectIfNeeded(node, options);
			this._handleMessage(node, {
				type: "closed",
				data: ev
			}, options);
		};
	}
	_handleMessage(node, message, options) {
		const { presentation, target, presentationOption } = options || {};
		updateDOM(node, typeof message.data === "object" ? JSON.stringify(message.data) : String(message.data), presentation, target, presentationOption, true);
	}
	_scheduleReconnectIfNeeded(node, options) {
		if (this._manualClose) return;
		const jitter = Math.min(this._maxDelay, this._reconnectDelay) * (Math.random() * .5 + .5);
		setTimeout(() => {
			this._reconnectDelay = Math.min(this._maxDelay, this._reconnectDelay * this._backoffGrow);
			this.connect(node, options);
		}, jitter);
	}
	_resetBackoff() {
		this._reconnectDelay = Math.max(1e3, this._reconnectDelay / this._backoffGrow);
	}
	close() {
		this._manualClose = true;
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
	}
	send(data) {
		if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(typeof data === "string" ? data : JSON.stringify(data));
	}
	_teardown() {
		if (this.ws) {
			this.ws.onopen = null;
			this.ws.onmessage = null;
			this.ws.onerror = null;
			this.ws.onclose = null;
			this.ws.close();
			this.ws = null;
		}
	}
};
/**
* Establishes a WebSocket connection for bidirectional communication.
*
* @async
* @param {HTMLElement} node - The DOM element.
* @param {Object} options - Presentation options.
* @param {Event} event - The event that triggered the action.
* @returns {Promise<Object>} WebSocket client instance.
*/
async function ws(node, options, event) {
	const url = node.getAttribute(ATTRIBUTES.REQUEST_PATH);
	if (!url) {
		console.error("@ws requires mt-path attribute");
		return null;
	}
	if (node._wsClient) node._wsClient.close();
	const client = new WebSocketClient(url);
	node._wsClient = client;
	client.connect(node, options);
	return client;
}
/**
* SSE client for server-sent events.
*/
var SSEClient = class {
	constructor(url) {
		this.url = url;
		this._es = null;
		this._reconnectDelay = 1e3;
		this._maxDelay = 3e4;
		this._backoffGrow = 1.5;
	}
	start(node, options) {
		this.stop();
		this._es = new EventSource(this.url);
		this._es.onopen = () => {
			this._resetBackoff();
			const { presentation, target, presentationOption } = options || {};
			updateDOM(node, "Connected", presentation, target, presentationOption, true);
		};
		this._es.onmessage = (ev) => {
			let data = ev.data;
			try {
				data = JSON.parse(data);
			} catch {}
			const { presentation, target, presentationOption } = options || {};
			updateDOM(node, typeof data === "object" ? JSON.stringify(data) : String(data), presentation, target, presentationOption, true);
		};
		this._es.onerror = (ev) => {
			this._scheduleReconnectIfNeeded(node, options);
			const { presentation, target, presentationOption } = options || {};
			updateDOM(node, "Error connecting", presentation, target, presentationOption, true);
		};
	}
	_scheduleReconnectIfNeeded(node, options) {
		const jitter = Math.min(this._maxDelay, this._reconnectDelay) * (Math.random() * .5 + .5);
		setTimeout(() => {
			this._reconnectDelay = Math.min(this._maxDelay, this._reconnectDelay * this._backoffGrow);
			this.start(node, options);
		}, jitter);
	}
	_resetBackoff() {
		this._reconnectDelay = Math.max(1e3, this._reconnectDelay / this._backoffGrow);
	}
	stop() {
		if (this._es) {
			this._es.close();
			this._es = null;
		}
	}
};
/**
* Establishes a Server-Sent Events connection for real-time updates.
*
* @async
* @param {HTMLElement} node - The DOM element.
* @param {Object} options - Presentation options.
* @param {Event} event - The event that triggered the action.
* @returns {Promise<Object>} SSE client instance.
*/
async function sse(node, options, event) {
	const url = node.getAttribute(ATTRIBUTES.REQUEST_PATH);
	if (!url) {
		console.error("@sse requires mt-path attribute");
		return null;
	}
	if (node._sseClient) node._sseClient.stop();
	const client = new SSEClient(url);
	node._sseClient = client;
	client.start(node, options);
	return client;
}
var actions_default = {
	"@request": request,
	"@event": triggerEvent,
	"@stream": stream,
	"@ws": ws,
	"@sse": sse
};

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
	if (response) await present(node, response instanceof Response || typeof response === "object" && response !== null && "text" in response ? response : { text: () => Promise.resolve(String(response)) }, presentation, target, presentationOption);
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
	if (event === "load") return wrappedHandler(DUMMY_EVENT, node);
	const commonOptions = {
		capture: modifiers.includes(MODIFIERS.CAPTURE),
		passive: modifiers.includes(MODIFIERS.PASSIVE)
	};
	if (modifiers.includes(MODIFIERS.OUTSIDE)) {
		const outsideHandler = (e) => {
			if (!node.contains(e.target)) {
				wrappedHandler(e, node);
				if (modifiers.includes(MODIFIERS.ONCE)) document.removeEventListener("click", outsideHandler, commonOptions);
			}
		};
		document.addEventListener("click", outsideHandler, commonOptions);
		return;
	}
	const target = getEventTarget(node, modifiers);
	const eventHandler = (e) => wrappedHandler(e, node);
	target.addEventListener(event, eventHandler, {
		...commonOptions,
		once: modifiers.includes(MODIFIERS.ONCE)
	});
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
	node.querySelectorAll(`[${ATTRIBUTES.CONTROLLER}]`).forEach((subNode) => {
		initController(subNode, ATTRIBUTES.CONTROLLER);
	});
	node.querySelectorAll("*").forEach((el) => {
		parseAllEventAttributes(el).forEach((parsed) => {
			attachEventHandler(el, parsed);
		});
	});
	if (node.hasAttribute) {
		initController(node, ATTRIBUTES.CONTROLLER);
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