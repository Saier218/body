/** State shared between pages, kept on getApp().globalData. */
import type { Lang } from './text';

export interface GlobalData {
  lang: Lang;
  /** diagnostics lines shown on the Me page */
  diag: string[];
  /** set by the Me page; the body page starts the benchmark when it is shown */
  benchPending: boolean;
  benchmarking: boolean;
}

export interface AppOption {
  globalData: GlobalData;
}

export function store(): GlobalData {
  return getApp<AppOption>().globalData;
}

const listeners: Array<() => void> = [];

export function subscribe(fn: () => void): void {
  listeners.push(fn);
}

function notify(): void {
  listeners.forEach((fn) => fn());
}

export function report(line: string): void {
  store().diag.push(line);
  notify();
}

export function finishBenchmark(line: string): void {
  store().benchmarking = false;
  report(line);
}
