---
sidebar_position: 1
---

# Basic Request

The most common use case for Mate is performing an HTTP request when an event occurs, such as a click.

## Usage

Use the `mt-on` attribute to define the event and the action.

```html
<button 
  mt-on="click:@request"
  mt-method="GET"
  mt-path="/api/data"
>
  Load Data
</button>
```

### Attributes

- `mt-on="<event>:@request"`: Specifies the event (e.g., `click`) and the action (`@request`).
- `mt-method`: The HTTP method to use (e.g., `GET`, `POST`). Defaults to `GET`.
- `mt-path`: The URL to send the request to.

## Example

When the button is clicked, Mate will send a GET request to `/api/data`. By default, if no presenter is specified, the response content will replace the `innerHTML` of the button (or the element that triggered the event).

To control where the response is displayed, see the [Presenters](./presenters.md) documentation.
