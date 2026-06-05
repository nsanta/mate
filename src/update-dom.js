import { present } from './presenter.js';

export async function updateDOM(
  node,
  content,
  presentation,
  target,
  presentationOption,
  isUpdate = false,
) {
  if (!isUpdate) {
    const mockResponse = { text: () => Promise.resolve(content) };
    await present(node, mockResponse, presentation, target, presentationOption);
    return;
  }

  switch (presentation) {
    case '@inner':
    case undefined:
      node.innerHTML += content;
      break;
    case '@append':
      node.insertAdjacentHTML('beforeend', content);
      break;
    case '@prepend':
      node.insertAdjacentHTML('afterbegin', content);
      break;
    case '@id':
      if (target) {
        const elem = document.getElementById(target);
        if (elem) elem.innerHTML += content;
      }
      break;
    default:
      if (presentation && presentation.startsWith('@')) {
        const mockResponse = { text: () => Promise.resolve(content) };
        await present(node, mockResponse, presentation, target, presentationOption);
      }
  }
}
