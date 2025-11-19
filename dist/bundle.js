//#region src/constants.js
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
const DEFAULT_OPTIONS = { method: "GET" };
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
async function controller(node, response, func) {
	node.mtController[func](response);
}
const PRESENTERS = {
	"@inner": inner,
	"@outer": outer,
	"@id": byId,
	"@class": byClass,
	"@controller": controller
};
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
var events_default = {
	click,
	submit,
	load,
	mouseover
};

//#endregion
//#region src/mate.js
const OBSERVER_CONFIG = {
	childList: true,
	subtree: true,
	attributes: true
};
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
function processMutations(mutations) {
	mutations.forEach((mutation) => {
		if (mutation.type !== "childList") return;
		mutation.addedNodes.forEach((node) => {
			mateize(node);
		});
	});
}
function mate() {
	const observer = new MutationObserver(processMutations);
	document.addEventListener("DOMContentLoaded", () => {
		observer.observe(document, OBSERVER_CONFIG);
		mateize(document);
	});
}

//#endregion
//#region src/main.js
mate();

//#endregion