# mate.js

A lightweight JavaScript library for declarative DOM interactions. `mate.js` allows you to define behavior directly in your HTML using attributes, making it easy to handle events, make requests, and update the DOM without writing custom JavaScript for every interaction.

## Installation

### NPM

```javascript
import mate from '@nsanta/mate';

const teardown = mate();
```

### CDN

```html
<script src="https://cdn.jsdelivr.net/gh/nsanta/mate/dist/bundle.js"></script>
```

## Usage

`mate.js` uses custom attributes to define interactions:

- **`mx-*` syntax** - Event-centric shorthand with modifiers

---

## mx-* Syntax (Recommended)

The `mx-*` syntax provides a concise, event-centric way to define behavior:

```
mx-{EVENT}[.modifiers]="{ACTION|CAPABILITY.method}[:{PRESENTATION}[:{TARGET}]]"
```

### Basic Usage

```html
<!-- Click → Request → Replace innerHTML -->
<button mx-click="@request:@inner" mx-path="/api/data">
  Load Content
</button>

<!-- Click → Request → Update element by ID -->
<button mx-click="@request:@id:result-box" mx-path="/api/data">
  Load into #result-box
</button>

<!-- Auto-load on page load -->
<div mx-load="@request:@inner" mx-path="/initial-data">
  Loading...
</div>
```

### Request Configuration

| Attribute | Description |
|-----------|-------------|
| `mx-path` | URL path for the request |
| `mx-method` | HTTP method (`GET`, `POST`, etc.). Defaults to `GET` |
| `mx-data` | JSON string for request body |

### Meta Tag Headers

You can configure HTTP headers using meta tags. This is useful for setting authentication tokens, custom headers, or other HTTP headers that should apply to all requests.

Add meta tags in your HTML `<head>`:

```html
<head>
  <meta mx-header name="Authorization" content="Bearer: TOKEN" />
  <meta mx-header name="X-API-Key" content="your-api-key" />
  <meta mx-header name="X-Custom-Header" content="custom-value" />
</head>
```

These headers will be automatically included in all `@request` and `@stream` actions.

**Note:** WebSocket (`@ws`) and Server-Sent Events (`@sse`) use different connection protocols and do not support custom headers through the standard browser APIs.

### Presentation Options

| Presentation | Description | Example |
|--------------|-------------|---------|
| `@inner` | Replace innerHTML (default) | `mx-click="@request:@inner"` |
| `@outer` | Replace outerHTML | `mx-click="@request:@outer"` |
| `@id:elemId` | Update element by ID | `mx-click="@request:@id:my-div"` |
| `@class:className` | Update all elements with class | `mx-click="@request:@class:items"` |
| `@append` | Append to innerHTML | `mx-click="@request:@append"` |
| `@prepend` | Prepend to innerHTML | `mx-click="@request:@prepend"` |
| `@controller:method` | Call controller method | `mx-click="@event:@controller:handle"` |

### Available Actions

| Action | Description | Protocol |
|--------|-------------|----------|
| `@request` | Makes an HTTP request (GET, POST, etc.) | HTTP |
| `@event` | Passes event through to controller | N/A |
| `@passthrough` | Alias for `@event` | N/A |
| `@trigger` | Dispatches a new DOM event | N/A |
| `@dispatch` | Alias for `@trigger` | N/A |
| `@stream` | Streams HTTP responses with real-time updates | HTTP |
| `@ws` | Establishes WebSocket connection for bidirectional communication | WebSocket |
| `@sse` | Establishes Server-Sent Events connection for real-time updates | SSE |

All actions support the same presentation options (`@inner`, `@append`, `@prepend`, `@id`, etc.).

**Note:** `@stream`, `@ws`, and `@sse` require the `mx-path` attribute to specify the endpoint URL.

### Modifiers

Modifiers are appended to the event name with dots:

