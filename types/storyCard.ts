export const STORY_CARD_LAYOUTS = ["editorial", "cinematic", "journal", "minimal"] as const;
export type StoryCardLayout = (typeof STORY_CARD_LAYOUTS)[number];

export const STORY_CARD_PALETTES = ["warm", "cool", "earth", "ink"] as const;
export type StoryCardPalette = (typeof STORY_CARD_PALETTES)[number];

/** A single finished travel story card. Facts such as dates and places are filled on the client from known data. */
export interface StoryCard {
  id: string;
  projectId: string;
  title: string;
  heroPhotoId: string;
  /** Two to four sentences distilled from the travel story. */
  story: string;
  /** From the project date range only. Empty when the trip has no dates. */
  dateLabel: string;
  /** From scene or photo locations already on the trip. Empty when none are known. */
  placeLabel: string;
  /** Clock time from the hero photo EXIF, when present. */
  capturedAtLabel?: string;
  keyMoment: string;
  keywords: string[];
  mood: string;
  layout: StoryCardLayout;
  palette: StoryCardPalette;
  createdAt: string;
}

/** What the model is allowed to decide. The client discards anything that is not grounded. */
export interface StoryCardDecision {
  heroPhotoId: string;
  story: string;
  place?: string;
  keyMoment: string;
  keywords: string[];
  mood: string;
  layout: StoryCardLayout;
  palette: StoryCardPalette;
}
