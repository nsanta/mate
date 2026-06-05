---
sidebar_position: 8
---

# HTTP Streams (`@stream`)

The `@stream` action streams an HTTP response incrementally, updating the DOM as each chunk arrives. Perfect for streaming logs, chat feeds, or progressive data load.

## Usage

```html
<button mx-click="@stream" mx-path="/stream">
  Start Stream
</button>

<!-- Append each chunk instead of replacing -->
<button mx-click="@stream:@append" mx-path="/stream">
  Stream and Append
</button>

<!-- Stream into another element by ID -->
<button mx-click="@stream:@id:log" mx-path="/stream">
  Stream to Log
</button>

<div id="log">Waiting for stream...</div>
```

## Server Contract

The server should send **newline-delimited text**. Each line becomes one update:

```
Stream message 1
Stream message 2
Stream message 3
```

For example, an Express endpoint:

```javascript
app.get('/stream', (req, res) => {
  res.set({ 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' });
  let i = 0;
  const interval = setInterval(() => {
    if (i < 10) { res.write(`Event ${i++}\n`); }
    else { clearInterval(interval); res.end(); }
  }, 500);
  req.on('close', () => clearInterval(interval));
});
```

## Stopping a Stream

The stream attaches an `AbortController` to the triggering node as `_streamAbortController`. Abort it to cancel:

```javascript
const node = document.querySelector('[mx-click="@stream"]');
if (node && node._streamAbortController) {
  node._streamAbortController.abort();
}
```

The same controller is registered as a cleanup, so calling the [`mate()` teardown function](./lifecycle.md) also stops every active stream.