```html
<!-- Prevent default behavior -->
<a href="/link" mx-click.prevent="@request:@inner" mx-path="/api/data">Click</a>

<!-- Stop propagation -->
<div mx-click.stop="@request:@inner">Click</div>

<!-- Chain multiple modifiers -->
<button mx-click.prevent.stop="@request:@inner">Click</button>

<!-- Debounce input (default 250ms) -->
<input mx-input.debounce="@request:@inner" mx-path="/search">

<!-- Debounce with custom timing -->
<input mx-input.debounce.500ms="@request:@inner" mx-path="/search">

<!-- Throttle (default 250ms) -->
<div mx-scroll.throttle="@request:@inner" mx-path="/more">Scroll</div>

<!-- Throttle with custom timing -->
<div mx-scroll.throttle.100ms="@request:@inner" mx-path="/more">Scroll</div>

<!-- Only trigger once -->
<button mx-click.once="@request:@inner">One-time action</button>

<!-- Only trigger if clicking the element itself (not children) -->
<div mx-click.self="@request:@inner">Click me only</div>

<!-- Listen on window -->
<div mx-keyup.window="@request:@inner">Press any key</div>

<!-- Listen on document -->
<div mx-keyup.document="@request:@inner">Press any key</div>

<!-- Trigger when clicking outside -->
<div mx-click.outside="@request:@inner">Click outside me</div>

<!-- Key name modifiers: only fire on specific keys -->
<input mx-keydown.enter="@request:@inner" mx-path="/search">
<input mx-keydown.esc="@request:@inner" mx-path="/clear">
<input mx-keydown.tab="@request:@inner" mx-path="/next">
<input mx-keydown.space="@request:@inner" mx-path="/toggle">

<!-- System key modifiers: only fire when modifier key is held -->
<input mx-keydown.ctrl="@request:@inner" mx-path="/save">
<input mx-keydown.shift="@request:@inner" mx-path="/select">
<input mx-keydown.alt="@request:@inner" mx-path="/alt">
<input mx-keydown.meta="@request:@inner" mx-path="/meta">

<!-- Combine key name + system key: Ctrl+Enter shortcut -->
<input mx-keydown.enter.ctrl="@request:@inner" mx-path="/save">

<!-- Mouse button modifiers -->
<button mx-click.left="@request:@inner" mx-path="/action">Left click only</button>
<button mx-click.middle="@request:@inner" mx-path="/middle">Middle click only</button>
<button mx-click.right.prevent="@request:@inner" mx-path="/context">Right click only</button>
```

| Modifier | Description |
|----------|-------------|
| `.prevent` | Calls `event.preventDefault()` |
| `.stop` | Calls `event.stopPropagation()` |
| `.stopImmediate` | Calls `event.stopImmediate()` (stops propagation AND prevents other handlers on same element) |
| `.once` | Handler runs only once |
| `.self` | Only triggers if event target is the element itself |
| `.debounce` | Debounces handler (250ms default) |
| `.debounce.Nms` | Debounces with N milliseconds |
| `.throttle` | Throttles handler (250ms default) |
| `.throttle.Nms` | Throttles with N milliseconds |
| `.capture` | Use capture mode |
| `.passive` | Passive event listener |
| `.window` | Attach listener to window |
| `.document` | Attach listener to document |
| `.outside` | Trigger when clicking outside element |
| `.enter` | Only trigger on Enter key |
| `.tab` | Only trigger on Tab key |
| `.esc` | Only trigger on Escape key |
| `.space` | Only trigger on Space key |
| `.ctrl` | Only trigger when Ctrl is held |
| `.shift` | Only trigger when Shift is held |
| `.alt` | Only trigger when Alt is held |
| `.meta` | Only trigger when Meta (Cmd/Win) is held |
| `.left` | Only trigger on left mouse button |
| `.middle` | Only trigger on middle mouse button |
| `.right` | Only trigger on right mouse button |

### Custom Capabilities

Register custom capabilities to extend mate.js:

