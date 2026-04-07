---
sidebar_position: 1
---

# Introduction

Mate is a lightweight JavaScript library designed to simplify DOM interactions and HTTP requests using HTML attributes. It allows you to define behavior directly in your HTML markup, reducing the need for boilerplate JavaScript code.

## Core Concepts

- **Mateize**: The process of initializing the library on a DOM node and its children.
- **Triggers**: Events defined via `mt-on` that initiate actions. Supported events include:
    - `click`
    - `submit`
    - `load`
    - `mouseover`
    - `mouseenter`
    - `mouseleave`
- **Actions**: Operations like HTTP requests (`@request`) or event triggers (`@event`).
- **Presenters**: Mechanisms to display the results of actions, such as updating the DOM (`@inner`, `@outer`, `@append`, etc.).
- **Controllers**: Custom JavaScript classes that can be attached to elements for more complex logic.

## Getting Started

To use Mate, simply include the library in your project and call the initialization function.

```javascript
import mate from './mate.js';

mate();
```

Once initialized, Mate will observe the DOM for changes and automatically attach behavior to elements with `mt-on` and `mt-controller` attributes.
