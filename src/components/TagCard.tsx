import { useEffect, useState } from "react";
import { useInView } from "../hooks/useInView";
import type { EagleTag, Representative } from "../types";

interface TagCardProps {
  tag: EagleTag;
  fetchRepresentative: (tagName: string) => Promise<Representative | null>;
}

type ThumbState =
  | { status: "loading" }
  | { status: "loaded"; url: string }
  | { status: "none" }
  | { status: "error" };

export const TagCard = ({ tag, fetchRepresentative }: TagCardProps) => {
  const { ref, inView } = useInView<HTMLDivElement>({
    root: null,
    rootMargin: "250px",
    threshold: 0.01,
  });
  const [thumbState, setThumbState] = useState<ThumbState>({
    status: "loading",
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!inView || !tag.name) return;

    let cancelled = false;

    const load = async () => {
      const rep = await fetchRepresentative(tag.name);
      if (cancelled) return;
      if (!rep?.url) {
        setThumbState({ status: "none" });
        return;
      }

      const img = new Image();
      img.loading = "lazy";
      img.src = rep.url;
      img.onload = () => {
        if (cancelled) return;
        setThumbState({ status: "loaded", url: rep.url as string });
      };
      img.onerror = () => {
        if (cancelled) return;
        setThumbState({ status: "error" });
      };
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [fetchRepresentative, inView, tag.name]);

  const handleCopy = async () => {
    if (!tag.name) return;
    try {
      await navigator.clipboard.writeText(tag.name);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 800);
    } catch (error) {
      console.error(error);
    }
  };

  const dotStyle = tag.color ? { background: tag.color } : undefined;
  const count = Number.isFinite(tag.count) ? tag.count : 0;

  return (
    <div
      role="button"
      tabIndex={0}
      className="card"
      data-tag={tag.name}
      onClick={handleCopy}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCopy();
        }
      }}
      ref={ref}
    >
      <div className="thumb">
        {thumbState.status === "loaded" ? (
          <img src={thumbState.url} loading="lazy" alt="" />
        ) : (
          <div className="ph">
            {thumbState.status === "error"
              ? "load failed"
              : thumbState.status === "none"
                ? "no thumbnail"
                : "thumbnail..."}
          </div>
        )}
      </div>
      {copied ? (
        <div className="copied-overlay">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <title>Copied</title>
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <div className="copied-text">Tag Copied</div>
        </div>
      ) : null}
      <div className="meta">
        <div className="title">
          <div className="tagname">
            <span className="dot" style={dotStyle}></span>
            <span title={tag.name}>{tag.name}</span>
          </div>
          <div className="count">{count?.toLocaleString() ?? "N/A"} items</div>
        </div>
      </div>
    </div>
  );
};
