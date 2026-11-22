import type { Viewer } from '../../../packages/viewer-core/src';

/** Forwards pointer (touch, mouse, pen) input on the canvas to the viewer. Returns an unbind function. */
export function bindPointers(canvas: HTMLCanvasElement, viewer: Viewer): () => void {
  const active = new Map<number, { x: number; y: number }>();
  const points = () => Array.from(active.values());
  const local = (ev: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  };
  const down = (ev: PointerEvent) => {
    canvas.setPointerCapture(ev.pointerId);
    active.set(ev.pointerId, local(ev));
    viewer.touchStart(points());
  };
  const move = (ev: PointerEvent) => {
    if (!active.has(ev.pointerId)) return;
    active.set(ev.pointerId, local(ev));
    viewer.touchMove(points());
  };
  const end = (ev: PointerEvent) => {
    if (!active.delete(ev.pointerId)) return;
    viewer.touchEnd(points());
  };
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  return () => {
    canvas.removeEventListener('pointerdown', down);
    canvas.removeEventListener('pointermove', move);
    canvas.removeEventListener('pointerup', end);
    canvas.removeEventListener('pointercancel', end);
  };
}
