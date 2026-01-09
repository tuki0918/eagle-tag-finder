import { useEffect, useRef, useState } from "react";

export const useInView = <T extends HTMLElement>(
  options: IntersectionObserverInit,
) => {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  const { root, rootMargin, threshold } = options;

  useEffect(() => {
    if (!ref.current || inView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
          }
        });
      },
      { root, rootMargin, threshold },
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [inView, root, rootMargin, threshold]);

  return { ref, inView };
};
