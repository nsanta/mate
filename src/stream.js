import { ATTRIBUTES } from './constants.js';
import { registerCleanup } from './cleanup.js';
import { collectMetaHeaders } from './request.js';
import { updateDOM } from './update-dom.js';

class StreamResponse {
  constructor() {
    this.chunks = [];
    this.isComplete = false;
  }

  text() {
    return Promise.resolve(this.chunks.join(''));
  }

  append(chunk) {
    this.chunks.push(chunk);
    this.isComplete = false;
  }

  complete() {
    this.isComplete = true;
  }
}

export async function stream(node, options, _event) {
  const url = node.getAttribute(ATTRIBUTES.REQUEST_PATH);
  const method = node.getAttribute(ATTRIBUTES.REQUEST_METHOD) || 'GET';

  if (!url) {
    console.error('@stream requires mx-path attribute');
    return null;
  }

  const streamResponse = new StreamResponse();
  const abortController = new AbortController();

  node._streamAbortController = abortController;
  registerCleanup(() => abortController.abort());

  try {
    const response = await fetch(url, {
      method,
      headers: collectMetaHeaders(),
      signal: abortController.signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`Stream failed: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let isFirstChunk = true;

    const { presentation, target, presentationOption } = options || {};

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        if (buffer) {
          streamResponse.append(buffer);
          if (!isFirstChunk) {
            await updateDOM(node, buffer, presentation, target, presentationOption);
          }
        }
        streamResponse.complete();
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line) {
          streamResponse.append(line);

          if (isFirstChunk) {
            isFirstChunk = false;
            await updateDOM(node, line, presentation, target, presentationOption);
          } else {
            await updateDOM(node, line, presentation, target, presentationOption, true);
          }
        }
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Stream cancelled');
    } else {
      console.error('Stream error:', error);
    }
  } finally {
    node._streamAbortController = null;
  }

  return streamResponse;
}
