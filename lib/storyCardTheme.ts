import type { StoryCardPalette } from "@/types/storyCard";

export interface StoryCardTheme {
  paper: string;
  ink: string;
  muted: string;
  accent: string;
  line: string;
  veil: string;
}

export const STORY_CARD_THEMES: Record<StoryCardPalette, StoryCardTheme> = {
  warm: {
    paper: "#f6efe6",
    ink: "#2a211c",
    muted: "#6b5346",
    accent: "#9f3c16",
    line: "#e6d8c8",
    veil: "rgba(18,12,8,0.78)",
  },
  cool: {
    paper: "#f2f6f7",
    ink: "#1b2428",
    muted: "#4a5d64",
    accent: "#096875",
    line: "#d5e1e4",
    veil: "rgba(8,16,20,0.78)",
  },
  earth: {
    paper: "#f3f0e8",
    ink: "#2a261f",
    muted: "#5c564a",
    accent: "#6a5638",
    line: "#ddd4c4",
    veil: "rgba(22,18,12,0.78)",
  },
  ink: {
    paper: "#faf9f6",
    ink: "#1e1e1e",
    muted: "#5c514c",
    accent: "#9f3c16",
    line: "#e5e3dc",
    veil: "rgba(14,12,10,0.8)",
  },
};
