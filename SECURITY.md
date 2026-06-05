# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in mate.js, **please do not open a public issue**.

Instead, report it privately using one of these channels:

- **GitHub private vulnerability reporting** (preferred): go to <https://github.com/nsanta/mate/security/advisories/new> and submit a private advisory.
- **Email**: contact the maintainer at the address listed on the GitHub profile.

Please include:

- A description of the issue and its potential impact.
- The version of mate.js affected.
- A minimal reproduction (code snippet, HTML page, or repo link).
- Any known workarounds.

## Response Timeline

We aim to acknowledge reports within 72 hours and to ship a fix within 14 days for high-severity issues. You will be kept informed throughout the process and credited in the release notes (unless you prefer to remain anonymous).

## Supported Versions

Only the latest minor release line receives security updates. Please upgrade before reporting.

| Version | Supported |
|---------|-----------|
| 0.9.x   | ✅        |
| < 0.9   | ❌        |

## Scope

Mate.js manipulates the DOM and makes HTTP requests based on declarative attributes. Security-relevant bugs include:

- XSS vectors in presenters (`@inner`, `@append`, `@prepend`, etc.) when rendering untrusted server responses.
- Authentication or header leakage across origins.
- WebSocket / SSE connection handling that could leak credentials or stay open after teardown.
- Issues with the `MutationObserver` re-processing untrusted DOM.

Bugs in third-party dependencies should be reported to the upstream project.

## Out of Scope

- Bugs in user-supplied controller code or custom capabilities.
- Server-side vulnerabilities in the demo server (`server/index.js`) — it is intended for local development only and should not be deployed to production as-is.
- Issues that require already having XSS on the page (mate.js cannot defend against a compromised page).
