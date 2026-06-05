---
sidebar_position: 13
---

# Error Handling

When an `@request` action fails — network error, CORS rejection, server unreachable — mate dispatches a `mx-error` `CustomEvent` on the triggering node and skips the DOM update.

## The `mx-error` Event

```html
<button id="btn"
        mx-click="@request:@inner"
        mx-path="/api/might-fail">
  Load
</button>

<script>
  document.getElementById('btn').addEventListener('mx-error', (e) => {
    console.error('Request to', e.detail.url, 'failed:', e.detail.error.message);
  });
</script>
```

### `event.detail`

| Field | Type | Description |
|-------|------|-------------|
| `error` | `Error` | The original error from `fetch()` |
| `url` | `string` | The URL passed to `mx-path` |
| `method` | `string` | The HTTP method (`GET`, `POST`, ...) |

The event **bubbles** and is **cancelable**, so you can also listen for it on a parent element or on `document` to handle errors centrally:

```javascript
document.addEventListener('mx-error', (e) => {
  // Global error reporting
  navigator.sendBeacon('/log', JSON.stringify({
    url: e.detail.url,
    message: e.detail.error.message,
  }));
});
```

## Behavior

- The error is logged to `console.error` with the URL and message.
- The `@request` action returns `null`, so no presenter runs and no DOM update happens.
- The original element's content is left untouched.

## HTTP Error Responses

Note that `mx-error` fires for **network failures**, not for HTTP error statuses (`4xx`, `5xx`). The `fetch()` API treats those as successful responses. To handle HTTP error statuses, inspect `response.ok` in a custom capability or controller, or check the rendered content.
