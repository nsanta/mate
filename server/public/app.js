import mate from '/src/mate.js';

mate.registerCapability('Analytics', {
  track(node, event, parsedEvent) {
    const action = parsedEvent.capability + '.' + parsedEvent.method;
    return Promise.resolve({ tracked: action, timestamp: Date.now() });
  },
  identify(node, event, parsedEvent) {
    return Promise.resolve({ identified: true, user: 'demo-user-' + Math.floor(Math.random() * 1000) });
  },
});

mate.registerCapability('Logger', (node, method, event, parsedEvent) => {
  return Promise.resolve({ level: method, message: 'Log entry captured', time: new Date().toLocaleTimeString() });
});

mate.registerPresenter('@uppercase', async (node, response, target) => {
  const text = await response.text();
  const targetNode = target ? (document.getElementById(target) || document.querySelector(target) || node) : node;
  targetNode.innerHTML = text.toUpperCase();
});

mate.registerPresenter('@json', async (node, response, target) => {
  const text = await response.text();
  const targetNode = target ? (document.getElementById(target) || document.querySelector(target) || node) : node;
  try {
    const parsed = JSON.parse(text);
    targetNode.innerHTML = '<pre class="text-xs bg-slate-900 text-green-400 p-3 rounded overflow-auto max-h-40">' + JSON.stringify(parsed, null, 2) + '</pre>';
  } catch {
    targetNode.textContent = text;
  }
});

mate.registerController('RegistryController', class {
  constructor(node) {
    this.node = node;
    this.count = 0;
    this.display = node.querySelector('[data-registry-display]');
  }
  tick() {
    this.count++;
    if (this.display) this.display.textContent = 'Tick #' + this.count;
  }
});

mate();
