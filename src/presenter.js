const OUTER = 'outer';
const TEXT = 'text';

async function inner(node, response) {
  node.innerHTML = await response.text();
}

async function outer(node, response) {
  node.outerHTML = await response.text();
}

async function text(node, response) {
  node.textContent = await response.text();
}

async function byId(node, response, id, option) {
  const elementNode = document.getElementById(id);
  if (!elementNode) {
    console.warn(`@id target "${id}" not found`);
    return;
  }
  if (option === OUTER) {
    await outer(elementNode, response);
    return;
  }
  if (option === TEXT) {
    await text(elementNode, response);
    return;
  }
  await inner(elementNode, response);
}

async function byClass(node, response, klass, option) {
  const result = await response.text();
  Array.from(document.getElementsByClassName(klass)).forEach((element) => {
    if (option === OUTER) {
      element.outerHTML = result;
      return;
    }
    if (option === TEXT) {
      element.textContent = result;
      return;
    }
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
  '@text': text,
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
