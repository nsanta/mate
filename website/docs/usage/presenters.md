---
sidebar_position: 3
---

# Presenters

Presenters determine how the response from an action is displayed or handled. You define a presenter using the `mt-pr` attribute.

## Syntax

```html
mt-pr="<action>:<target>:<option>"
```

- **action**: The presenter logic (e.g., `@inner`, `@outer`, `@id`).
- **target**: (Optional) The target element ID or class name.
- **option**: (Optional) Additional options like `inner` or `outer` for specific presenters.

## Available Presenters

### `@inner` (Default)

Updates the `innerHTML` of the triggering element.

```html
<div mt-on="load:@request" mt-path="/content" mt-pr="@inner"></div>
```

### `@outer`

Updates the `outerHTML` of the triggering element (replacing the element itself).

```html
<div mt-on="click:@request" mt-path="/new-button" mt-pr="@outer">
  Click to replace me
</div>
```

### `@append`

Appends the response content to the end of the triggering element.

```html
<ul mt-on="click:@request" mt-path="/item" mt-pr="@append">
  <li>Existing Item</li>
</ul>
```

### `@prepend`

Prepends the response content to the beginning of the triggering element.

```html
<div mt-on="click:@request" mt-path="/alert" mt-pr="@prepend">
  <!-- Alert will appear here -->
  <p>Content</p>
</div>
```

### `@id`

Updates another element specified by its ID.

```html
<button mt-on="click:@request" mt-path="/info" mt-pr="@id:info-box">
  Load Info
</button>

<div id="info-box"></div>
```

You can also specify whether to update inner or outer HTML:
`mt-pr="@id:info-box:outer"`

### `@class`

Updates all elements with a specific class.

```html
<button mt-on="click:@request" mt-path="/update" mt-pr="@class:status-label">
  Update All Statuses
</button>

<span class="status-label">Pending</span>
<span class="status-label">Pending</span>
```

### `@controller`

Passes the response to a method on the element's controller.

```html
<div 
  mt-controller="MyController" 
  mt-on="click:@request" 
  mt-path="/data" 
  mt-pr="@controller:handleData"
></div>
```
