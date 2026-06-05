---
sidebar_position: 6
---

# Event Dispatch (`@trigger` / `@dispatch`)

The `@trigger` action dispatches a DOM event. Use it to chain interactions: one element's action can fire an event that another element listens for.

`@dispatch` is a silent alias for `@trigger` — both work identically.

## Syntax

```
mx-{event}="@trigger:{EVENT_NAME}[:{TARGET_SELECTOR}]"
```

- `EVENT_NAME` — the name of the DOM event to dispatch.
- `TARGET_SELECTOR` — (optional) a CSS selector for the target element. If omitted, the event is dispatched on the element itself and bubbles up by default.

## Trigger on the Same Element

```html
<button mx-click="@trigger:refresh">
  Refresh
</button>

<!-- The same button (or a parent) listens for the "refresh" event -->
<div mx-refresh="@request:@inner" mx-path="/api/latest">
  Listening...
</div>
```

## Trigger on a Specific Target

Use a CSS selector (e.g., `#id`) to dispatch on a different element:

```html
<button mx-click="@trigger:ping:#target-element">
  Ping Target
</button>

<div id="target-element"
     mx-ping="@request:@inner"
     mx-path="/pong">
  Waiting for ping...
</div>
```

## Combining with Other Modifiers

Triggers compose well with `.debounce` (e.g., auto-saving a form on input):

```html
<form mx-submit="@request:@inner" mx-path="/api/save">
  <input name="search"
         placeholder="Search..."
         mx-input.debounce.500ms="@trigger:submit" />
</form>
```

The `submit` event dispatched on the input bubbles up to the form, which then runs `@request:@inner`.
