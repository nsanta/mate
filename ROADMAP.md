# ROADMAP

This document outlines the development roadmap for `mate.js`, structured into phases from the current foundation to future extensibility.

## Phase 1: Core Foundation (Current Status)

The core functionality is implemented, allowing for basic declarative interactions.

### Events
- [x] `click`: Trigger actions on click.
- [x] `submit`: Trigger actions on form submission.
- [x] `load`: Trigger actions when an element triggers the load event.

### Actions
- [x] `@request`: Perform HTTP requests (GET, POST, etc.).

### Presenters
- [x] `@inner`: Replace the inner HTML of the target.
- [x] `@outer`: Replace the outer HTML of the target.
- [x] `@id`: Update a specific element by its ID.
- [x] `@class`: Update elements by their class name.

---

## Phase 2: Expanded Interactions (Next Steps)

Expanding the range of events to support richer user interactions.

### Events
- [x] `mouseover`: Trigger on mouse hover.
- [x] `mouseenter`: Trigger when mouse enters the element.
- [x] `mouseleave`: Trigger when mouse leaves the element.
- [ ] `mouseup`: Trigger on mouse button release.
- [ ] `mousedown`: Trigger on mouse button press.
- [ ] `keypress`: Trigger on keyboard input.
- [ ] `scroll`: Trigger on scroll events.
- [ ] `focusin`: Trigger when an element gains focus.
- [ ] `focusout`: Trigger when an element loses focus.

---

## Phase 3: Advanced Connectivity

Adding support for real-time and streaming data.

### Actions
- [x] `@event`: Support for custom events.
- [ ] `@streams`: Support for HTTP Streams for real-time updates.
- [ ] `@ws`: Support for Web Sockets for bidirectional communication.

---

## Phase 4: Extensibility

Allowing developers to extend the library with custom logic.

### Actions & Presenters
- [x] `@controller`: Support for custom JavaScript controllers to handle complex logic beyond standard actions and presenters.


### Planned

- [ ] Support for multiple events, and actions on the same element.
- [ ] Support for multiple presenters on the same element.
- [ ] Support for Frameworks as presenters like React, Vue, Svelte, etc.