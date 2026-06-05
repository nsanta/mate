const cleanups = [];

export function registerCleanup(fn) {
  cleanups.push(fn);
}

export function runCleanups() {
  while (cleanups.length) {
    const fn = cleanups.pop();
    try {
      fn();
    } catch (e) {
      console.error('Cleanup failed:', e);
    }
  }
}
