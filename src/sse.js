import { ATTRIBUTES } from './constants.js';
import { registerCleanup } from './cleanup.js';
import { updateDOM } from './update-dom.js';

class SSEClient {
  constructor(url) {
    this.url = url;
    this._es = null;
    this._manualClose = false;
    this._reconnectDelay = 1000;
    this._maxDelay = 30000;
    this._backoffGrow = 1.5;
  }

  start(node, options) {
    this.stop();
    this._manualClose = false;

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
      } catch (_e) {
        void _e;
      }
      const { presentation, target, presentationOption } = options || {};
      const content = typeof data === 'object' ? JSON.stringify(data) : String(data);
      updateDOM(node, content, presentation, target, presentationOption, true);
    };

    this._es.onerror = () => {
      if (this._es) {
        this._es.close();
        this._es = null;
      }
      this._scheduleReconnectIfNeeded(node, options);
      const { presentation, target, presentationOption } = options || {};
      updateDOM(node, 'Error connecting', presentation, target, presentationOption, true);
    };
  }

  _scheduleReconnectIfNeeded(node, options) {
    if (this._manualClose) return;
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
    this._manualClose = true;
    if (this._es) {
      this._es.close();
      this._es = null;
    }
  }
}

export async function sse(node, options, _event) {
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

  registerCleanup(() => client.stop());

  return client;
}
