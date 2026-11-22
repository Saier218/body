/** The platform-independent 3D core, built from packages/viewer-core into libs/viewer-core.js. */
import type * as Core from '../../../packages/viewer-core/src';

const core = require('../libs/viewer-core.js') as typeof Core;

export type Viewer = Core.Viewer;
export type HostCanvas = Core.HostCanvas;

export function createViewer(opts: Core.ViewerOptions): Viewer {
  return core.createViewer(opts);
}
