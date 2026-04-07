---
sidebar_position: 4
---

# Controllers

Controllers allow you to attach custom JavaScript logic to DOM elements. This is useful for handling complex interactions or processing data returned from requests.

## Defining a Controller

A controller is a simple JavaScript class. It must be available on the global `window` object (or accessible scope) to be instantiated by Mate.

```javascript
class CounterController {
  constructor(element) {
    this.element = element;
    this.count = 0;
  }

  increment() {
    this.count++;
    this.element.innerText = `Count: ${this.count}`;
  }
  
  // Method called by @controller presenter
  update(response) {
      response.text().then(text => {
          console.log("Received:", text);
          this.element.innerText = text;
      });
  }
}

window.CounterController = CounterController;
```

## Attaching a Controller

Use the `mt-controller` attribute to attach a controller to an element.

```html
<div mt-controller="CounterController">
  Count: 0
</div>
```

When Mate initializes this element, it will create a new instance of `CounterController`, passing the DOM element as an argument. The instance is stored on the element's `mtController` property.

## Using with Presenters

You can direct the response of a request to a specific method in your controller using the `@controller` presenter.

```html
<button 
  mt-controller="DataController"
  mt-on="click:@request"
  mt-path="/api/data"
  mt-pr="@controller:processData"
>
  Fetch Data
</button>
```

In this example, when the request completes, `DataController.processData(response)` will be called.
