---
sidebar_position: 2
---

# Form Submission

Mate can handle form submissions via AJAX automatically.

## Usage

Attach the `mt-on` attribute to a `<form>` element.

```html
<form 
  mt-on="submit:@request"
  mt-path="/api/submit"
  mt-method="POST"
>
  <input type="text" name="username" />
  <button type="submit">Submit</button>
</form>
```

### How it works

1.  When the form is submitted, Mate intercepts the event.
2.  It collects all form data into a `FormData` object.
3.  It sends the data to the specified `mt-path` using the method defined in `mt-method`.
4.  The response is handled by the configured presenter (defaulting to updating the form's inner HTML).

### JSON Data

For non-form elements or when you want to send JSON data explicitly, you can use `mt-data`.

```html
<button
  mt-on="click:@request"
  mt-path="/api/update"
  mt-method="POST"
  mt-data='{"id": 123, "status": "active"}'
>
  Update Status
</button>
```
