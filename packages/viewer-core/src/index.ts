/**
 * Platform-independent 3D anatomy viewer.
 * It only talks to the host through HostCanvas, so the same code runs in a WeChat
 * mini program, a browser page or an app web view. No DOM, no wx.* in here.
 */
import {
  Box3,
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Sphere,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { parseGlb } from './glb';

export interface HostCanvas {
  width: number;
  height: number;
  getContext(type: string, attrs?: Record<string, unknown>): unknown;
  requestAnimationFrame(cb: () => void): number;
  cancelAnimationFrame(id: number): void;
}

export interface CatalogEntry {
  id: string;
  kind: string;
  group: string;
}

export interface ViewerOptions {
  canvas: HostCanvas;
  /** canvas size in CSS pixels */
  width: number;
  height: number;
  pixelRatio: number;
  /** clear colour; null makes the canvas transparent so the host page's background shows through */
  background?: number | null;
  /** surface colour per structure kind, so the host's design tokens drive the model too */
  colors?: Record<string, number>;
  /** tint added to the selected structure */
  selectColor?: number;
}

export interface FocusOptions {
  /** groups the camera should fit; null fits the whole model */
  frame: string[] | null;
  /** group kept at full brightness while the rest is dimmed; null dims nothing */
  highlight: string | null;
  /** only these structure kinds count when fitting the camera (long muscles can stretch a region's bounds) */
  frameKinds?: string[];
  /** jump without the camera animation */
  instant?: boolean;
}

export interface TouchPoint {
  x: number;
  y: number;
}

export interface ViewerStats {
  glVersion: string;
  meshes: number;
  triangles: number;
  drawCalls: number;
}

const DEFAULT_COLORS: Record<string, number> = {
  bone: 0xe8dfc8,
  muscle: 0xb5483e,
  fascia: 0xd9d2c0,
  pulley: 0x8fc4dd,
};
const DEFAULT_SELECT = 0x996b00;
const SELECT_INTENSITY = 0.6;
const DIM = 0.28;
const TAP_MOVE_PX = 8;
const TAP_MS = 350;

interface Item {
  entry: CatalogEntry;
  mesh: Mesh<BufferGeometry, MeshStandardMaterial>;
  base: Color;
}

export class Viewer {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera: PerspectiveCamera;
  private canvas: HostCanvas;
  private items = new Map<string, Item>();
  private raycaster = new Raycaster();
  private width: number;
  private height: number;
  private glVersion: string;

  // orbit state: camera sits on a sphere around `target`
  private target = new Vector3();
  private radius = 300;
  private theta = 0;
  private phi = Math.PI / 2;
  private minRadius = 10;
  private maxRadius = 2000;
  private goal: { target: Vector3; radius: number; from: Vector3; fromRadius: number; start: number } | null = null;

  private touches: TouchPoint[] = [];
  private downAt = 0;
  private downPos: TouchPoint = { x: 0, y: 0 };
  private moved = 0;

  private frame = 0;
  private dirty = false;
  private disposed = false;
  private bench: { until: number; frames: number; start: number; done: (fps: number) => void } | null = null;

  private selected = new Set<string>();
  private focused: string | null = null;
  private hiddenKinds = new Set<string>();
  private colors: Record<string, number>;
  private selectColor: number;
  private mirrored = false;

  /** called with the picked structure id (or null) when the user taps */
  onTap: (id: string | null) => void = () => {};

  constructor(opts: ViewerOptions) {
    this.canvas = opts.canvas;
    this.width = opts.width;
    this.height = opts.height;
    this.colors = { ...DEFAULT_COLORS, ...opts.colors };
    this.selectColor = opts.selectColor ?? DEFAULT_SELECT;
    const transparent = opts.background === null;
    const gl = opts.canvas.getContext('webgl2', { antialias: true, alpha: transparent, powerPreference: 'high-performance' }) as {
      VERSION: number;
      getParameter(p: number): unknown;
    } | null;
    if (!gl) throw new Error('WEBGL2_UNAVAILABLE');
    this.glVersion = String(gl.getParameter(gl.VERSION));
    const host = opts.canvas;
    // three.js expects a few DOM members on the canvas; give it inert ones.
    const facade = {
      get width() {
        return host.width;
      },
      set width(v: number) {
        host.width = v;
      },
      get height() {
        return host.height;
      },
      set height(v: number) {
        host.height = v;
      },
      style: {},
      addEventListener() {},
      removeEventListener() {},
      getContext: () => gl,
    };
    this.renderer = new WebGLRenderer({ canvas: facade as unknown as never, context: gl as unknown as never, antialias: true });
    this.renderer.setPixelRatio(opts.pixelRatio);
    this.renderer.setSize(opts.width, opts.height, false);
    if (transparent) this.renderer.setClearColor(0x000000, 0);
    else this.scene.background = new Color(opts.background ?? 0x15171c);
    this.camera = new PerspectiveCamera(32, opts.width / opts.height, 1, 5000);
    this.scene.add(new HemisphereLight(0xffffff, 0x39424e, 1.25));
    const key = new DirectionalLight(0xffffff, 2.0);
    key.position.set(0.4, 0.6, 1);
    this.camera.add(key);
    this.scene.add(this.camera);
  }

  /** remove the loaded model so another one can be shown in the same canvas */
  clear(): void {
    this.items.forEach((it) => {
      this.scene.remove(it.mesh);
      it.mesh.geometry.dispose();
      it.mesh.material.dispose();
    });
    this.items.clear();
    this.selected.clear();
    this.focused = null;
    this.goal = null;
    this.mirrored = false;
    this.invalidate();
  }

  /** set the camera's orbit angles: theta around the vertical axis (0 = front), phi from the top (π/2 = level) */
  setOrbit(theta: number, phi: number): void {
    this.theta = theta;
    this.phi = Math.min(Math.PI - 0.05, Math.max(0.05, phi));
    this.invalidate();
  }

  load(glb: ArrayBuffer, catalog: CatalogEntry[]): void {
    const byId = new Map(catalog.map((c) => [c.id, c] as const));
    for (const m of parseGlb(glb)) {
      const entry = byId.get(m.name);
      if (!entry) throw new Error('model part missing from catalog: ' + m.name);
      const geo = new BufferGeometry();
      geo.setAttribute('position', new BufferAttribute(m.positions, 3));
      geo.setIndex(new BufferAttribute(m.indices, 1));
      geo.computeVertexNormals();
      geo.computeBoundingSphere();
      const base = new Color(this.colors[entry.kind] ?? 0x999999);
      const mat = new MeshStandardMaterial({ color: base.clone(), roughness: 0.62, metalness: 0, emissiveIntensity: SELECT_INTENSITY });
      const mesh = new Mesh(geo, mat);
      mesh.name = entry.id;
      this.scene.add(mesh);
      this.items.set(entry.id, { entry, mesh, base });
    }
    for (const c of catalog) if (!this.items.has(c.id)) throw new Error('catalog entry missing from model: ' + c.id);
    const all = this.boundsOf(() => true);
    this.target.copy(all.center);
    this.radius = this.fitRadius(all.radius);
    this.minRadius = all.radius * 0.05;
    this.maxRadius = all.radius * 6;
    this.theta = -0.5;
    this.phi = 1.35;
    this.invalidate();
  }

  // ---------- interaction ----------

  touchStart(points: TouchPoint[]): void {
    this.touches = points.map((p) => ({ ...p }));
    if (points.length === 1) {
      this.downAt = Date.now();
      this.downPos = { ...points[0] };
      this.moved = 0;
    }
  }

  touchMove(points: TouchPoint[]): void {
    const prev = this.touches;
    if (points.length === 1 && prev.length === 1) {
      const dx = points[0].x - prev[0].x;
      const dy = points[0].y - prev[0].y;
      this.moved = Math.max(this.moved, Math.hypot(points[0].x - this.downPos.x, points[0].y - this.downPos.y));
      this.theta -= (dx / this.width) * Math.PI * 1.6;
      this.phi = Math.min(Math.PI - 0.05, Math.max(0.05, this.phi - (dy / this.height) * Math.PI));
      this.goal = null;
      this.invalidate();
    } else if (points.length >= 2 && prev.length >= 2) {
      const d0 = Math.hypot(prev[0].x - prev[1].x, prev[0].y - prev[1].y);
      const d1 = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      if (d0 > 0 && d1 > 0) this.radius = Math.min(this.maxRadius, Math.max(this.minRadius, (this.radius * d0) / d1));
      // two-finger drag pans the orbit centre in the view plane
      const mx = (points[0].x + points[1].x - prev[0].x - prev[1].x) / 2;
      const my = (points[0].y + points[1].y - prev[0].y - prev[1].y) / 2;
      const scale = (2 * this.radius * Math.tan((this.camera.fov * Math.PI) / 360)) / this.height;
      const right = new Vector3().setFromMatrixColumn(this.camera.matrixWorld, 0);
      const up = new Vector3().setFromMatrixColumn(this.camera.matrixWorld, 1);
      this.target.addScaledVector(right, -mx * scale).addScaledVector(up, my * scale);
      this.moved = TAP_MOVE_PX + 1;
      this.goal = null;
      this.invalidate();
    }
    this.touches = points.map((p) => ({ ...p }));
  }

  touchEnd(remaining: TouchPoint[]): void {
    const wasSingle = this.touches.length === 1 && remaining.length === 0;
    this.touches = remaining.map((p) => ({ ...p }));
    if (wasSingle && this.moved <= TAP_MOVE_PX && Date.now() - this.downAt <= TAP_MS) {
      this.onTap(this.pick(this.downPos.x, this.downPos.y));
    }
  }

  /** id of the front-most visible structure under the point, in CSS pixels from the canvas top-left */
  pick(x: number, y: number): string | null {
    this.updateCamera();
    this.raycaster.setFromCamera(new Vector2((x / this.width) * 2 - 1, -(y / this.height) * 2 + 1), this.camera);
    const meshes: Mesh[] = [];
    this.items.forEach((it) => {
      if (it.mesh.visible) meshes.push(it.mesh);
    });
    const hit = this.raycaster.intersectObjects(meshes, false)[0];
    return hit ? hit.object.name : null;
  }

  entry(id: string): CatalogEntry | null {
    return this.items.get(id)?.entry ?? null;
  }

  /** highlight one or more meshes (a structure can span several); null clears the selection */
  select(ids: string | string[] | null): void {
    this.selected = new Set(ids === null ? [] : Array.isArray(ids) ? ids : [ids]);
    this.restyle();
  }

  /** move the camera to fit some groups and optionally dim everything outside one group */
  focus(opts: FocusOptions): void {
    this.focused = opts.highlight;
    const frame = opts.frame;
    const inFrame = (e: CatalogEntry) => frame === null || frame.includes(e.group);
    const kinds = opts.frameKinds;
    const inFrameOfKind = (e: CatalogEntry) => inFrame(e) && (!kinds || kinds.includes(e.kind));
    // fall back to every kind when the region has none of the requested ones
    const b = this.boundsOf(this.some(inFrameOfKind) ? inFrameOfKind : inFrame);
    const radius = this.fitRadius(b.radius);
    if (opts.instant) {
      this.goal = null;
      this.target.copy(b.center);
      this.radius = radius;
    } else {
      this.goal = { target: b.center, radius, from: this.target.clone(), fromRadius: this.radius, start: Date.now() };
    }
    this.restyle();
  }

  /** zoom to one group of structures and dim the rest; null returns to the overview (kept for the frozen mini program) */
  focusGroup(group: string | null): void {
    this.focus({ frame: group === null ? null : [group], highlight: group });
  }

  /**
   * Show the mirror image of the loaded model (a right hand becomes a left hand). The geometry is
   * mirrored in place, with triangle winding reversed so faces, lighting and picking stay correct,
   * and the camera is mirrored with it so the view stays the same, just flipped.
   */
  setMirrored(mirrored: boolean): void {
    if (mirrored === this.mirrored) return;
    this.mirrored = mirrored;
    this.items.forEach((it) => {
      const geo = it.mesh.geometry;
      const pos = geo.getAttribute('position') as BufferAttribute;
      const p = pos.array as Float32Array;
      for (let i = 0; i < p.length; i += 3) p[i] = -p[i];
      pos.needsUpdate = true;
      const index = geo.getIndex();
      if (index) {
        const ix = index.array;
        for (let i = 0; i < ix.length; i += 3) {
          const t = ix[i + 1];
          ix[i + 1] = ix[i + 2];
          ix[i + 2] = t;
        }
        index.needsUpdate = true;
      }
      geo.computeVertexNormals();
      geo.computeBoundingBox();
      geo.computeBoundingSphere();
    });
    this.target.x = -this.target.x;
    this.theta = -this.theta;
    if (this.goal) {
      this.goal.target.x = -this.goal.target.x;
      this.goal.from.x = -this.goal.from.x;
    }
    this.invalidate();
  }

  isMirrored(): boolean {
    return this.mirrored;
  }

  setKindVisible(kind: string, visible: boolean): void {
    if (visible) this.hiddenKinds.delete(kind);
    else this.hiddenKinds.add(kind);
    this.restyle();
  }

  /** call when the canvas changes size (rotation, window resize); sizes are in CSS pixels */
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.invalidate();
  }

  stats(): ViewerStats {
    let triangles = 0;
    this.items.forEach((it) => {
      triangles += (it.mesh.geometry.index?.count ?? 0) / 3;
    });
    return { glVersion: this.glVersion, meshes: this.items.size, triangles, drawCalls: this.renderer.info.render.calls };
  }

  /** spin the model for `seconds` rendering every frame, then report the average frame rate */
  benchmark(seconds: number, done: (fps: number) => void): void {
    this.bench = { until: Date.now() + seconds * 1000, frames: 0, start: Date.now(), done };
    this.invalidate();
  }

  dispose(): void {
    this.disposed = true;
    if (this.frame) this.canvas.cancelAnimationFrame(this.frame);
    this.items.forEach((it) => {
      it.mesh.geometry.dispose();
      it.mesh.material.dispose();
    });
    this.renderer.dispose();
  }

  // ---------- internals ----------

  private restyle(): void {
    this.items.forEach((it, id) => {
      it.mesh.visible = !this.hiddenKinds.has(it.entry.kind);
      const dim = this.focused !== null && it.entry.group !== this.focused;
      it.mesh.material.color.copy(it.base).multiplyScalar(dim ? DIM : 1);
      it.mesh.material.emissive.setHex(this.selected.has(id) ? this.selectColor : 0x000000);
    });
    this.invalidate();
  }

  private some(filter: (e: CatalogEntry) => boolean): boolean {
    for (const it of this.items.values()) if (filter(it.entry)) return true;
    return false;
  }

  private boundsOf(filter: (e: CatalogEntry) => boolean): Sphere {
    const box = new Box3();
    this.items.forEach((it) => {
      if (!filter(it.entry)) return;
      if (!it.mesh.geometry.boundingBox) it.mesh.geometry.computeBoundingBox();
      box.union(it.mesh.geometry.boundingBox as Box3);
    });
    if (box.isEmpty()) return new Sphere(this.target.clone(), this.radius / 3);
    return box.getBoundingSphere(new Sphere());
  }

  private fitRadius(objectRadius: number): number {
    const half = (this.camera.fov * Math.PI) / 360;
    const fit = Math.min(half, Math.atan(Math.tan(half) * this.camera.aspect));
    return (objectRadius / Math.sin(fit)) * 0.9;
  }

  private updateCamera(): void {
    const s = Math.sin(this.phi);
    this.camera.position.set(
      this.target.x + this.radius * s * Math.sin(this.theta),
      this.target.y + this.radius * Math.cos(this.phi),
      this.target.z + this.radius * s * Math.cos(this.theta),
    );
    this.camera.near = Math.max(0.5, this.radius / 200);
    this.camera.far = this.radius * 10 + 2000;
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(this.target);
    this.camera.updateMatrixWorld();
  }

  private invalidate(): void {
    this.dirty = true;
    if (this.frame || this.disposed) return;
    this.frame = this.canvas.requestAnimationFrame(() => this.tick());
  }

  private tick(): void {
    this.frame = 0;
    if (this.disposed) return;
    let again = false;
    const now = Date.now();
    if (this.goal) {
      const t = Math.min(1, (now - this.goal.start) / 380);
      const e = 1 - Math.pow(1 - t, 3);
      this.target.lerpVectors(this.goal.from, this.goal.target, e);
      this.radius = this.goal.fromRadius + (this.goal.radius - this.goal.fromRadius) * e;
      if (t >= 1) this.goal = null;
      else again = true;
    }
    if (this.bench) {
      this.theta += 0.02;
      this.bench.frames += 1;
      if (now >= this.bench.until) {
        const b = this.bench;
        this.bench = null;
        b.done((b.frames * 1000) / (now - b.start));
      } else again = true;
    }
    if (this.dirty || again) {
      this.dirty = false;
      this.updateCamera();
      this.renderer.render(this.scene, this.camera);
    }
    if (again) this.invalidate();
  }
}

export function createViewer(opts: ViewerOptions): Viewer {
  return new Viewer(opts);
}
