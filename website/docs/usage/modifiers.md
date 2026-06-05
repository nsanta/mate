---
sidebar_position: 5
---

# Modifiers

Modifiers change how the event handler behaves. They are appended to the event name with dots and can be chained.

```html
<mx-{event}[.modifier1.modifier2...]="..."
```

## Behavior Modifiers

### `.prevent`

Calls `event.preventDefault()`. Useful for links and forms.

```html
<a href="/link" mx-click.prevent="@request:@inner" mx-path="/api/data">
  Click (no navigation)
</a>
```

### `.stop`

Calls `event.stopPropagation()`. Prevents the event from bubbling up.

### `.stopImmediate`

Calls `event.stopImmediate()`. Stops propagation **and** prevents any other handlers on the same element from running.

### `.once`

The handler runs only once, then detaches.

```html
<button mx-click.once="@request:@inner" mx-path="/api/once">
  One-time action
</button>
```

### `.self`

Only triggers if `event.target` is the element itself (not a child).

```html
<div mx-click.self="@request:@inner">
  Clicks on children are ignored
</div>
```

## Timing Modifiers

### `.debounce` / `.debounce.Nms`

Debounces the handler. Default is 250ms; pass a custom value with the `Nms` suffix.

```html
<input mx-input.debounce="@request:@inner" mx-path="/search" />

<input mx-input.debounce.500ms="@request:@inner" mx-path="/search" />
```

### `.throttle` / `.throttle.Nms`

Throttles the handler (runs at most once per interval). Default 250ms.

```html
<div mx-scroll.throttle.100ms="@request:@inner" mx-path="/more">
  Scroll me
</div>
```

## Listener Options

### `.capture`

Attaches the listener with `{ capture: true }` (fires during the capture phase).

### `.passive`

Attaches the listener with `{ passive: true }`. The handler cannot call `preventDefault()` — improves scroll performance.

## Target Scope

### `.window` / `.document`

Attaches the listener to `window` or `document` instead of the element. Useful for global keyboard shortcuts.

```html
<div mx-keyup.window="@request:@inner" mx-path="/global">
  Press any key anywhere
</div>
```

### `.outside`

Triggers when the user clicks **outside** the element. Perfect for closing dropdowns and modals.

```html
<div mx-click.outside="@request:@inner" mx-path="/close">
  Click outside me
</div>
```

## Key Modifiers

### Key name modifiers

Only fire on specific keys: `.enter`, `.tab`, `.esc`, `.space`.

```html
<input mx-keydown.enter="@request:@inner" mx-path="/save" />
<input mx-keydown.esc="@request:@inner" mx-path="/clear" />
```

### System key modifiers

Only fire when the modifier key is held: `.ctrl`, `.shift`, `.alt`, `.meta` (Cmd on macOS, Win on Windows).

```html
<input mx-keydown.ctrl="@request:@inner" mx-path="/save" />
<input mx-keydown.enter.ctrl="@request:@inner" mx-path="/save-all" />
```

## Mouse Button Modifiers

Only fire on a specific mouse button: `.left`, `.middle`, `.right`.

```html
<button mx-click.right.prevent="@request:@inner" mx-path="/context">
  Right-click only
</button>
```

## Chaining

Most modifiers can be chained. Order does not matter.

```html
<button mx-click.prevent.stop.once="@request:@inner">
  Prevent default, stop propagation, run once
</button>
```
