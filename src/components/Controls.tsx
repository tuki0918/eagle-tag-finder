import { useMemo, useRef } from "react";
import { useOutsideClick } from "../hooks/useOutsideClick";
import type { EagleTagGroup, TagFilter } from "../types";

const FILTERS: { label: string; value: TagFilter }[] = [
  { label: "All", value: "all" },
  { label: "Starred", value: "starred" },
  { label: "Recent", value: "recent" },
];

const PER_PAGE_OPTIONS = [100, 200, 300, 400, 500];

interface ControlsProps {
  currentFilter: TagFilter;
  onFilterChange: (filter: TagFilter) => void;
  perPage: number;
  onPerPageChange: (perPage: number) => void;
  tagGroups: EagleTagGroup[];
  selectedGroupIds: string[];
  onGroupToggle: (groupId: string, checked: boolean) => void;
  groupDropdownOpen: boolean;
  onToggleGroupDropdown: () => void;
  onCloseGroupDropdown: () => void;
}

export const Controls = ({
  currentFilter,
  onFilterChange,
  perPage,
  onPerPageChange,
  tagGroups,
  selectedGroupIds,
  onGroupToggle,
  groupDropdownOpen,
  onToggleGroupDropdown,
  onCloseGroupDropdown,
}: ControlsProps) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const selectedCount = selectedGroupIds.length;
  const groupLabel = useMemo(() => {
    if (selectedCount === 0) return "Select groups...";
    return `${selectedCount} group${selectedCount > 1 ? "s" : ""} selected`;
  }, [selectedCount]);

  useOutsideClick(
    wrapperRef,
    () => {
      if (groupDropdownOpen) {
        onCloseGroupDropdown();
      }
    },
    groupDropdownOpen,
  );

  return (
    <div className="controls">
      <div className="per-page">
        <span>Filter:</span>
        {FILTERS.map((filter) => (
          <button
            type="button"
            key={filter.value}
            data-filter={filter.value}
            className={filter.value === currentFilter ? "active" : ""}
            onClick={() => onFilterChange(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="group-filter" ref={wrapperRef}>
        <span>Tag Groups:</span>
        <div className="group-select-wrapper">
          <div
            role="button"
            tabIndex={0}
            className={`group-select-trigger ${selectedCount > 0 ? "active" : ""} ${
              groupDropdownOpen ? "open" : ""
            }`}
            onClick={onToggleGroupDropdown}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onToggleGroupDropdown();
              }
            }}
          >
            <span>{groupLabel}</span>
            {selectedCount > 0 ? (
              <span className="count">{selectedCount}</span>
            ) : null}
            <span className="arrow">▼</span>
          </div>
          <div className={`group-dropdown ${groupDropdownOpen ? "show" : ""}`}>
            {tagGroups.length === 0 ? (
              <div
                className="group-option"
                style={{ pointerEvents: "none", opacity: 0.5 }}
              >
                No tag groups available
              </div>
            ) : (
              tagGroups.map((group) => {
                const isChecked = selectedGroupIds.includes(group.id);
                const color = group.color || "gray";
                const tagCount = (group.tags || []).length;
                return (
                  <label className="group-option" key={group.id}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(event) =>
                        onGroupToggle(group.id, event.target.checked)
                      }
                    />
                    <div
                      className="group-color"
                      style={{ background: color }}
                    ></div>
                    <div className="group-info">
                      <div className="group-name">
                        {group.name || "Untitled"}
                      </div>
                    </div>
                    <span style={{ fontSize: 10, color: "var(--muted)" }}>
                      {tagCount} tags
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="per-page">
        <span>Per page:</span>
        {PER_PAGE_OPTIONS.map((option) => (
          <button
            type="button"
            key={option}
            data-per-page={option}
            className={option === perPage ? "active" : ""}
            onClick={() => onPerPageChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};
