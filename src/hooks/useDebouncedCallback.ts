import { useCallback, useEffect, useRef } from "react";

type AnyFn = (...args: unknown[]) => void;

export const useDebouncedCallback = <T extends AnyFn>(
  fn: T,
  delayMs: number,
) => {
  const fnRef = useRef(fn);
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        fnRef.current(...args);
      }, delayMs);
    },
    [delayMs],
  );
};
