---
sidebar_position: 7
---

# Meta Tag Headers

Mate reads `<meta mx-header>` tags from the document `<head>` and includes them as HTTP headers on every `@request` and `@stream` call. This is the recommended way to configure authentication tokens, API keys, or any header that should apply to all requests.

## Usage

```html
<head>
  <meta mx-header name="Authorization" content="Bearer: TOKEN" />
  <meta mx-header name="X-API-Key" content="your-api-key" />
  <meta mx-header name="X-Custom-Header" content="custom-value" />
</head>

<body>
  <!-- All of these will include the headers above -->
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

## How it works

On each request, mate queries `document.querySelectorAll('meta[mx-header]')` and builds a headers object from each tag's `name` and `content` attributes. The headers are merged with any `Content-Type` mate sets for JSON/form bodies.

## Limitations

- **`@ws` (WebSocket)** and **`@sse` (Server-Sent Events)** use different connection protocols and do **not** support custom headers through the standard browser APIs. For auth on those, use query-string tokens or subprotocols (for WebSocket).
- Headers are read fresh on every request, so updating a `<meta>` tag at runtime (e.g., after a token refresh) takes effect on the next request.
