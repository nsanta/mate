# Changelog

All notable changes to mate.js are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.9.0] — Hardening Pass

A multi-phase hardening pass took the library from prototype quality to production-ready. Summarized below; see `ROADMAP.md` for the full breakdown.

### Added
- **Controller registry API**: `mate.registerController`, `getController`, `hasController`, `removeController`, `clearControllers` — decouple controller lookup from `window[name]` globals.
- **Capability registry API**: `mate.getCapability`, `hasCapability`, `removeCapability`.
- **Presenter registry API**: `mate.getPresenter`, `hasPresenter`.
- **`mate()` teardown function** — calling the return value of `mate()` disconnects the observer, removes event listeners, and closes every active `@stream` / `@ws` / `@sse` connection.
- **`mx-error` CustomEvent** — failed `@request` calls now dispatch `mx-error` on the triggering node with `{ error, url, method }` as `event.detail`.
- **`.stopImmediate` modifier** — calls `event.stopImmediate()`.
- **Silent aliases** — `@dispatch` (alias for `@trigger`) and `@passthrough` (alias for `@event`).
- **XSS-safe `@text` presenter**.
- **ESLint v9 flat config, Prettier, GitHub Actions CI, Vitest coverage thresholds.**
- **13 integration tests** covering end-to-end flows.
- **306 total tests across 20 files (≈98% coverage).**

### Fixed
- Duplicate `STOP` modifier check.
- `once` modifier dead code.
- `load` event bypassing modifiers.
- Missing `await` in `presenter.byId`.
- `updateDOM` dead-code path.
- Unused `attributes: true` in `MutationObserver` config.
- `SSE._manualClose` bug.
- WebSocket binary-message handling.
- `mx-data` is now ignored (with a console warning) when the method is `GET` or `HEAD`, since those HTTP methods cannot have a body.

### Removed
- Legacy `mt-*` attribute syntax (parser, docs, README, Docusaurus). Only `mx-*` is supported now.

## [0.5.0] — Phase 5: Advanced Connectivity

### Added
- `@stream` action for HTTP streaming responses.
- `@ws` action for WebSocket with automatic reconnection (exponential backoff).
- `@sse` action for Server-Sent Events.

## [0.4.0] — Phase 4: Extensibility

### Added
- `mate.registerCapability` / `registerPresenter`.
- Controllers API with `@controller:method` presenter.
- NPM + CDN distribution.

## [0.3.0] — Phase 3: Event-Centric Syntax

### Added
- `mx-*` attribute syntax (`mx-click`, `mx-submit`, `mx-path`, `mx-method`, `mx-data`, `mx-controller`).
- Modifiers: `.prevent`, `.stop`, `.once`, `.self`, `.debounce`, `.throttle`, `.capture`, `.passive`, `.window`, `.document`, `.outside`.
- Object-based and function-based custom capabilities with `Capability.method` syntax.

## [0.2.0] — Phase 2: Expanded Interactions

### Added
- Events: `mouseover`, `mouseenter`, `mouseleave`, `mouseup`, `mousedown`, `input`, `scroll`, `focus`, `blur`, `keydown`, `keyup`.

## [0.1.0] — Phase 1: Core Foundation

### Added
- `@request` and `@event` actions.
- Presenters: `@inner`, `@outer`, `@id`, `@class`, `@append`, `@prepend`.
- Initial `click`, `submit`, `load` events.
