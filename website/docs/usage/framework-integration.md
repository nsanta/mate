---
sidebar_position: 12
---

# Framework Integration

Mate can render React, Vue, or Svelte components as presenters. Instead of replacing `innerHTML`, the response data is passed as props to your component.

## Syntax

```
mx-{EVENT}="{ACTION}:{@react|@vue|@svelte}:{COMPONENT_NAME}"
```

## React

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

`ProfileCard` receives `{ data }` as a prop, where `data` is the parsed JSON response (or raw text if the response isn't JSON).

## Vue

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

## Svelte

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

## Streaming & Real-Time

Framework presenters work with `@stream`, `@ws`, and `@sse` — each chunk or message re-renders the component with the latest data:

```html
<button mx-click="@stream:@react:LogViewer" mx-path="/api/logs">
  Stream Logs
</button>
```

## Registry API

Each adapter exposes the same registry:

```javascript
import { registerComponent, getComponent, hasComponent } from '@nsanta/mate/react';

registerComponent(name, component);
getComponent(name);   // → component or undefined
hasComponent(name);   // → boolean
```
