import { useCallback, useSyncExternalStore } from "react";

/**
 * Reactive media query, for the handful of places a breakpoint has to reach
 * JavaScript — chart axis widths and the like, which take numbers, not classes.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Tailwind's `sm` breakpoint, expressed for JavaScript. */
export const useIsMobile = () => useMediaQuery("(max-width: 639px)");