```javascript
// Register a capability object with methods
mate.registerCapability('Analytics', {
  track(node, event, parsedEvent) {
    console.log('Tracking:', parsedEvent);
    return Promise.resolve({ tracked: true });
  },
  identify(node, event, parsedEvent) {
    console.log('Identifying user');
    return Promise.resolve({ identified: true });
  }
});

// Register a simple function capability
mate.registerCapability('Logger', (node, method, event, parsedEvent) => {
  console.log(`[${method}]`, event);
  return Promise.resolve({ logged: true });
});
```

Use in HTML:

```html
<!-- Calls Analytics.track() -->
<button mx-click="Analytics.track:@inner">
  Track Event
</button>

<!-- Calls Logger with method "info" -->
<button mx-click="Logger.info:@inner">
  Log Info
</button>
```

### Controllers

For complex stateful behavior, use controllers. Register the class with `mate.registerController()` so mate can resolve it without polluting the global scope:

```html
<div mx-controller="Counter">
  <span>Count: <span id="count">0</span></span>
  <button mx-click="@event:@controller:increment">+</button>
  <button mx-click="@event:@controller:decrement">-</button>
</div>

<script type="module">
  import mate from '@nsanta/mate';

  class Counter {
    constructor(element) {
      this.element = element;
      this.count = 0;
      this.display = element.querySelector('#count');
    }

    increment() {
      this.count++;
      this.display.textContent = this.count;
    }

    decrement() {
      this.count--;
      this.display.textContent = this.count;
    }
  }

  mate.registerController('Counter', Counter);
  mate();
</script>
```

If a controller is not registered, mate falls back to `window[name]` for backward compatibility.
 
### Advanced Connectivity (`@stream`, `@ws`, `@sse`)

mate.js supports real-time data streaming and bidirectional communication through three special actions:

| Action | Description | Protocol |
|--------|-------------|----------|
| `@stream` | HTTP streaming responses with real-time updates | HTTP |
| `@ws` | WebSocket for bidirectional communication | WebSocket |
| `@sse` | Server-Sent Events for unidirectional updates | SSE |

#### @stream - HTTP Streams

Streams HTTP responses incrementally, updating the DOM as each chunk arrives. Perfect for streaming logs, chat feeds, or real-time data.

```html
<!-- Basic stream -->
<button mx-click="@stream" mx-path="/stream">
  Start Stream
</button>

<!-- Append each chunk -->
<button mx-click="@stream:@append" mx-path="/stream">
  Stream and Append
</button>

<!-- Update another element by ID -->
<button mx-click="@stream:@id:log" mx-path="/stream">
  Stream to Log
</button>

<div id="stream-output">Waiting for stream...</div>
```

The server should send newline-delimited text:
```
Stream message 1
Stream message 2
Stream message 3
```

To stop a stream:
```javascript
const node = document.querySelector('[mx-click="@stream"]');
if (node && node._streamAbortController) {
  node._streamAbortController.abort();
}
```

#### @ws - WebSocket

Establishes a WebSocket connection for bidirectional communication with automatic reconnection using exponential backoff.

```html
<!-- Connect WebSocket -->
<button mx-click="@ws" mx-path="ws://localhost:3001/ws">
  Connect
</button>

<div id="ws-output">Waiting for WebSocket...</div>
```

To send messages to the WebSocket:
```javascript
const node = document.querySelector('[mx-click="@ws"]');
if (node && node._wsClient) {
  node._wsClient.send({ type: 'client', message: 'Hello!' });
}
```

To disconnect:
```javascript
const node = document.querySelector('[mx-click="@ws"]');
if (node && node._wsClient) {
  node._wsClient.close();
}
```

#### @sse - Server-Sent Events

Establishes a Server-Sent Events connection for unidirectional real-time updates from the server.

```html
<!-- Connect to SSE -->
<button mx-click="@sse" mx-path="/sse">
  Connect SSE
</button>

<div id="sse-output">Waiting for SSE connection...</div>
```

To stop the SSE connection:
```javascript
const node = document.querySelector('[mx-click="@sse"]');
if (node && node._sseClient) {
  node._sseClient.stop();
}
```



---

## Examples

### Basic Click Request

```html
<button mx-click="@request:@inner" mx-path="/api/content">
  Click me to load content
</button>
```

