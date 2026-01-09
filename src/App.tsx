import type { KeyboardEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controls } from "./components/Controls";
import { Pagination } from "./components/Pagination";
import { SearchBar } from "./components/SearchBar";
import { TagGrid } from "./components/TagGrid";
import { eagle } from "./eagle";
import { useDebouncedCallback } from "./hooks/useDebouncedCallback";
import { useLatest } from "./hooks/useLatest";
import type {
  EagleTag,
  EagleTagGroup,
  Representative,
  TagFilter,
} from "./types";
import {
  filterTagsByQuery,
  getTagsFromSelectedGroups,
  sortTagsByCountDesc,
} from "./utils/tags";

const SUGGESTION_LIMIT = 10;

export const App = () => {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [allFilteredTags, setAllFilteredTags] = useState<EagleTag[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(100);
  const [currentFilter, setCurrentFilter] = useState<TagFilter>("all");
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [tagGroups, setTagGroups] = useState<EagleTagGroup[]>([]);
  const [suggestions, setSuggestions] = useState<EagleTag[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null);
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);

  const suggestionsOpen = suggestions.length > 0;

  const queryRef = useLatest(query);
  const filterRef = useLatest(currentFilter);
  const selectedGroupIdsRef = useLatest(selectedGroupIds);
  const tagGroupsRef = useLatest(tagGroups);
  const createdRef = useRef(false);
  const repCacheRef = useRef(new Map<string, Representative>());
  const inflightRef = useRef(new Map<string, Promise<Representative | null>>());
  const refreshIdRef = useRef(0);
  const suggestIdRef = useRef(0);

  const setThemeFromApp = useCallback(() => {
    try {
      const dark = eagle?.app?.isDarkColors?.();
      document.documentElement.dataset.theme = dark ? "dark" : "light";
    } catch {
      // no-op
    }
  }, []);

  const loadTagGroups = useCallback(async () => {
    try {
      const groups = (await eagle?.tagGroup?.get?.()) || [];
      tagGroupsRef.current = groups;
      setTagGroups(groups);
    } catch (error) {
      console.error("Failed to load tag groups", error);
      tagGroupsRef.current = [];
      setTagGroups([]);
    }
  }, [tagGroupsRef]);

  const getBaseTagsByFilter = useCallback(
    async (filter: TagFilter, selectedIds: string[]) => {
      let recents: EagleTag[] = [];
      let starred: EagleTag[] = [];
      let allTags: EagleTag[] = [];

      try {
        recents = (await eagle?.tag?.getRecentTags?.()) || [];
      } catch (error) {
        console.warn("getRecentTags failed:", error);
      }

      try {
        starred = (await eagle?.tag?.getStarredTags?.()) || [];
      } catch (error) {
        if (!eagle?.tag?.getStarredTags) {
          console.warn(
            "getStarredTags() is not supported in this Eagle version.",
          );
        }
        console.warn("getStarredTags failed:", error);
      }

      try {
        allTags = (await eagle?.tag?.get?.()) || [];
      } catch (error) {
        console.warn("tag.get() failed:", error);
      }

      let baseTags: EagleTag[] = [];
      if (filter === "starred") {
        baseTags = starred;
      } else if (filter === "recent") {
        baseTags = recents;
      } else {
        baseTags = allTags || [];
      }

      const groupTags = getTagsFromSelectedGroups(
        selectedIds,
        tagGroupsRef.current,
      );
      if (groupTags) {
        baseTags = baseTags.filter((tag) => groupTags.includes(tag.name));
      }

      return baseTags;
    },
    [tagGroupsRef],
  );

  const refresh = useCallback(
    async (
      queryOverride?: string,
      overrides?: { filter?: TagFilter; selectedGroupIds?: string[] },
    ) => {
      const requestId = ++refreshIdRef.current;
      const currentQuery = (queryOverride ?? queryRef.current).trim();
      const activeFilter = overrides?.filter ?? filterRef.current;
      const activeGroups =
        overrides?.selectedGroupIds ?? selectedGroupIdsRef.current;

      setStatus("Loading tags...");
      setEmptyMessage(null);

      try {
        const baseTags = await getBaseTagsByFilter(activeFilter, activeGroups);
        if (requestId !== refreshIdRef.current) return;

        const filtered = filterTagsByQuery(baseTags, currentQuery);
        const sorted = sortTagsByCountDesc(filtered);

        setAllFilteredTags(sorted);
        setCurrentPage(1);

        const filterName = activeFilter === "all" ? "" : ` (${activeFilter})`;
        if (currentQuery.length > 0) {
          setStatus(
            `Found ${sorted.length} tags for "${currentQuery}"${filterName}`,
          );
        } else {
          setStatus(
            sorted.length
              ? `Showing ${sorted.length} tags${filterName}`
              : "No tags available.",
          );
        }

        if (!sorted.length) {
          const message =
            currentQuery.length > 0
              ? `No matching tags found in ${activeFilter} filter.`
              : "No tags available.";
          setEmptyMessage(message);
        }
      } catch (error) {
        console.error("[refresh] Error:", error);
        setStatus("Search failed");
        setAllFilteredTags([]);
        setEmptyMessage("Failed to fetch tags.");
      }
    },
    [getBaseTagsByFilter, filterRef, queryRef, selectedGroupIdsRef],
  );

  const fetchRepresentative = useCallback(async (tagName: string) => {
    if (repCacheRef.current.has(tagName)) {
      return repCacheRef.current.get(tagName) || null;
    }
    if (inflightRef.current.has(tagName)) {
      return inflightRef.current.get(tagName) || null;
    }

    const promise = (async () => {
      try {
        const items = await eagle?.item?.get?.({
          tags: [tagName],
          fields: ["id", "thumbnailURL", "fileURL", "noThumbnail"],
        });
        const first = items?.[0];
        if (!first) return null;

        const url = first.thumbnailURL || first.fileURL || null;
        const rep = { id: first.id, url };
        repCacheRef.current.set(tagName, rep);
        return rep;
      } finally {
        inflightRef.current.delete(tagName);
      }
    })();

    inflightRef.current.set(tagName, promise);
    return promise;
  }, []);

  const hideSuggestions = useCallback(() => {
    setSuggestions([]);
    setActiveSuggestionIndex(-1);
  }, []);

  const showSuggestions = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      if (!trimmed || trimmed.length < 2) {
        hideSuggestions();
        return;
      }

      const requestId = ++suggestIdRef.current;

      try {
        const baseTags = await getBaseTagsByFilter(
          filterRef.current,
          selectedGroupIdsRef.current,
        );
        if (requestId !== suggestIdRef.current) return;

        const matches = sortTagsByCountDesc(
          filterTagsByQuery(baseTags, trimmed),
        ).slice(0, SUGGESTION_LIMIT);

        if (matches.length === 0) {
          hideSuggestions();
          return;
        }

        setSuggestions(matches);
        setActiveSuggestionIndex(-1);
      } catch (error) {
        console.error("Failed to show suggestions", error);
        hideSuggestions();
      }
    },
    [filterRef, getBaseTagsByFilter, hideSuggestions, selectedGroupIdsRef],
  );

  const runSearch = useDebouncedCallback((value: string) => {
    refresh(value);
  }, 180);

  const runSuggestions = useDebouncedCallback((value: string) => {
    showSuggestions(value);
  }, 150);

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      runSearch(value);
      runSuggestions(value);
    },
    [runSearch, runSuggestions],
  );

  const handleSuggestionSelect = useCallback(
    (tagName: string) => {
      setQuery(tagName);
      hideSuggestions();
      refresh(tagName);
    },
    [hideSuggestions, refresh],
  );

  const handleSuggestionHover = useCallback((index: number) => {
    setActiveSuggestionIndex(index);
  }, []);

  const handleCancel = useCallback(() => {
    setQuery("");
    setCurrentFilter("all");
    setSelectedGroupIds([]);
    setCurrentPage(1);
    setGroupDropdownOpen(false);
    hideSuggestions();
    refresh("", { filter: "all", selectedGroupIds: [] });
  }, [hideSuggestions, refresh]);

  const currentPageTags = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    return allFilteredTags.slice(start, end);
  }, [allFilteredTags, currentPage, perPage]);

  const handleKeyDown = useCallback(
    async (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveSuggestionIndex((prev) =>
          Math.min(prev + 1, suggestions.length - 1),
        );
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveSuggestionIndex((prev) => Math.max(prev - 1, -1));
        return;
      }

      if (event.key === "Escape") {
        hideSuggestions();
        return;
      }

      if (event.key === "Enter") {
        if (
          activeSuggestionIndex >= 0 &&
          activeSuggestionIndex < suggestions.length
        ) {
          handleSuggestionSelect(suggestions[activeSuggestionIndex].name);
          return;
        }

        const first = currentPageTags[0];
        if (!first?.name) return;
        const rep = await fetchRepresentative(first.name);
        if (rep?.id) await eagle?.item?.open?.(rep.id);
      }
    },
    [
      activeSuggestionIndex,
      currentPageTags,
      fetchRepresentative,
      handleSuggestionSelect,
      hideSuggestions,
      suggestions,
    ],
  );

  const handleFilterChange = useCallback(
    (filter: TagFilter) => {
      setCurrentFilter(filter);
      setCurrentPage(1);
      hideSuggestions();
      refresh(queryRef.current, {
        filter,
        selectedGroupIds: selectedGroupIdsRef.current,
      });
    },
    [hideSuggestions, queryRef, refresh, selectedGroupIdsRef],
  );

  const handlePerPageChange = useCallback((value: number) => {
    setPerPage(value);
    setCurrentPage(1);
  }, []);

  const handleGroupToggle = useCallback(
    (groupId: string, checked: boolean) => {
      const next = checked
        ? selectedGroupIds.includes(groupId)
          ? selectedGroupIds
          : [...selectedGroupIds, groupId]
        : selectedGroupIds.filter((id) => id !== groupId);

      setSelectedGroupIds(next);
      refresh(queryRef.current, {
        filter: currentFilter,
        selectedGroupIds: next,
      });
    },
    [currentFilter, queryRef, refresh, selectedGroupIds],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      const totalPages = Math.max(
        1,
        Math.ceil(allFilteredTags.length / perPage),
      );
      const nextPage = Math.min(totalPages, Math.max(1, page));
      setCurrentPage(nextPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [allFilteredTags.length, perPage],
  );

  const toggleGroupDropdown = useCallback(() => {
    setGroupDropdownOpen((prev) => !prev);
  }, []);

  const closeGroupDropdown = useCallback(() => {
    setGroupDropdownOpen(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      createdRef.current = true;
      setThemeFromApp();
      await loadTagGroups();
      await refresh("");
    };

    if (eagle?.onPluginCreate) {
      eagle.onPluginCreate(init);
      eagle.onPluginShow(async () => {
        if (!createdRef.current) return;
        setThemeFromApp();
        await refresh();
      });
      eagle.onThemeChanged?.(() => setThemeFromApp());
    } else {
      init();
    }
  }, [loadTagGroups, refresh, setThemeFromApp]);

  return (
    <>
      <SearchBar
        value={query}
        onChange={handleQueryChange}
        onKeyDown={handleKeyDown}
        suggestions={suggestions}
        suggestionsOpen={suggestionsOpen}
        activeIndex={activeSuggestionIndex}
        onSuggestionHover={handleSuggestionHover}
        onSuggestionSelect={handleSuggestionSelect}
        onCloseSuggestions={hideSuggestions}
        showCancel={query.trim().length > 0}
        onCancel={handleCancel}
      />

      <main>
        <Controls
          currentFilter={currentFilter}
          onFilterChange={handleFilterChange}
          perPage={perPage}
          onPerPageChange={handlePerPageChange}
          tagGroups={tagGroups}
          selectedGroupIds={selectedGroupIds}
          onGroupToggle={handleGroupToggle}
          groupDropdownOpen={groupDropdownOpen}
          onToggleGroupDropdown={toggleGroupDropdown}
          onCloseGroupDropdown={closeGroupDropdown}
        />
        <div className="status">{status}</div>
        <TagGrid
          tags={currentPageTags}
          emptyMessage={emptyMessage}
          fetchRepresentative={fetchRepresentative}
        />
        <Pagination
          total={allFilteredTags.length}
          perPage={perPage}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </main>
    </>
  );
};
