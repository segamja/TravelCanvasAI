import { STORY_CARD_THEMES, type StoryCardTheme } from "@/lib/storyCardTheme";
import type { AlbumLayout } from "@/types/album";

/** Photo frame drawn the same way on screen and in the page PNG. Border is canvas pixels at 1080px wide. */
export interface AlbumFrame {
  border: number;
  borderColor: string;
  shadowCss: string;
  canvasShadow: { color: string; blur: number; offsetY: number } | null;
}

export interface AlbumTheme extends StoryCardTheme {
  frame: AlbumFrame;
}

export const ALBUM_THEMES: Record<AlbumLayout, AlbumTheme> = {
  editorial: {
    ...STORY_CARD_THEMES.ink,
    frame: {
      border: 0,
      borderColor: "transparent",
      shadowCss: "0 10px 22px rgba(0,0,0,0.16)",
      canvasShadow: { color: "rgba(0,0,0,0.2)", blur: 22, offsetY: 10 },
    },
  },
  journal: {
    ...STORY_CARD_THEMES.warm,
    frame: {
      border: 10,
      borderColor: "#fff8f0",
      shadowCss: "0 12px 28px rgba(90,50,20,0.28)",
      canvasShadow: { color: "rgba(90,50,20,0.32)", blur: 28, offsetY: 12 },
    },
  },
  cinematic: {
    ...STORY_CARD_THEMES.cool,
    frame: {
      border: 22,
      borderColor: "#ffffff",
      shadowCss: "0 18px 40px rgba(8,20,28,0.42)",
      canvasShadow: { color: "rgba(8,20,28,0.48)", blur: 40, offsetY: 16 },
    },
  },
  minimal: {
    ...STORY_CARD_THEMES.earth,
    frame: {
      border: 4,
      borderColor: "#6a5638",
      shadowCss: "none",
      canvasShadow: null,
    },
  },
};
