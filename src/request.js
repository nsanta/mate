import { ATTRIBUTES } from './constants.js';

const DEFAULT_OPTIONS = { method: 'GET' };

export function collectMetaHeaders() {
  const headers = {};
  const metaHeaders = document.querySelectorAll(`meta[${ATTRIBUTES.HEADER_META}]`);

  metaHeaders.forEach((meta) => {
    const name = meta.getAttribute('name');
    const content = meta.getAttribute('content');
    if (name && content) {
      headers[name] = content;
    }
  });

  return headers;
}

function extractFormData(node, format) {
  const form = node instanceof HTMLFormElement ? node : node.closest('form');
  if (!form) {
    console.warn(`@form:${format} requested but no form found for element`, node);
    return null;
  }

  const formData = new FormData(form);

  if (format === 'multipart') {
    return formData;
  }

  if (format === 'form') {
    return new URLSearchParams(formData);
  }

  if (format === 'json') {
    const data = {};
    for (const [key, value] of formData) {
      if (data[key] !== undefined) {
        if (!Array.isArray(data[key])) {
          data[key] = [data[key]];
        }
        data[key].push(value);
      } else {
        data[key] = value;
      }
    }
    return JSON.stringify(data);
  }

  return null;
}

export async function request(node, _options, _event) {
  const requestOptions = {
    method: node.getAttribute(ATTRIBUTES.REQUEST_METHOD) || DEFAULT_OPTIONS.method,
    headers: collectMetaHeaders(),
  };

  const mxData = node.getAttribute(ATTRIBUTES.REQUEST_DATA);
  const isFormFormat = mxData && mxData.startsWith('@form:');

  if (['GET', 'HEAD'].includes(requestOptions.method) && mxData) {
    console.warn(
      `mx-data is ignored when method is ${requestOptions.method} (HTTP GET/HEAD must not have a body). Use POST/PUT/PATCH instead.`,
    );
  }

  if (!['GET', 'HEAD'].includes(requestOptions.method)) {
    if (isFormFormat) {
      const format = mxData.split(':')[1];
      const body = extractFormData(node, format);
      if (body) {
        requestOptions.body = body;
        if (format === 'json') {
          requestOptions.headers['Content-Type'] = 'application/json';
        }
      }
    } else if (node.tagName === 'FORM') {
      requestOptions.body = extractFormData(node, 'form');
    } else {
      const jsonData = JSON.parse(node.getAttribute(ATTRIBUTES.REQUEST_DATA) || '{}');
      requestOptions.body = JSON.stringify(jsonData);
      requestOptions.headers['Content-Type'] = 'application/json';
    }
  }

  const url = node.getAttribute(ATTRIBUTES.REQUEST_PATH);
  try {
    return await fetch(url, requestOptions);
  } catch (error) {
    console.error(`@request to "${url}" failed:`, error.message);
    node.dispatchEvent(
      new CustomEvent('mx-error', {
        detail: { error, url, method: requestOptions.method },
        bubbles: true,
        cancelable: true,
      }),
    );
    return null;
  }
}
