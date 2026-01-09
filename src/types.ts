export type TagFilter = "all" | "starred" | "recent";

export interface EagleTag {
  name: string;
  count?: number;
  color?: string;
}

export interface EagleTagGroup {
  id: string;
  name?: string;
  color?: string;
  tags?: string[];
}

export interface EagleItem {
  id: string;
  thumbnailURL?: string;
  fileURL?: string;
  noThumbnail?: boolean;
}

export interface Representative {
  id: string;
  url: string | null;
}
