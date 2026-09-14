import type { TravelScene, MemoryQuestion } from "./scene";
import type { TravelStory } from "./story";

/**
 * Tracks how far a project has progressed through the pipeline so that
 * `/travel/[id]` can resume at the right step after a reload.
 */
export type ProjectStatus =
  | "draft"
  | "photos-uploaded"
  | "analyzing"
  | "scenes-ready"
  | "questions-pending"
  | "generating-story"
  | "completed";

export interface TravelProject {
  id: string;
  title: string;
  startDate?: string;
  endDate?: string;
  coverPhotoId?: string;
  photoIds: string[];
  scenes: TravelScene[];
  memoryQuestions: MemoryQuestion[];
  story?: TravelStory;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}
