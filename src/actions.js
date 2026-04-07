import { ATTRIBUTES } from './constants.js';
import { present } from './presenter.js';

/**
 * Default configuration options for requests.
 * @constant {Object}
 */
const DEFAULT_OPTIONS = { method: "GET" };

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

/**
 * Streaming response class that mimics Response interface for presenter compatibility.
 */
class StreamResponse {
  constructor() {
    this.chunks = [];
    this.isComplete = false;
  }

  text() {
    return Promise.resolve(this.chunks.join(''));
  }

  append(chunk) {
    this.chunks.push(chunk);
    this.isComplete = false;
  }

  complete() {
    this.isComplete = true;
  }
}

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
  const method = node.getAttribute(ATTRIBUTES.REQUEST_METHOD) || 'GET';

  if (!url) {
    console.error('@stream requires mx-path attribute');
    return null;
  }

  const streamResponse = new StreamResponse();
  const abortController = new AbortController();

  node._streamAbortController = abortController;

  try {
    const response = await fetch(url, {
      method,
      signal: abortController.signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`Stream failed: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let isFirstChunk = true;

    const { presentation, target, presentationOption } = options || {};

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        if (buffer) {
          streamResponse.append(buffer);
          if (!isFirstChunk) {
            await updateDOM(node, buffer, presentation, target, presentationOption);
          }
        }
        streamResponse.complete();
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line) {
          streamResponse.append(line);

          if (isFirstChunk) {
            isFirstChunk = false;
            await updateDOM(node, line, presentation, target, presentationOption);
          } else {
            await updateDOM(node, line, presentation, target, presentationOption, true);
          }
        }
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Stream cancelled');
    } else {
      console.error('Stream error:', error);
    }
  } finally {
    node._streamAbortController = null;
  }

  return streamResponse;
}

/**
 * Helper function to update DOM with streamed content.
 */
async function updateDOM(node, content, presentation, target, presentationOption, isUpdate = false) {
  const targetElement = target ? (target.startsWith('#')
    ? document.getElementById(target.slice(1))
    : document.querySelector(target)) || node
    : node;

  if (!targetElement) {
    console.warn('Target element not found');
    return;
  }

  switch (presentation) {
    case '@inner':
    case undefined:
      if (isUpdate) {
        targetElement.innerHTML += content;
      } else {
        targetElement.innerHTML = content;
      }
      break;
    case '@append':
      targetElement.insertAdjacentHTML('beforeend', content);
      break;
    case '@prepend':
      targetElement.insertAdjacentHTML('afterbegin', content);
      break;
    case '@id':
      if (target) {
        const elem = document.getElementById(target);
        if (elem) {
          if (isUpdate) {
            elem.innerHTML += content;
          } else {
            elem.innerHTML = content;
          }
        }
      }
      break;
    default:
      if (presentation && presentation.startsWith('@')) {
        const mockResponse = { text: () => Promise.resolve(content) };
        await present(node, mockResponse, presentation, target, presentationOption);
      }
  }
}

/**
 * WebSocket client for bidirectional communication.
 */
class WebSocketClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this._manualClose = false;
    this._reconnectDelay = 1000;
    this._maxDelay = 30000;
    this._backoffGrow = 1.5;
  }

  connect(node, options) {
    if (this.ws) this._teardown();

    this._manualClose = false;
    this.ws = new WebSocket(this.url);
    this.ws.binaryType = "arraybuffer";

    this.ws.onopen = () => {
      this._resetBackoff();
      this._handleMessage(node, { type: 'connected', data: 'Connected' }, options);
    };

    this.ws.onmessage = (ev) => {
      let data;
      if (typeof ev.data === "string") {
        try {
          data = JSON.parse(ev.data);
        } catch {
          data = ev.data;
        }
      } else if (ev.data instanceof ArrayBuffer) {
        data = { type: "binary", data: ev.data };
      } else {
        data = ev.data;
      }
      this._handleMessage(node, { type: 'message', data }, options);
    };

    this.ws.onerror = (ev) => {
      this._handleMessage(node, { type: 'error', data: ev }, options);
    };

    this.ws.onclose = (ev) => {
      this._scheduleReconnectIfNeeded(node, options);
      this._handleMessage(node, { type: 'closed', data: ev }, options);
    };
  }

  _handleMessage(node, message, options) {
    const { presentation, target, presentationOption } = options || {};
    const content = typeof message.data === 'object'
      ? JSON.stringify(message.data)
      : String(message.data);

    updateDOM(node, content, presentation, target, presentationOption, true);
  }

  _scheduleReconnectIfNeeded(node, options) {
    if (this._manualClose) return;
    const delay = Math.min(this._maxDelay, this._reconnectDelay);
    const jitter = delay * (Math.random() * 0.5 + 0.5);
    setTimeout(() => {
      this._reconnectDelay = Math.min(this._maxDelay, this._reconnectDelay * this._backoffGrow);
      this.connect(node, options);
    }, jitter);
  }

  _resetBackoff() {
    this._reconnectDelay = Math.max(1000, this._reconnectDelay / this._backoffGrow);
  }

  close() {
    this._manualClose = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(typeof data === "string" ? data : JSON.stringify(data));
    }
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
}

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
    console.error('@ws requires mx-path attribute');
    return null;
  }

  if (node._wsClient) {
    node._wsClient.close();
  }

  const client = new WebSocketClient(url);
  node._wsClient = client;
  client.connect(node, options);

  return client;
}

/**
 * SSE client for server-sent events.
 */
class SSEClient {
  constructor(url) {
    this.url = url;
    this._es = null;
    this._reconnectDelay = 1000;
    this._maxDelay = 30000;
    this._backoffGrow = 1.5;
  }

  start(node, options) {
    this.stop();

    this._es = new EventSource(this.url);

    this._es.onopen = () => {
      this._resetBackoff();
      const { presentation, target, presentationOption } = options || {};
      updateDOM(node, 'Connected', presentation, target, presentationOption, true);
    };

    this._es.onmessage = (ev) => {
      let data = ev.data;
      try {
        data = JSON.parse(data);
      } catch {
      }
      const { presentation, target, presentationOption } = options || {};
      const content = typeof data === 'object' ? JSON.stringify(data) : String(data);
      updateDOM(node, content, presentation, target, presentationOption, true);
    };

    this._es.onerror = (ev) => {
      this._scheduleReconnectIfNeeded(node, options);
      const { presentation, target, presentationOption } = options || {};
      updateDOM(node, 'Error connecting', presentation, target, presentationOption, true);
    };
  }

  _scheduleReconnectIfNeeded(node, options) {
    const delay = Math.min(this._maxDelay, this._reconnectDelay);
    const jitter = delay * (Math.random() * 0.5 + 0.5);
    setTimeout(() => {
      this._reconnectDelay = Math.min(this._maxDelay, this._reconnectDelay * this._backoffGrow);
      this.start(node, options);
    }, jitter);
  }

  _resetBackoff() {
    this._reconnectDelay = Math.max(1000, this._reconnectDelay / this._backoffGrow);
  }

  stop() {
    if (this._es) {
      this._es.close();
      this._es = null;
    }
  }
}

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
    console.error('@sse requires mx-path attribute');
    return null;
  }

  if (node._sseClient) {
    node._sseClient.stop();
  }

  const client = new SSEClient(url);
  node._sseClient = client;
  client.start(node, options);

  return client;
}


export default {
  "@request": request,
  "@event": triggerEvent,
  "@stream": stream,
  "@ws": ws,
  "@sse": sse,
};
