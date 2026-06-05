---
sidebar_position: 10
---

# Server-Sent Events (`@sse`)

The `@sse` action opens a Server-Sent Events connection for unidirectional real-time updates from the server. SSE is lighter than WebSocket and works over plain HTTP, making it ideal for live feeds, notifications, and streaming dashboards.

## Usage

```html
<button mx-click="@sse" mx-path="/sse">
  Connect SSE
</button>

<div id="sse-output">Waiting for SSE connection...</div>
```

## Server Contract

The server must respond with `Content-Type: text/event-stream` and emit messages in the SSE wire format:

```
data: {"message": "hello"}\n\n
```

Example Express endpoint:

```javascript
app.get('/sse', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // disable proxy buffering
  });

  res.write(`data: ${JSON.stringify({ message: 'Connected' })}\n\n`);

  let count = 0;
  const interval = setInterval(() => {
    count++;
    res.write(`data: ${JSON.stringify({ count })}\n\n`);
  }, 2000);

  req.on('close', () => clearInterval(interval));
});
```

## Stopping the Connection

The SSE client is attached to the triggering node as `_sseClient`. Call `.stop()` to disconnect:

```javascript
const node = document.querySelector('[mx-click="@sse"]');
if (node && node._sseClient) {
  node._sseClient.stop();
}
```

Stopping is registered as a cleanup, so calling the [`mate()` teardown function](./lifecycle.md) closes every active SSE connection.

## Choosing between `@stream`, `@ws`, and `@sse`

| Action | Direction | Best for |
|--------|-----------|-----------|
| `@stream` | Server → Client (one-shot) | Streaming a single HTTP response to completion (logs, AI tokens, progressive render) |
| `@sse` | Server → Client (long-lived) | Live feeds, notifications, dashboards where the server pushes updates over time |
| `@ws` | Bidirectional | Chat, collaboration, real-time games — anywhere the client also needs to send |
