# ROADMAP

This document outlines the development roadmap for `mate.js`, structured into phases from the current foundation to future extensibility.

## Phase 1: Core Foundation ✅ Complete

The core functionality is implemented, allowing for basic declarative interactions.

### Events
- [x] `click`: Trigger actions on click.
- [x] `submit`: Trigger actions on form submission.
- [x] `load`: Trigger actions when an element triggers the load event.

### Actions
- [x] `@request`: Perform HTTP requests (GET, POST, etc.).
- [x] `@event`: Support for passing events through to controllers.

### Presenters
- [x] `@inner`: Replace the inner HTML of the target.
- [x] `@outer`: Replace the outer HTML of the target.
- [x] `@id`: Update a specific element by its ID.
- [x] `@class`: Update elements by their class name.
- [x] `@append`: Append HTML to the target.
- [x] `@prepend`: Prepend HTML to the target.

---

## Phase 2: Expanded Interactions ✅ Complete

Expanding the range of events to support richer user interactions.

### Events
- [x] `mouseover`: Trigger on mouse hover.
- [x] `mouseenter`: Trigger when mouse enters the element.
- [x] `mouseleave`: Trigger when mouse leaves the element.
- [x] `mouseup`: Trigger on mouse button release.
- [x] `mousedown`: Trigger on mouse button press.
- [x] `input`: Trigger on input changes.
- [x] `scroll`: Trigger on scroll events.
- [x] `focus`: Trigger when an element gains focus.
- [x] `blur`: Trigger when an element loses focus.
- [x] `keydown`: Trigger on key press.
- [x] `keyup`: Trigger on key release.

---

## Phase 3: Event-Centric Syntax (mx-*) ✅ Complete

New concise syntax inspired by Alpine.js and HTMX.

### mx-* Attributes
- [x] `mx-{event}`: Event-centric attribute syntax (e.g., `mx-click`, `mx-submit`).
- [x] Combined action and presentation in value: `mx-click="@request:@inner"`
- [x] `mx-path`, `mx-method`, `mx-data`: Request configuration via mx-* attributes.
- [x] `mx-controller`: Attach controller to element.

### Modifiers
- [x] `.prevent`: Calls `event.preventDefault()`.
- [x] `.stop`: Calls `event.stopPropagation()`.
- [x] `.once`: Handler runs only once.
- [x] `.self`: Only triggers if target is element itself.
- [x] `.debounce`: Debounces handler (default 250ms).
- [x] `.debounce.Nms`: Debounces with custom timing.
- [x] `.throttle`: Throttles handler (default 250ms).
- [x] `.throttle.Nms`: Throttles with custom timing.
- [x] `.capture`: Use capture mode.
- [x] `.passive`: Passive event listener.
- [x] `.window`: Attach listener to window.
- [x] `.document`: Attach listener to document.
- [x] `.outside`: Trigger when clicking outside element.

### Custom Capabilities
- [x] `mate.registerCapability()`: Register custom capability handlers.
- [x] Object-based capabilities with multiple methods.
- [x] Function-based capabilities.
- [x] `Capability.method` syntax in mx-* attributes.

---

## Phase 4: Extensibility ✅ Complete

Allowing developers to extend the library with custom logic.

### Registry APIs
- [x] `mate.registerCapability(name, handler)`: Register custom capabilities.
- [x] `mate.registerPresenter(name, handler)`: Register custom presenters.
- [x] `mate.getCapability(name)`: Retrieve registered capability.
- [x] `mate.hasCapability(name)`: Check if capability exists.
- [x] `mate.getPresenter(name)`: Retrieve registered presenter.
- [x] `mate.hasPresenter(name)`: Check if presenter exists.

### Controllers
- [x] `@controller`: Support for custom JavaScript controllers to handle complex logic.
- [x] `mx-controller`: Attach controllers via new syntax.
- [x] `@controller:method` presenter for calling controller methods.

### Distribution
- [x] Support for distributing Mate.js as a module.
- [x] Support for distributing Mate.js as a script via CDN.

---

## Phase 5: Advanced Connectivity ✅ Complete

Adding support for real-time and streaming data.

### Actions
- [x] `@stream`: Support for HTTP Streams for real-time updates.
- [x] `@ws`: Support for Web Sockets for bidirectional communication.
- [x] `@sse`: Support for Server-Sent Events.

---

## Phase 6: Enhanced Features ✅ Mostly Complete

Additional features for improved developer experience.

### Multiple Bindings
- [ ] Support for multiple events on the same element.
- [ ] Support for multiple presenters chained together.

### Key Modifiers
- [x] `.enter`, `.tab`, `.esc`, `.space` key modifiers.
- [x] `.ctrl`, `.shift`, `.alt`, `.meta` system key modifiers.
- [x] `.left`, `.middle`, `.right` mouse button modifiers.

### Animation
- [ ] Built-in transition/animation support when swapping content.
- [ ] CSS class-based enter/leave animations.

### Framework Integration
- [x] React component wrapper.
- [x] Vue directive wrapper.
- [x] Svelte action wrapper.

---

## Phase 7: Developer Tools (Future)

Tools to improve the development experience.

- [ ] Browser DevTools extension.
- [ ] VS Code extension for attribute autocomplete.
- [ ] TypeScript definitions.
- [ ] Debug mode with verbose logging.

---

## Hardening Pass (✅ Complete)

A multi-phase hardening pass was executed between Phase 5 and Phase 6 to take the library to production quality. All items below shipped.

### Phase 1 — Surgical Bug Fixes ✅
- [x] Fixed duplicate `STOP` modifier check.
- [x] Removed `once` modifier dead code.
- [x] Fixed `load` event bypassing modifiers.
- [x] Added missing `await` in `presenter.byId`.
- [x] Removed `updateDOM` dead-code path.
- [x] Removed unused `attributes:true` in `MutationObserver` config.
- [x] Added `.stopImmediate` modifier constant.

### Phase 2 — Streaming & Real-Time Coverage ✅
- [x] 60 new tests across `stream`, `sse`, `ws` (zero tests → comprehensive coverage).
- [x] Fixed `SSE._manualClose` bug.
- [x] Fixed WebSocket binary handling.
- [x] Deduplicated form-serialization logic.

### Phase 3 — Registry APIs + Aliases ✅
- [x] `mate.registerController/getController/hasController/removeController/clearControllers`.
- [x] `mate()` teardown function (closes streams, WebSockets, SSE; disconnects observer).
- [x] Silent aliases: `@dispatch` → `@trigger`, `@passthrough` → `@event`.

### Phase 4 — XSS Safety + GET Warning ✅
- [x] XSS-safe `@text` presenter.
- [x] `mx-data` ignored on GET/HEAD with console warning.

### Phase 5 — Coverage 94% → 98% ✅
- [x] 16 new tests across throttle wrapper, key modifiers, `load` event, etc.

### Phase 6 — Tooling ✅
- [x] ESLint v9 flat config.
- [x] Prettier.
- [x] GitHub Actions CI.
- [x] Vitest coverage thresholds.

### Phase 7 — Error Handling + Cleanup + Integration Tests ✅
- [x] `mx-error` CustomEvent on `@request` failure (`{ error, url, method }`).
- [x] Connection cleanup registry (`@stream`, `@ws`, `@sse` tear down correctly).
- [x] 12 integration tests covering end-to-end flows.

### Phase 8 — Architectural Cleanup ✅
- [x] Removed legacy `mt-*` interface (parser, docs, README, Docusaurus).
- [x] Aligned naming across docs and source.
