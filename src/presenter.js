const INNER = 'inner';
const OUTER = 'outer';

async function inner(node, response) {
  node.innerHTML = await response.text();
}

async function outer(node, response) {
  node.outerHTML = await response.text();
}

async function byId(node, response, id, option) {
  const elementNode = document.getElementById(id);
  if (option === OUTER) { outer(elementNode, response); return; }
  inner(elementNode, response);
}

async function byClass(node, response, klass, option) {
  const result = await response.text();
  Array.from(document.getElementsByClassName(klass)).forEach((element) => {
    if (option === OUTER) { element.outerHTML = result; return; }
    element.innerHTML = result;
  });
}

async function append(node, response) {
  node.insertAdjacentHTML('beforeend', await response.text());
}

async function prepend(node, response) {
  node.insertAdjacentHTML('afterbegin', await response.text());
}

async function controller(node, response, func) {
  node.mxController[func](response);
}

const PRESENTERS = {
  '@inner': inner,
  '@outer': outer,
  '@id': byId,
  '@class': byClass,
  '@append': append,
  '@prepend': prepend,
  '@controller': controller,
};

export function registerPresenter(name, handler) {
  PRESENTERS[name] = handler;
}

export function getPresenter(name) {
  return PRESENTERS[name];
}

export function hasPresenter(name) {
  return name in PRESENTERS;
}

export async function present(node, response, presentation, target, option) {
  if (presentation) {
    const presenter = PRESENTERS[presentation];
    if (presenter) {
      await presenter(node, response, target, option);
      return;
    }
    console.warn(`Presenter "${presentation}" not found`);
    await inner(node, response);
    return;
  }

  // Default to @inner if no presentation is specified
  await inner(node, response);
}

export default PRESENTERS;
