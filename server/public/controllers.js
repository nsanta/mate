class Counter {
  constructor(node) {
    this.node = node;
    this.count = 0;
    this.display = node.querySelector('[data-counter-display]');
  }
  increment() {
    this.count++;
    if (this.display) this.display.textContent = this.count;
  }
  decrement() {
    this.count--;
    if (this.display) this.display.textContent = this.count;
  }
  reset() {
    this.count = 0;
    if (this.display) this.display.textContent = this.count;
  }
}

class ToggleContent {
  constructor(node) {
    this.node = node;
    this.target = node.querySelector('[data-toggle-target]') || document.querySelector('#toggle-demo');
  }
  toggle() {
    if (this.target) this.target.classList.toggle('hidden');
  }
}

class UpdateContent {
  constructor(node) {
    this.node = node;
  }
  async update(response) {
    this.node.innerHTML = await response.text();
  }
}

window.Counter = Counter;
window.ToggleContent = ToggleContent;
window.UpdateContent = UpdateContent;
