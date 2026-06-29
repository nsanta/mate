---
sidebar_position: 2
---

# Form Submission

Mate can handle form submissions via AJAX automatically.

## Usage

Attach the `mx-submit` attribute to a `<form>` element.

```html
<form 
  mx-submit="@request:@inner"
  mx-path="/api/submit"
  mx-method="POST"
>
  <input type="text" name="username" />
  <button type="submit">Submit</button>
</form>
```

### How it works

1. When the form is submitted, Mate intercepts the event.
2. It collects all form data into a `FormData` object.
3. It sends the data to the specified `mx-path` using the method defined in `mx-method`.
4. The response is handled by the configured presenter (e.g. `@inner` to update the form's inner HTML).

### JSON Data

For non-form elements or when you want to send JSON data explicitly, you can use `mx-data`.

```html
<button
  mx-click="@request:@inner"
  mx-path="/api/update"
  mx-method="POST"
  mx-data='{"id": 123, "status": "active"}'
>
  Update Status
</button>
```
