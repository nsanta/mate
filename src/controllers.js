const controllers = new Map();

export function registerController(name, controllerClass) {
  controllers.set(name, controllerClass);
}

export function getController(name) {
  return controllers.get(name);
}

export function hasController(name) {
  return controllers.has(name);
}

export function removeController(name) {
  controllers.delete(name);
}

export function clearControllers() {
  controllers.clear();
}

export function resolveController(name) {
  return controllers.get(name) ?? window[name];
}

export default {
  register: registerController,
  get: getController,
  has: hasController,
  remove: removeController,
  clear: clearControllers,
  resolve: resolveController,
};
