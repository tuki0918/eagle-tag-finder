import type { RefObject } from "react";
import { useEffect } from "react";

type Handler = (event: MouseEvent) => void;

export const useOutsideClick = <T extends HTMLElement>(
  ref: RefObject<T>,
  handler: Handler,
  enabled = true,
) => {
  useEffect(() => {
    if (!enabled) return;

    const listener = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!ref.current || !target || ref.current.contains(target)) return;
      handler(event);
    };

    document.addEventListener("click", listener);
    return () => document.removeEventListener("click", listener);
  }, [enabled, handler, ref]);
};
