---
sidebar_position: 3
---

# Presenters

Presenters determine how the response from an action is displayed or handled. In the event-centric syntax, you define a presenter by appending it directly to the action in the `mx-{event}` attribute, separated by a colon.

## Syntax

```html
mx-{event}="<action>:<presenter>[:<target>[:<option>]]"
```

- **action**: The action to perform (e.g., `@request`).
- **presenter**: The presenter logic to use (e.g., `@inner`, `@outer`, `@id`, `@class`, `@append`, `@prepend`, `@controller`).
- **target**: (Optional) The target element ID, class, or method depending on the presenter.
- **option**: (Optional) Additional options like `inner` or `outer` for specific presenters.

---

## Available Presenters

### `@inner`

Updates the `innerHTML` of the triggering element.

```html
<div mx-load="@request:@inner" mx-path="/content"></div>
```

### `@outer`

Updates the `outerHTML` of the triggering element (replacing the element itself).

```html
<div mx-click="@request:@outer" mx-path="/new-button">
  Click to replace me
</div>
```

### `@append`

Appends the response content to the end of the triggering element.

```html
<ul mx-click="@request:@append" mx-path="/item">
  <li>Existing Item</li>
</ul>
```

### `@prepend`

Prepends the response content to the beginning of the triggering element.

```html
<div mx-click="@request:@prepend" mx-path="/alert">
  <!-- Alert will appear here -->
  <p>Content</p>
</div>
```

### `@id`

Updates another element specified by its ID.

```html
<button mx-click="@request:@id:info-box" mx-path="/info">
  Load Info
</button>

<div id="info-box"></div>
```

You can also specify whether to update inner or outer HTML as an option (defaults to `inner`):
```html
<button mx-click="@request:@id:info-box:outer" mx-path="/info">
  Load Info (Replace Node)
</button>
```

### `@class`

Updates all elements with a specific class.

```html
<button mx-click="@request:@class:status-label" mx-path="/update">
  Update All Statuses
</button>

<span class="status-label">Pending</span>
<span class="status-label">Pending</span>
```

### `@controller`

Passes the response to a method on the element's controller.

```html
<div 
  mx-controller="MyController" 
  mx-click="@request:@controller:handleData" 
  mx-path="/data"
></div>
```
