import type { EagleItem, EagleTag, EagleTagGroup } from "./types";

export interface EagleApi {
  app?: {
    isDarkColors?: () => boolean;
  };
  tag: {
    get: () => Promise<EagleTag[]>;
    getRecentTags: () => Promise<EagleTag[]>;
    getStarredTags: () => Promise<EagleTag[]>;
  };
  tagGroup: {
    get: () => Promise<EagleTagGroup[]>;
  };
  item: {
    get: (options: {
      tags: string[];
      fields: string[];
    }) => Promise<EagleItem[]>;
    open: (id: string) => Promise<void>;
  };
  onPluginCreate: (handler: () => void | Promise<void>) => void;
  onPluginShow: (handler: () => void | Promise<void>) => void;
  onThemeChanged?: (handler: () => void) => void;
}

type EagleWindow = Window & { eagle?: EagleApi };

export const eagle = (window as EagleWindow).eagle;
