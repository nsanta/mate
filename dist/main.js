import { i as registerPresenter, n as hasPresenter, r as present, t as getPresenter } from "./presenter-BkdNu_2s.js";
//#region src/constants.js
const ATTRIBUTES = {
	CONTROLLER: "mx-controller",
	REQUEST_METHOD: "mx-method",
	REQUEST_PATH: "mx-path",
	REQUEST_DATA: "mx-data",
	HEADER_META: "mx-header",
	EVENT_PREFIX: "mx-"
};
const MODIFIERS = {
	PREVENT: "prevent",
	STOP: "stop",
	STOP_IMMEDIATE: "stopImmediate",
	ONCE: "once",
	SELF: "self",
	DEBOUNCE: "debounce",
	THROTTLE: "throttle",
	CAPTURE: "capture",
	PASSIVE: "passive",
	WINDOW: "window",
	DOCUMENT: "document",
	OUTSIDE: "outside",
	ENTER: "enter",
	TAB: "tab",
	ESC: "esc",
	SPACE: "space",
	CTRL: "ctrl",
	SHIFT: "shift",
	ALT: "alt",
	META: "meta",
	LEFT: "left",
	MIDDLE: "middle",
	RIGHT: "right"
};
const KEY_MAP = {
	enter: "Enter",
	tab: "Tab",
	esc: "Escape",
	space: " "
};
const SYSTEM_KEYS = {
	ctrl: "ctrlKey",
	shift: "shiftKey",
	alt: "altKey",
	meta: "metaKey"
};
const MOUSE_BUTTONS = {
	left: 0,
	middle: 1,
	right: 2
};
//#endregion
//#region src/request.js
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
function extractFormData(node, format) {
	const form = node instanceof HTMLFormElement ? node : node.closest("form");
	if (!form) {
		console.warn(`@form:${format} requested but no form found for element`, node);
		return null;
	}
	const formData = new FormData(form);
	if (format === "multipart") return formData;
	if (format === "form") return new URLSearchParams(formData);
	if (format === "json") {
		const data = {};
		for (const [key, value] of formData) if (data[key] !== void 0) {
			if (!Array.isArray(data[key])) data[key] = [data[key]];
			data[key].push(value);
		} else data[key] = value;
		return JSON.stringify(data);
	}
	return null;
}
async function request(node, _options, _event) {
	const requestOptions = {
		method: node.getAttribute(ATTRIBUTES.REQUEST_METHOD) || DEFAULT_OPTIONS.method,
		headers: collectMetaHeaders()
	};
	const mxData = node.getAttribute(ATTRIBUTES.REQUEST_DATA);
	const isFormFormat = mxData && mxData.startsWith("@form:");
	if (["GET", "HEAD"].includes(requestOptions.method) && mxData) console.warn(`mx-data is ignored when method is ${requestOptions.method} (HTTP GET/HEAD must not have a body). Use POST/PUT/PATCH instead.`);
	if (!["GET", "HEAD"].includes(requestOptions.method)) if (isFormFormat) {
		const format = mxData.split(":")[1];
		const body = extractFormData(node, format);
		if (body) {
			requestOptions.body = body;
			if (format === "json") requestOptions.headers["Content-Type"] = "application/json";
		}
	} else if (node.tagName === "FORM") requestOptions.body = extractFormData(node, "form");
	else {
		const jsonData = JSON.parse(node.getAttribute(ATTRIBUTES.REQUEST_DATA) || "{}");
		requestOptions.body = JSON.stringify(jsonData);
		requestOptions.headers["Content-Type"] = "application/json";
	}
	const url = node.getAttribute(ATTRIBUTES.REQUEST_PATH);
	try {
		return await fetch(url, requestOptions);
	} catch (error) {
		console.error(`@request to "${url}" failed:`, error.message);
		node.dispatchEvent(new CustomEvent("mx-error", {
			detail: {
				error,
				url,
				method: requestOptions.method
			},
			bubbles: true,
			cancelable: true
		}));
		return null;
	}
}
//#endregion
//#region src/dispatch.js
async function triggerEvent(_node, _options, event) {
	return event;
}
async function trigger(node, options, _event) {
	const { presentation: eventName, target } = options || {};
	if (!eventName || eventName.startsWith("@")) {
		console.warn(`@trigger requires an event name (e.g., @trigger:submit). Found: "${eventName}"`);
		return null;
	}
	const eventToTrigger = new Event(eventName, {
		bubbles: true,
		cancelable: true
	});
	const targetElement = target ? document.querySelector(target) : node;
	if (targetElement) targetElement.dispatchEvent(eventToTrigger);
	else console.warn(`@trigger target "${target}" not found`);
	return null;
}
//#endregion
//#region src/cleanup.js
const cleanups = [];
function registerCleanup(fn) {
	cleanups.push(fn);
}
function runCleanups() {
	while (cleanups.length) {
		const fn = cleanups.pop();
		try {
			fn();
		} catch (e) {
			console.error("Cleanup failed:", e);
		}
	}
}
//#endregion
//#region src/update-dom.js
async function updateDOM(node, content, presentation, target, presentationOption, isUpdate = false) {
	if (!isUpdate) {
		await present(node, { text: () => Promise.resolve(content) }, presentation, target, presentationOption);
		return;
	}
	switch (presentation) {
		case "@inner":
		case void 0:
			node.innerHTML += content;
			break;
		case "@append":
			node.insertAdjacentHTML("beforeend", content);
			break;
		case "@prepend":
			node.insertAdjacentHTML("afterbegin", content);
			break;
		case "@id":
			if (target) {
				const elem = document.getElementById(target);
				if (elem) elem.innerHTML += content;
			}
			break;
		default: if (presentation && presentation.startsWith("@")) await present(node, { text: () => Promise.resolve(content) }, presentation, target, presentationOption);
	}
}
//#endregion
//#region src/stream.js
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
async function stream(node, options, _event) {
	const url = node.getAttribute(ATTRIBUTES.REQUEST_PATH);
	const method = node.getAttribute(ATTRIBUTES.REQUEST_METHOD) || "GET";
	if (!url) {
		console.error("@stream requires mx-path attribute");
		return null;
	}
	const streamResponse = new StreamResponse();
	const abortController = new AbortController();
	node._streamAbortController = abortController;
	registerCleanup(() => abortController.abort());
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
//#endregion
//#region src/ws.js
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
				size: ev.data.byteLength
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
async function ws(node, options, _event) {
	const url = node.getAttribute(ATTRIBUTES.REQUEST_PATH);
	if (!url) {
		console.error("@ws requires mx-path attribute");
		return null;
	}
	if (node._wsClient) node._wsClient.close();
	const client = new WebSocketClient(url);
	node._wsClient = client;
	client.connect(node, options);
	registerCleanup(() => client.close());
	return client;
}
//#endregion
//#region src/sse.js
var SSEClient = class {
	constructor(url) {
		this.url = url;
		this._es = null;
		this._manualClose = false;
		this._reconnectDelay = 1e3;
		this._maxDelay = 3e4;
		this._backoffGrow = 1.5;
	}
	start(node, options) {
		this.stop();
		this._manualClose = false;
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
			} catch (_e) {}
			const { presentation, target, presentationOption } = options || {};
			updateDOM(node, typeof data === "object" ? JSON.stringify(data) : String(data), presentation, target, presentationOption, true);
		};
		this._es.onerror = () => {
			if (this._es) {
				this._es.close();
				this._es = null;
			}
			this._scheduleReconnectIfNeeded(node, options);
			const { presentation, target, presentationOption } = options || {};
			updateDOM(node, "Error connecting", presentation, target, presentationOption, true);
		};
	}
	_scheduleReconnectIfNeeded(node, options) {
		if (this._manualClose) return;
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
		this._manualClose = true;
		if (this._es) {
			this._es.close();
			this._es = null;
		}
	}
};
async function sse(node, options, _event) {
	const url = node.getAttribute(ATTRIBUTES.REQUEST_PATH);
	if (!url) {
		console.error("@sse requires mx-path attribute");
		return null;
	}
	if (node._sseClient) node._sseClient.stop();
	const client = new SSEClient(url);
	node._sseClient = client;
	client.start(node, options);
	registerCleanup(() => client.stop());
	return client;
}
//#endregion
//#region src/actions.js
var actions_default = {
	"@request": request,
	"@event": triggerEvent,
	"@passthrough": triggerEvent,
	"@trigger": trigger,
	"@dispatch": trigger,
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
	if (action && actions_default[action]) response = await actions_default[action](node, parsedEvent, event);
	else if (capability) response = await executeCapability(capability, method, node, event, parsedEvent);
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
function applyModifiers(event, modifiers) {
	if (modifiers.includes(MODIFIERS.PREVENT)) event.preventDefault();
	if (modifiers.includes(MODIFIERS.STOP)) event.stopPropagation();
	if (modifiers.includes(MODIFIERS.STOP_IMMEDIATE)) event.stopImmediatePropagation();
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
	const { event: eventName, modifiers, debounceMs, throttleMs } = parsedEvent;
	let wrappedHandler = handler;
	if (debounceMs) wrappedHandler = createDebouncedHandler(wrappedHandler, debounceMs);
	if (throttleMs) wrappedHandler = createThrottledHandler(wrappedHandler, throttleMs);
	return async (event, node) => {
		if (eventName === "submit") event.preventDefault();
		applyModifiers(event, modifiers);
		if (modifiers.includes(MODIFIERS.SELF) && event.target !== node) return;
		if (!matchesKeyModifiers(event, modifiers)) return;
		if (!matchesSystemKeyModifiers(event, modifiers)) return;
		if (!matchesMouseModifiers(event, modifiers)) return;
		return wrappedHandler(event, node);
	};
}
function matchesKeyModifiers(event, modifiers) {
	const active = modifiers.filter((m) => m in KEY_MAP);
	if (active.length === 0) return true;
	return active.some((m) => event.key === KEY_MAP[m]);
}
function matchesSystemKeyModifiers(event, modifiers) {
	const active = modifiers.filter((m) => m in SYSTEM_KEYS);
	if (active.length === 0) return true;
	return active.every((m) => event[SYSTEM_KEYS[m]]);
}
function matchesMouseModifiers(event, modifiers) {
	const active = modifiers.filter((m) => m in MOUSE_BUTTONS);
	if (active.length === 0) return true;
	return active.some((m) => event.button === MOUSE_BUTTONS[m]);
}
function getEventTarget(node, modifiers) {
	if (modifiers.includes(MODIFIERS.WINDOW)) return window;
	if (modifiers.includes(MODIFIERS.DOCUMENT)) return document;
	return node;
}
/**
* Resolve the native DOM event name to listen to.
* In real browsers, right-click fires 'contextmenu' and middle-click fires
* 'auxclick' — not 'click'. When mx-click is used with .right or .middle we
* must subscribe to those events instead.
*/
function resolveNativeEvent(eventName, modifiers) {
	if (eventName !== "click") return eventName;
	if (modifiers.includes(MODIFIERS.RIGHT)) return "contextmenu";
	if (modifiers.includes(MODIFIERS.MIDDLE)) return "auxclick";
	return eventName;
}
async function attachEventHandler(node, parsedEvent) {
	const { event, modifiers } = parsedEvent;
	const handler = async (originalEvent) => {
		return await executeActionOrCapability(parsedEvent, node, originalEvent);
	};
	const wrappedHandler = wrapHandlerWithModifiers(handler, parsedEvent);
	if (event === "load") {
		if (modifiers.includes(MODIFIERS.WINDOW) || modifiers.includes(MODIFIERS.DOCUMENT)) {
			const target = getEventTarget(node, modifiers);
			const loadHandler = () => {
				const fakeEvent = new Event("load");
				Object.defineProperty(fakeEvent, "target", {
					value: node,
					configurable: true
				});
				wrappedHandler(fakeEvent, node);
			};
			target.addEventListener("load", loadHandler, { once: modifiers.includes(MODIFIERS.ONCE) });
			return;
		}
		const fakeEvent = new Event("load");
		Object.defineProperty(fakeEvent, "target", {
			value: node,
			configurable: true
		});
		return wrappedHandler(fakeEvent, node);
	}
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
	const nativeEvent = resolveNativeEvent(event, modifiers);
	target.addEventListener(nativeEvent, eventHandler, {
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
	const nameMatch = attrName.match(/^mx-([\w-]+)(?:\.(.*))?$/);
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
	return /^mx-[\w-]+/.test(attrName);
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
//#region src/controllers.js
const controllers = /* @__PURE__ */ new Map();
function registerController(name, controllerClass) {
	controllers.set(name, controllerClass);
}
function getController(name) {
	return controllers.get(name);
}
function hasController(name) {
	return controllers.has(name);
}
function removeController(name) {
	controllers.delete(name);
}
function clearControllers() {
	controllers.clear();
}
function resolveController(name) {
	return controllers.get(name) ?? window[name];
}
var controllers_default = {
	register: registerController,
	get: getController,
	has: hasController,
	remove: removeController,
	clear: clearControllers,
	resolve: resolveController
};
//#endregion
//#region src/mate.js
const OBSERVER_CONFIG = {
	childList: true,
	subtree: true
};
function initController(node, attrName) {
	const name = node.getAttribute(attrName);
	if (!name) return;
	const ControllerClass = controllers_default.resolve(name);
	if (ControllerClass) node.mxController = new ControllerClass(node);
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
	if (processMutations.disabled) return;
	mutations.forEach((mutation) => {
		if (mutation.type !== "childList") return;
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
	document.addEventListener("DOMContentLoaded", onReady);
	return function teardown() {
		document.removeEventListener("DOMContentLoaded", onReady);
		processMutations.disabled = true;
		observer.disconnect();
		runCleanups();
	};
}
mate.registerCapability = capabilities_default.register;
mate.getCapability = capabilities_default.get;
mate.hasCapability = capabilities_default.has;
mate.removeCapability = capabilities_default.remove;
mate.registerController = controllers_default.register;
mate.getController = controllers_default.get;
mate.hasController = controllers_default.has;
mate.removeController = controllers_default.remove;
mate.clearControllers = controllers_default.clear;
mate.registerPresenter = registerPresenter;
mate.getPresenter = getPresenter;
mate.hasPresenter = hasPresenter;
//#endregion
//#region src/main.js
/**
* Starts the Mate application.
*/
mate();
var main_default = mate;
//#endregion
export { main_default as default };
