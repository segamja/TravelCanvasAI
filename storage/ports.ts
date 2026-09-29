import type { TravelAlbum } from "@/types/album";
import type { Photo } from "@/types/photo";
import type { MemoryQuestion, TravelScene } from "@/types/scene";
import type { StoryCard } from "@/types/storyCard";
import type { TravelStory } from "@/types/story";
import type { ProjectStatus, TravelProject } from "@/types/travel";

/**
 * Photo bytes and metadata. The local implementation uses IndexedDB plus
 * localStorage. A later account-backed store can implement the same shape.
 */
export interface PhotoStore {
  savePhotoBlob(id: string, blob: Blob): Promise<void>;
  savePhotoMeta(photo: Photo): Promise<void>;
  getPhotoMeta(id: string): Photo | undefined;
  getPhotosMeta(ids: string[]): Photo[];
  getPhotoObjectUrl(id: string): Promise<string | undefined>;
  getPhotoAnalysisDataUrl(id: string): Promise<string | undefined>;
  deletePhoto(id: string): Promise<void>;
  deletePhotos(ids: string[]): Promise<void>;
}

/**
 * One travel project and its story, card, and album. Photos stay in PhotoStore
 * and are referenced by id. Keys and records stay per project.
 */
export interface ProjectStore {
  listProjects(): TravelProject[];
  getProject(id: string): TravelProject | undefined;
  createProject(input: { title: string; startDate?: string; endDate?: string }): TravelProject;
  updateProject(
    id: string,
    patch: Partial<Omit<TravelProject, "id" | "createdAt">>,
  ): TravelProject;
  setProjectStatus(id: string, status: ProjectStatus): TravelProject;
  saveScenes(id: string, scenes: TravelScene[]): TravelProject;
  saveMemoryQuestions(id: string, memoryQuestions: MemoryQuestion[]): TravelProject;
  saveStory(id: string, story: TravelStory): TravelProject;
  saveStoryCard(id: string, storyCard: StoryCard): TravelProject;
  saveAlbum(id: string, album: TravelAlbum): TravelProject;
  deleteProject(id: string): Promise<void>;
}
