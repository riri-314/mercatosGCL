import { useSyncExternalStore } from "react";
import { useInViewport } from "../../hooks/use-in-viewport";

let now = Date.now();
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();
const snapshot = () => now;
const idle = () => () => {};
function tick() {
  now = Date.now();
  listeners.forEach(listener => listener());
}
function resume() {
  clearInterval(timer);
  timer = undefined;
  tick();
  if (!document.hidden && listeners.size) timer = setInterval(tick, 1000);
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    document.addEventListener("visibilitychange", resume);
    resume();
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      clearInterval(timer);
      timer = undefined;
      document.removeEventListener("visibilitychange", resume);
    }
  };
}

export default function Countdown({ stop, format }: { stop: number; format: (ms: number) => string }) {
  const { ref, visible } = useInViewport<HTMLSpanElement>();
  const current = useSyncExternalStore(visible && stop > Date.now() ? subscribe : idle, snapshot, snapshot);
  return <span ref={ref}>{format(Math.max(0, stop - (visible ? current : Date.now())))}</span>;
}
