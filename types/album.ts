export const ALBUM_LAYOUTS = ["editorial", "journal", "cinematic", "minimal"] as const;
export type AlbumLayout = (typeof ALBUM_LAYOUTS)[number];

export const ALBUM_DENSITIES = ["photo", "story"] as const;
export type AlbumDensity = (typeof ALBUM_DENSITIES)[number];

export type AlbumPageKind = "cover" | "day" | "closing";

export interface AlbumPage {
  id: string;
  kind: AlbumPageKind;
  /** Calendar day label such as 2025.02.03. Cover and closing pages omit this. */
  dateLabel?: string;
  title: string;
  body: string;
  photoIds: string[];
  /** Known scene location only. Empty when none exists. */
  placeLabel: string;
  /** Search words drawn from a known place, tag, or mood. Never shown as a fact. */
  backgroundQuery: string;
}

export interface TravelAlbum {
  id: string;
  projectId: string;
  title: string;
  density: AlbumDensity;
  layout: AlbumLayout;
  /** Day labels included when the album was built. Empty means every day. */
  dayLabels: string[];
  pages: AlbumPage[];
  createdAt: string;
}

export interface AlbumFormValues {
  title: string;
  dayLabels: string[];
  density: AlbumDensity;
  layout: AlbumLayout;
}
