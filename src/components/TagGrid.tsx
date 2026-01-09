import type { EagleTag, Representative } from "../types";
import { TagCard } from "./TagCard";

interface TagGridProps {
  tags: EagleTag[];
  emptyMessage: string | null;
  fetchRepresentative: (tagName: string) => Promise<Representative | null>;
}

export const TagGrid = ({
  tags,
  emptyMessage,
  fetchRepresentative,
}: TagGridProps) => {
  return (
    <div className="grid">
      {emptyMessage ? (
        <div className="empty">{emptyMessage}</div>
      ) : (
        tags.map((tag) => (
          <TagCard
            key={tag.name}
            tag={tag}
            fetchRepresentative={fetchRepresentative}
          />
        ))
      )}
    </div>
  );
};
