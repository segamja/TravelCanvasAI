export interface PhotoAnalysis {
  description: string;
  location?: string;
  tags: string[];
  objects?: string[];
  peopleDetected?: boolean;
  mood?: string;
  importance: number;
  sceneCandidates?: string[];
  confidence?: number;
}

export interface Photo {
  id: string;
  projectId: string;
  fileName: string;
  mimeType: string;
  width?: number;
  height?: number;
  /** ISO datetime. From EXIF when available, otherwise unset (AI must not invent this). */
  capturedAt?: string;
  /** From EXIF GPS when available. */
  latitude?: number;
  longitude?: number;
  analysis?: PhotoAnalysis;
}

/** In-memory representation used while a photo is being uploaded/analyzed, before it is persisted. */
export interface DraftPhoto extends Photo {
  /** Local object URL for preview; revoked once no longer needed. */
  previewUrl: string;
}
