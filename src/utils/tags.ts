import type { EagleTag, EagleTagGroup } from "../types";

export const filterTagsByQuery = (tags: EagleTag[], query: string) => {
  const trimmed = query.trim();
  if (!trimmed) return tags;
  const lower = trimmed.toLowerCase();
  return tags.filter((tag) => (tag.name || "").toLowerCase().includes(lower));
};

export const sortTagsByCountDesc = (tags: EagleTag[]) =>
  [...tags].sort((a, b) => (b.count || 0) - (a.count || 0));

export const getTagsFromSelectedGroups = (
  selectedIds: string[],
  groups: EagleTagGroup[],
) => {
  if (selectedIds.length === 0) return null;

  const tagSet = new Set<string>();
  selectedIds.forEach((groupId) => {
    const group = groups.find((item) => item.id === groupId);
    if (!group?.tags) return;
    for (const tag of group.tags) {
      tagSet.add(tag);
    }
  });

  return Array.from(tagSet);
};
