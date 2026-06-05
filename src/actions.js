import { request } from './request.js';
import { triggerEvent, trigger } from './dispatch.js';
import { stream } from './stream.js';
import { ws } from './ws.js';
import { sse } from './sse.js';

export default {
  '@request': request,
  '@event': triggerEvent,
  '@passthrough': triggerEvent,
  '@trigger': trigger,
  '@dispatch': trigger,
  '@stream': stream,
  '@ws': ws,
  '@sse': sse,
};
