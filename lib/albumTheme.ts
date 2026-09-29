import { STORY_CARD_THEMES, type StoryCardTheme } from "@/lib/storyCardTheme";
import type { AlbumLayout } from "@/types/album";

export const ALBUM_THEMES: Record<AlbumLayout, StoryCardTheme> = {
  editorial: STORY_CARD_THEMES.ink,
  journal: STORY_CARD_THEMES.warm,
  cinematic: STORY_CARD_THEMES.cool,
  minimal: STORY_CARD_THEMES.earth,
};
