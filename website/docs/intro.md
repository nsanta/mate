---
sidebar_position: 1
---

# Introduction

Mate is a lightweight JavaScript library designed to simplify DOM interactions and HTTP requests using HTML attributes. It allows you to define behavior directly in your HTML markup, reducing the need for boilerplate JavaScript code.

## Core Concepts

- **Mateize**: The process of initializing the library on a DOM node and its children.
- **Triggers**: Events defined via `mx-{event}` attributes (e.g., `mx-click`) that initiate actions. Supported events include:
    - `click`, `mousedown`, `mouseup`
    - `mouseover`, `mouseenter`, `mouseleave`
    - `input`, `change`, `submit`
    - `focus`, `blur`
    - `keydown`, `keyup`
    - `scroll`
    - `load` (fires automatically on init)
    - Any custom event name (e.g., `mx-ping` listens for a `ping` event you can dispatch with [`@trigger`](./usage/triggers.md))
- **Actions**: Operations like HTTP requests (`@request`), event triggers (`@event`), event dispatch (`@trigger`), or real-time connections (`@stream`, `@ws`, `@sse`).
- **Presenters**: Mechanisms to display the results of actions, such as updating the DOM (`@inner`, `@outer`, `@append`, `@prepend`, `@id`, `@class`) or calling a controller method (`@controller`).
- **Modifiers**: Suffixes that change how the event fires — `.prevent`, `.stop`, `.debounce`, `.throttle`, `.once`, `.self`, `.enter`, `.ctrl`, and many more. See [Modifiers](./usage/modifiers.md).
- **Controllers**: Custom JavaScript classes attached to elements via `mx-controller` for complex stateful logic. See [Controllers](./usage/controllers.md).
- **Capabilities**: Custom actions you register via `mate.registerCapability()`. See [Custom Capabilities](./usage/capabilities.md).

## Getting Started

To use Mate, simply include the library in your project and call the initialization function.

```javascript
import mate from '@nsanta/mate';

const teardown = mate();
```

Once initialized, Mate will observe the DOM for changes and automatically attach behavior to elements with `mx-*` and `mx-controller` attributes. See [Lifecycle & Teardown](./usage/lifecycle.md) for disposing of a mate instance.
