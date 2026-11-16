import type { HostCanvas } from '../../../packages/viewer-core/src';

/** Adapts a browser / web-view canvas to the five members the viewer core needs. */
export function hostCanvas(el: HTMLCanvasElement): HostCanvas {
  return {
    get width() { return el.width; },
    set width(v: number) { el.width = v; },
    get height() { return el.height; },
    set height(v: number) { el.height = v; },
    getContext: (type, attrs) => el.getContext(type, attrs),
    requestAnimationFrame: (cb) => window.requestAnimationFrame(cb),
    cancelAnimationFrame: (id) => window.cancelAnimationFrame(id),
  };
}
