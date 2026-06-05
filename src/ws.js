import { ATTRIBUTES } from './constants.js';
import { registerCleanup } from './cleanup.js';
import { updateDOM } from './update-dom.js';

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
    this.ws.binaryType = 'arraybuffer';

    this.ws.onopen = () => {
      this._resetBackoff();
      this._handleMessage(node, { type: 'connected', data: 'Connected' }, options);
    };

    this.ws.onmessage = (ev) => {
      let data;
      if (typeof ev.data === 'string') {
        try {
          data = JSON.parse(ev.data);
        } catch {
          data = ev.data;
        }
      } else if (ev.data instanceof ArrayBuffer) {
        data = { type: 'binary', size: ev.data.byteLength };
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
    const content =
      typeof message.data === 'object' ? JSON.stringify(message.data) : String(message.data);

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
      this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
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

export async function ws(node, options, _event) {
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

  registerCleanup(() => client.close());

  return client;
}
