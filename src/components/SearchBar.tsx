import { CircleX, Search } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useRef } from "react";
import { useOutsideClick } from "../hooks/useOutsideClick";
import type { EagleTag } from "../types";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  suggestions: EagleTag[];
  suggestionsOpen: boolean;
  activeIndex: number;
  onSuggestionHover: (index: number) => void;
  onSuggestionSelect: (tagName: string) => void;
  onCloseSuggestions: () => void;
  showCancel: boolean;
  onCancel: () => void;
}

export const SearchBar = ({
  value,
  onChange,
  onKeyDown,
  suggestions,
  suggestionsOpen,
  activeIndex,
  onSuggestionHover,
  onSuggestionSelect,
  onCloseSuggestions,
  showCancel,
  onCancel,
}: SearchBarProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useOutsideClick(
    containerRef,
    () => {
      if (suggestionsOpen) {
        onCloseSuggestions();
      }
    },
    suggestionsOpen,
  );

  return (
    <header>
      <div className="bar autocomplete" ref={containerRef}>
        <div className="icon" aria-hidden="true">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder="Search tags..."
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
        />
        {showCancel ? (
          <button
            type="button"
            className="cancel-button"
            title="Reset filters"
            aria-label="Reset filters"
            onClick={onCancel}
          >
            <CircleX size={16} aria-hidden="true" />
          </button>
        ) : null}
        <div className={`suggestions ${suggestionsOpen ? "show" : ""}`}>
          {suggestions.map((tag, index) => {
            const color = (tag.color || "").trim();
            const style = color
              ? { background: color }
              : { background: "var(--muted)" };
            return (
              <div
                role="button"
                tabIndex={0}
                key={`${tag.name}-${index}`}
                className={`suggestion-item ${index === activeIndex ? "active" : ""}`}
                data-tag={tag.name}
                onMouseEnter={() => onSuggestionHover(index)}
                onClick={() => onSuggestionSelect(tag.name)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSuggestionSelect(tag.name);
                  }
                }}
              >
                <div className="tag-color" style={style}></div>
                <div className="tag-info">
                  <div className="tag-name">{tag.name}</div>
                  <div className="tag-count">
                    {(tag.count || 0).toLocaleString()} items
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
};
