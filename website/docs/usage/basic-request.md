---
sidebar_position: 1
---

# Basic Request

The most common use case for Mate is performing an HTTP request when an event occurs, such as a click.

## Usage

Use the event-specific `mx-{event}` attribute to define the event, the action, and the presenter.

```html
<button 
  mx-click="@request:@inner"
  mx-method="GET"
  mx-path="/api/data"
>
  Load Data
</button>
```

### Attributes

- `mx-{event}="<action>:<presenter>"`: Specifies the event (e.g., `mx-click`), the action (`@request`), and how/where to present the response (e.g., `@inner` to update the button's inner HTML).
- `mx-method`: The HTTP method to use (e.g., `GET`, `POST`). Defaults to `GET`.
- `mx-path`: The URL path to send the request to.

## Example

When the button is clicked, Mate will send a GET request to `/api/data`. Since the presenter is specified as `@inner`, the response content will replace the `innerHTML` of the button (or the element that triggered the event).

To control where the response is displayed, see the [Presenters](./presenters.md) documentation.
