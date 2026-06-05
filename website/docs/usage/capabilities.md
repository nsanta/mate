---
sidebar_position: 11
---

# Custom Capabilities

Capabilities extend mate with new actions. If `@request`, `@stream`, `@ws`, etc. don't cover your use case, you can register your own.

## Register a Capability

### Object form (multiple methods)

```javascript
import mate from '@nsanta/mate';

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

mate();
```

In HTML, use `CapabilityName.method` as the action:

```html
<button mx-click="Analytics.track:@inner">
  Track Event
</button>

<button mx-click="Analytics.identify:@inner">
  Identify User
</button>
```

### Function form (single handler)

```javascript
mate.registerCapability('Logger', (node, method, event, parsedEvent) => {
  console.log(`[${method}]`, event);
  return Promise.resolve({ logged: true });
});
```

The function receives the `method` name as the second argument, so you can use it with any `Logger.<method>`:

```html
<button mx-click="Logger.info:@inner">Log Info</button>
<button mx-click="Logger.warn:@inner">Log Warning</button>
```

## Handler Signature

| Argument | Description |
|----------|-------------|
| `node` | The DOM element that triggered the event |
| `method` (function form) | The method name after the dot |
| `event` | The native DOM event |
| `parsedEvent` | Mate's parsed event object (action, presentation, target, modifiers, etc.) |

The handler may be sync or async. Return a `Promise` that resolves to the data you want the presenter to consume.

## Registry API

```javascript
mate.registerCapability(name, handler); // add or replace
mate.getCapability(name);               // → handler or undefined
mate.hasCapability(name);               // → boolean
mate.removeCapability(name);            // delete by name
```
