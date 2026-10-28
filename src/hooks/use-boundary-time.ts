import { useEffect, useState } from "react";

/** Update at start/stop boundaries, without rerendering the surrounding UI each second. */
export function useBoundaryTime(start: number | null, stop: number | null) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const update = () => {
      clearTimeout(timer);
      const current = Date.now();
      setNow(current);
      const next = [start, stop].filter((value): value is number => value != null && value > current)
        .sort((a, b) => a - b)[0];
      if (next != null) timer = setTimeout(update, Math.min(next - current, 2_147_483_647));
    };
    update();
    document.addEventListener("visibilitychange", update);
    return () => { clearTimeout(timer); document.removeEventListener("visibilitychange", update); };
  }, [start, stop]);
  return now;
}
