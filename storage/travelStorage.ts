import { getItem, setItem, removeItem } from "./localStorage";
import { deletePhotos } from "./photoStorage";
import { generateId } from "@/lib/utils";
import type { TravelProject, ProjectStatus } from "@/types/travel";
import type { TravelScene, MemoryQuestion } from "@/types/scene";
import type { TravelStory } from "@/types/story";
import type { StoryCard } from "@/types/storyCard";
import type { TravelAlbum } from "@/types/album";
import type { ProjectStore } from "./ports";

const INDEX_KEY = "projects:index";
const projectKey = (id: string) => `project:${id}`;

function getIndex(): string[] {
  return getItem<string[]>(INDEX_KEY) ?? [];
}

function setIndex(ids: string[]): void {
  setItem(INDEX_KEY, ids);
}

export function listProjects(): TravelProject[] {
  return getIndex()
    .map((id) => getItem<TravelProject>(projectKey(id)))
    .filter((p): p is TravelProject => Boolean(p))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getProject(id: string): TravelProject | undefined {
  return getItem<TravelProject>(projectKey(id));
}

function saveProject(project: TravelProject): TravelProject {
  setItem(projectKey(project.id), project);
  return project;
}

export function createProject(input: {
  title: string;
  startDate?: string;
  endDate?: string;
}): TravelProject {
  const now = new Date().toISOString();
  const project: TravelProject = {
    id: generateId("project"),
    title: input.title,
    startDate: input.startDate,
    endDate: input.endDate,
    photoIds: [],
    scenes: [],
    memoryQuestions: [],
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
  saveProject(project);
  setIndex([project.id, ...getIndex()]);
  return project;
}

export function updateProject(
  id: string,
  patch: Partial<Omit<TravelProject, "id" | "createdAt">>,
): TravelProject {
  const existing = getProject(id);
  if (!existing) {
    throw new Error("프로젝트를 찾을 수 없습니다.");
  }
  const updated: TravelProject = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  return saveProject(updated);
}

export function setProjectStatus(id: string, status: ProjectStatus): TravelProject {
  return updateProject(id, { status });
}

export function saveScenes(id: string, scenes: TravelScene[]): TravelProject {
  return updateProject(id, { scenes, status: "scenes-ready" });
}

export function saveMemoryQuestions(id: string, memoryQuestions: MemoryQuestion[]): TravelProject {
  return updateProject(id, {
    memoryQuestions,
    status: memoryQuestions.length > 0 ? "questions-pending" : "scenes-ready",
  });
}

export function saveStory(id: string, story: TravelStory): TravelProject {
  return updateProject(id, { story, status: "completed" });
}

export function saveStoryCard(id: string, storyCard: StoryCard): TravelProject {
  return updateProject(id, { storyCard });
}

export function saveAlbum(id: string, album: TravelAlbum): TravelProject {
  return updateProject(id, { album });
}

export async function deleteProject(id: string): Promise<void> {
  const project = getProject(id);
  if (project) {
    await deletePhotos(project.photoIds);
  }
  removeItem(projectKey(id));
  setIndex(getIndex().filter((existingId) => existingId !== id));
}

/** Local project store. Call sites keep using the functions above. */
export const localProjectStore: ProjectStore = {
  listProjects,
  getProject,
  createProject,
  updateProject,
  setProjectStatus,
  saveScenes,
  saveMemoryQuestions,
  saveStory,
  saveStoryCard,
  saveAlbum,
  deleteProject,
};
