# mate.js

A lightweight JavaScript library for declarative DOM interactions. `mate.js` allows you to define behavior directly in your HTML using attributes, making it easy to handle events, make requests, and update the DOM without writing custom JavaScript for every interaction.

## Installation

### NPM

```javascript
import mate from '@nsanta/mate/mate.js';

mate();
```

### CDN

```html
<script src="https://cdn.jsdelivr.net/gh/nsanta/mate/dist/bundle.js"></script>
```

## Usage

`mate.js` uses custom attributes to define interactions. There are two syntaxes available:

- **`mx-*` syntax** (recommended) - Event-centric shorthand with modifiers
- **`mt-*` syntax** (legacy) - Original attribute-based syntax

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
```

| Modifier | Description |
|----------|-------------|
| `.prevent` | Calls `event.preventDefault()` |
| `.stop` | Calls `event.stopPropagation()` |
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

For complex stateful behavior, use controllers:

```html
<div mx-controller="Counter">
  <span>Count: <span id="count">0</span></span>
  <button mx-click="@event:@controller:increment">+</button>
  <button mx-click="@event:@controller:decrement">-</button>
</div>

<script>
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
window.Counter = Counter;
</script>
```
 
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

## mt-* Syntax (Legacy)

The original syntax is still supported for backward compatibility.

### Triggers (`mt-on`)

The `mt-on` attribute defines the event that triggers an action.
Syntax: `mt-on="event:action"`

Supported events:
- `click`
- `submit` (for forms)
- `load`
- `mouseover`
- `mouseenter`
- `mouseleave`

Supported actions:
- `@request`: Makes an HTTP request.
- `@event`: Passes the event through (for controller handling).
- `@stream`: Streams HTTP responses with real-time updates.
- `@ws`: Establishes a WebSocket connection.
- `@sse`: Establishes a Server-Sent Events connection.

### Request Configuration

Configure the HTTP request using the following attributes:

- `mt-method`: The HTTP method to use (e.g., `GET`, `POST`). Defaults to `GET`.
- `mt-path`: The URL path for the request.
- `mt-data`: JSON string containing data to send with the request.

### Presenters (`mt-pr`)

The `mt-pr` attribute defines how the response from the action should be handled and presented in the DOM.
Syntax: `mt-pr="action:target:option"`

Supported presenter actions:
- `@inner`: Replaces the `innerHTML` of the target element. (Default if `mt-pr` is missing)
- `@outer`: Replaces the `outerHTML` of the target element.
- `@id`: Updates an element by its ID. Syntax: `@id:elementId`.
- `@class`: Updates elements by their class name. Syntax: `@class:className`.
- `@append`: Appends content to the target.
- `@prepend`: Prepends content to the target.
- `@controller`: Calls a method on the element's controller.

---

## Examples

### Basic Click Request

```html
<!-- mx-* syntax (recommended) -->
<button mx-click="@request:@inner" mx-path="/api/content">
  Click me to load content
</button>

<!-- mt-* syntax (legacy) -->
<button mt-on="click:@request" mt-path="/api/content">
  Click me to load content
</button>
```

### Update Another Element by ID

```html
<!-- mx-* syntax (recommended) -->
<button mx-click="@request:@id:target-div" mx-path="/api/content">
  Load into Target
</button>

<!-- mt-* syntax (legacy) -->
<button mt-on="click:@request" mt-path="/api/content" mt-pr="@id:target-div">
  Load into Target
</button>

<div id="target-div">Content will appear here</div>
```

### Form Submission

```html
<!-- mx-* syntax -->
<form mx-submit="@request:@inner" mx-method="POST" mx-path="/submit-form">
  <input type="text" name="username" />
  <button type="submit">Submit</button>
</form>

<!-- mt-* syntax (legacy) -->
<form mt-on="submit:@request" mt-method="POST" mt-path="/submit-form">
  <input type="text" name="username" />
  <button type="submit">Submit</button>
</form>
```

### Load Event

```html
<!-- mx-* syntax -->
<div mx-load="@request:@inner" mx-path="/initial-data">
  Loading...
</div>

<!-- mt-* syntax (legacy) -->
<div mt-on="load:@request" mt-path="/initial-data">
  Loading...
</div>
```

### Sending Custom Data

```html
<!-- mx-* syntax -->
<button mx-click="@request:@inner" mx-method="POST" mx-path="/api/action" mx-data='{"key": "value"}'>
  Send Data
</button>

<!-- mt-* syntax (legacy) -->
<button mt-on="click:@request" mt-method="POST" mt-path="/api/action" mt-data='{"key": "value"}'>
  Send Data
</button>
```

### Using a Controller

```html
<!-- mx-* syntax -->
<div mx-controller="Tooltip" mx-mouseover="@event:@controller:show" mx-mouseleave="@event:@controller:hide">
  Hover me
</div>

<!-- mt-* syntax (legacy) -->
<div mt-on="mouseover:@event" mt-controller="Tooltip" mt-pr="@controller:show">
  Hover me
</div>
```
 
### HTTP Stream for Real-Time Updates

```html
<!-- mx-* syntax -->
<button mx-click="@stream" mx-path="/stream">
  Start Stream
</button>
<div id="stream-output">Waiting...</div>

<!-- Stream and append each chunk -->
<button mx-click="@stream:@append" mx-path="/stream">
  Stream to Log
</button>
<div id="log">Messages will appear here</div>
```

### WebSocket Connection

```html
<!-- mx-* syntax -->
<button mx-click="@ws" mx-path="ws://localhost:3001/ws">
  Connect WebSocket
</button>
<div id="ws-output">Waiting for connection...</div>

<!-- Send message from JavaScript -->
<button onclick="sendWSMessage()">Send Hello</button>

<script>
  function sendWSMessage() {
    const node = document.querySelector('[mx-click="@ws"]');
    if (node && node._wsClient) {
      node._wsClient.send({ message: 'Hello from client!' });
    }
  }
</script>
```

### Server-Sent Events

```html
<!-- mx-* syntax -->
<button mx-click="@sse" mx-path="/sse">
  Connect SSE
</button>
<div id="sse-output">Waiting for connection...</div>
```

---

## API Reference

### `mate()`

Initializes mate.js and starts observing the DOM.

```javascript
import mate from '@nsanta/mate';
mate();
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

### `mate.registerPresenter(name, handler)`

Register a custom presenter.

```javascript
mate.registerPresenter('@custom', async (node, response, target, option) => {
  const text = await response.text();
  node.textContent = text.toUpperCase();
});
```

---

## GitHub Pages Demo

A live demo of **mate.js** is hosted via GitHub Pages. You can view the examples and documentation [here](https://nsanta.github.io/mate/)

The site is automatically built from the `docs/` folder using a GitHub Actions workflow.

Feel free to explore the interactive examples and adapt them for your own projects.
