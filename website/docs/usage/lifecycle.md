---
sidebar_position: 14
---

# Lifecycle & Teardown

Calling `mate()` initializes the library and returns a **teardown function**. Use it to cleanly dispose of mate in single-page applications, tests, or any context where the DOM is rebuilt.

## Initialize

```javascript
import mate from '@nsanta/mate';

const teardown = mate();
```

Internally, `mate()`:

1. Listens for `DOMContentLoaded` (or runs immediately if the document is already ready).
2. Walks the DOM and attaches event handlers for every `mx-*` attribute.
3. Starts a `MutationObserver` to handle elements added dynamically.

## Teardown

```javascript
teardown();
```

Calling teardown:

- Removes the `DOMContentLoaded` listener.
- Disconnects the `MutationObserver` (dynamically added elements are no longer processed).
- Runs every registered cleanup, which closes:
  - Active `@stream` connections (`_streamAbortController.abort()`)
  - Open `@ws` WebSocket clients (`_wsClient.close()`)
  - Open `@sse` SSE clients (`_sseClient.stop()`)

After teardown, the DOM is in the same state it would be if mate had never run.

## When to teardown

- **SPAs:** when navigating away from a page that uses mate.
- **Tests:** in `afterEach()` to keep tests isolated.
- **Hot-module reload:** before re-importing mate in development.

## Example: Tests

```javascript
import mate from '@nsanta/mate';

describe('my feature', () => {
  let teardown;

  afterEach(() => {
    if (teardown) teardown();
  });

  it('works', () => {
    teardown = mate();
    // ...
  });
});
```
