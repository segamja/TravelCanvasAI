export interface TravelScene {
  id: string;
  projectId: string;
  title: string;
  summary: string;
  photoIds: string[];
  location?: string;
  startTime?: string;
  endTime?: string;
  confidence?: number;
}

export interface MemoryQuestion {
  id: string;
  sceneId: string;
  question: string;
  /** Predefined quick-answer choices. UI always appends a free-text option. */
  options: string[];
  answer?: string;
  isCustomAnswer?: boolean;
  /** True once the user has actively answered (skipped questions still count as unanswered). */
  answeredAt?: string;
}