### Update Another Element by ID

```html
<button mx-click="@request:@id:target-div" mx-path="/api/content">
  Load into Target
</button>

<div id="target-div">Content will appear here</div>
```

### Form Submission

```html
<form mx-submit="@request:@inner" mx-method="POST" mx-path="/submit-form">
  <input type="text" name="username" />
  <button type="submit">Submit</button>
</form>
```

### Dispatching Events (`@trigger`)

Use the `@trigger` action to dispatch DOM events. The first parameter is the event name, and the second (optional) parameter is a CSS selector for the target element. If no target is specified, the event is dispatched on the element itself (and bubbles up by default).

```html
<!-- Trigger 'submit' on the parent form when input changes -->
<form mx-submit="@request:@inner" mx-path="/api/save">
  <input name="search" 
         placeholder="Search..." 
         mx-input.debounce.500ms="@trigger:submit" />
</form>

<!-- Trigger a custom event on a specific element by ID -->
<button mx-click="@trigger:ping:#target-element">
  Ping Target
</button>

<div id="target-element" 
     mx-ping="@request:@inner" 
     mx-path="/pong">
  Waiting for ping...
</div>
```

### Authentication with Meta Headers

Configure authentication headers once in the `<head>` and they'll apply to all requests:

```html
<head>
  <meta mx-header name="Authorization" content="Bearer: eyJhbGciOiJIUzI1NiIs..." />
</head>

<body>
  <!-- All these requests will include the Authorization header -->
  <button mx-click="@request:@inner" mx-path="/api/profile">
    Load Profile
  </button>

  <div mx-load="@request:@inner" mx-path="/api/dashboard">
    Loading dashboard...
  </div>

  <button mx-click="@stream:@append" mx-path="/api/events">
    Stream Events
  </button>
</body>
```

### Load Event

```html
<div mx-load="@request:@inner" mx-path="/initial-data">
  Loading...
</div>
```

### Declarative Form Data Submission (`@form:<format>`)

The `mx-data` attribute can automatically extract data from the nearest ancestor form using the `@form:<format>` syntax. This is particularly useful for submitting forms via buttons that are not standard submit buttons, or when you need a specific payload format.

```html
<form>
  <input name="username" value="john_doe" />
  <input name="email" value="john@example.com" />
  
  <button mx-click="@request:@inner" 
          mx-method="POST" 
          mx-path="/api/save" 
          mx-data="@form:json">
    Save via JSON
  </button>
</form>
```

| Format | Description | Content-Type |
|--------|-------------|--------------|
| `@form:json` | Serializes form data as a JSON object | `application/json` |
| `@form:form` | Serializes form data as URL-encoded | `application/x-www-form-urlencoded` |
| `@form:multipart` | Sends as `FormData` | `multipart/form-data` |

**Note:** For `@form:json`, multiple inputs with the same name are automatically collected into an array.

### Controller with Hover Events

```html
<div mx-controller="Tooltip" mx-mouseover="@event:@controller:show" mx-mouseleave="@event:@controller:hide">
  Hover me
</div>
```

---

## Framework Integration

mate.js can render framework components (React, Vue, Svelte) as presenters. Instead of replacing `innerHTML`, the response data is passed as props to your component.

### Syntax

```
mx-{EVENT}="{ACTION}:{@react|@vue|@svelte}:{COMPONENT_NAME}"
```

### React

Register components, then use `@react:ComponentName` as the presenter:

```javascript
import mate from '@nsanta/mate';
import { registerComponent } from '@nsanta/mate/react';
import ProfileCard from './ProfileCard.jsx';

registerComponent('ProfileCard', ProfileCard);
mate();
```

```html
<button mx-click="@request:@react:ProfileCard" mx-path="/api/profile">
  Load Profile
</button>
```

The `ProfileCard` component receives `{ data }` as a prop, where `data` is the parsed JSON response (or raw text if not JSON).

### Vue

