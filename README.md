# mate.js

A lightweight JavaScript library for declarative DOM interactions. `mate.js` allows you to define behavior directly in your HTML using attributes, making it easy to handle events, make requests, and update the DOM without writing custom JavaScript for every interaction.

## Installation

You can include `mate.js` in your project by importing it into your main JavaScript file.

```javascript
import mate from './path/to/mate.js';

mate();
```

## Usage

`mate.js` uses a set of custom attributes to define interactions.

### Triggers (`mt-on`)

The `mt-on` attribute defines the event that triggers an action.
Syntax: `mt-on="event:action"`

Supported events:
- `click`
- `submit` (for forms)
- `load`

Supported actions:
- `@request`: Makes an HTTP request.

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

If the target is omitted for `@inner` or `@outer`, it applies to the element that triggered the event.

## Examples

### Basic Click Request

Makes a GET request to `test.html` when clicked and replaces the clicked element's content with the response.

```html
<div mt-on="click:@request" mt-method="GET" mt-path="test.html">
  Click me to load content
</div>
```

### Update Another Element by ID

Makes a request and updates the element with `id="target-div"`.

```html
<button mt-on="click:@request" mt-method="GET" mt-path="content.html" mt-pr="@id:target-div">
  Load into Target
</button>

<div id="target-div">Content will appear here</div>
```

### Form Submission

Submits a form using POST and updates the form's content with the response.

```html
<form mt-on="submit:@request" mt-method="POST" mt-path="/submit-form">
  <input type="text" name="username" />
  <button type="submit">Submit</button>
</form>
```

### Load Event

Automatically loads content when the element is added to the DOM (or on page load).

```html
<div mt-on="load:@request" mt-method="GET" mt-path="initial-data.html">
  Loading...
</div>
```

### Sending Custom Data
Send custom JSON data with a request.

```html
<button mt-on="click:@request" mt-method="POST" mt-path="/api/action" mt-data='{"key": "value"}'>
  Send Data
</button>
```

### Using a controller

Handling events:

```html
<div mt-on="mouseover:@event" mt-controller="Tooltip" mt-pr="@controller:toggle">
  Toggle Tooltip
</div>
```

Handling presentation:

```html
<div mt-on="click:@request" mt-method="GET" mt-path="initial-data.html" mt-controller="UpdateContent" mt-pr="@controller:update">
  UpdateContent
</div>
```

## GitHub Pages Demo

A live demo of **mate.js** is hosted via GitHub Pages. You can view the examples and documentation [here](https://nsanta.github.io/mate/)

The site is automatically built from the `docs/` folder using a GitHub Actions workflow.

Feel free to explore the interactive examples and adapt them for your own projects.

## CDN

You can include `mate.js` in your project by importing it from a CDN.

```html
<script src="https://cdn.jsdelivr.net/gh/nsanta/mate/dist/bundle.js"></script>
```
