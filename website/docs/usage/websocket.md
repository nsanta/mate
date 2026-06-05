---
sidebar_position: 9
---

# WebSocket (`@ws`)

The `@ws` action opens a WebSocket connection for bidirectional communication, with automatic reconnection using exponential backoff.

## Usage

```html
<button mx-click="@ws" mx-path="ws://localhost:3001/ws">
  Connect
</button>

<div id="ws-output">Waiting for WebSocket...</div>
```

Every incoming message is rendered through the configured presenter (`@inner` by default, `@append` is common for log-style feeds).

## Sending Messages

The WebSocket client is attached to the triggering node as `_wsClient`. Use its `.send()` method to push data:

```javascript
const node = document.querySelector('[mx-click="@ws"]');
if (node && node._wsClient) {
  node._wsClient.send({ type: 'client', message: 'Hello!' });
}
```

`.send()` accepts any value; objects are JSON-stringified automatically.

## Disconnecting

```javascript
const node = document.querySelector('[mx-click="@ws"]');
if (node && node._wsClient) {
  node._wsClient.close();
}
```

Closing via `.close()` also disables automatic reconnection. Disconnecting is registered as a cleanup, so calling the [`mate()` teardown function](./lifecycle.md) closes every active WebSocket.

## Server Example

```javascript
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ noServer: true });
server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
});

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'connected', time: new Date().toISOString() }));
  ws.on('message', (data) => ws.send(`Echo: ${data.toString()}`));
});
```