```javascript
import mate from '@nsanta/mate';
import { registerComponent } from '@nsanta/mate/vue';
import ProfileCard from './ProfileCard.vue';

registerComponent('ProfileCard', ProfileCard);
mate();
```

```html
<button mx-click="@request:@vue:ProfileCard" mx-path="/api/profile">
  Load Profile
</button>
```

### Svelte

```javascript
import mate from '@nsanta/mate';
import { registerComponent } from '@nsanta/mate/svelte';
import ProfileCard from './ProfileCard.svelte';

registerComponent('ProfileCard', ProfileCard);
mate();
```

```html
<button mx-click="@request:@svelte:ProfileCard" mx-path="/api/profile">
  Load Profile
</button>
```

### Streaming & Real-Time

Framework presenters work with `@stream`, `@ws`, and `@sse` actions — each chunk or message re-renders the component with the latest data:

```html
<button mx-click="@stream:@react:LogViewer" mx-path="/api/logs">
  Stream Logs
</button>
```

---

## API Reference

### `mate()`

Initializes mate.js and starts observing the DOM. Returns a **teardown function** that disconnects the observer, removes the `DOMContentLoaded` listener, and runs all registered cleanups (closes any active streams, WebSockets, and SSE connections created by `@stream`/`@ws`/`@sse`).

```javascript
import mate from '@nsanta/mate';

const teardown = mate();

// Later, when you want to dispose of mate (e.g., navigating away in a SPA):
teardown();
```

### `mate.registerCapability(name, handler)`

Register a custom capability.

```javascript
// Object with methods
mate.registerCapability('MyCap', {
  method1(node, event, parsedEvent) { ... },
  method2(node, event, parsedEvent) { ... }
});

// Simple function
mate.registerCapability('MyCap', (node, method, event, parsedEvent) => { ... });
```

### `mate.getCapability(name)` / `mate.hasCapability(name)` / `mate.removeCapability(name)`

Read and remove registered capabilities.

```javascript
const cap = mate.getCapability('MyCap');
if (mate.hasCapability('MyCap')) { /* ... */ }
mate.removeCapability('MyCap');
```

### `mate.registerController(name, ControllerClass)`

Register a controller class so it can be resolved by `mx-controller="name"` without putting it on `window`.

```javascript
class Counter { /* ... */ }
mate.registerController('Counter', Counter);
```

### `mate.getController(name)` / `mate.hasController(name)` / `mate.removeController(name)` / `mate.clearControllers()`

Read and remove registered controllers.

```javascript
const Ctrl = mate.getController('Counter');
if (mate.hasController('Counter')) { /* ... */ }
mate.removeController('Counter');
mate.clearControllers(); // remove all
```

### `mate.registerPresenter(name, handler)`

Register a custom presenter.

```javascript
mate.registerPresenter('@custom', async (node, response, target, option) => {
  const text = await response.text();
  node.textContent = text.toUpperCase();
});
```

### `mate.getPresenter(name)` / `mate.hasPresenter(name)`

Read registered presenters.

```javascript
const p = mate.getPresenter('@custom');
if (mate.hasPresenter('@custom')) { /* ... */ }
```

### Error Handling: the `mx-error` event

When an `@request` action fails (network error, CORS, etc.), mate dispatches a `mx-error` `CustomEvent` on the triggering node with `{ error, url, method }` as `event.detail`. The handler returns `null`, so no DOM update happens.

```html
<button id="btn"
        mx-click="@request:@inner"
        mx-path="/api/might-fail">
  Load
</button>

<script>
  document.getElementById('btn').addEventListener('mx-error', (e) => {
    console.error('Request to', e.detail.url, 'failed:', e.detail.error.message);
    e.detail.target.innerHTML = '<span class="error">Failed to load</span>';
  });
</script>
```

---

## GitHub Pages Demo

A live demo of **mate.js** is hosted via GitHub Pages. You can view the examples and documentation [here](https://nsanta.github.io/mate/)

The site is automatically built from the `docs/` folder using a GitHub Actions workflow.

Feel free to explore the interactive examples and adapt them for your own projects.
