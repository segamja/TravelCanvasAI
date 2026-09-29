import { groupPhotoIdsByDay, type PhotoDayGroup } from "@/lib/photoDates";
import { generateId } from "@/lib/utils";
import type { AlbumFormValues, AlbumPage, TravelAlbum } from "@/types/album";
import type { Photo } from "@/types/photo";
import type { TravelProject } from "@/types/travel";

const PHOTOS_PER_PAGE = { photo: 4, story: 2 } as const;

export function listAlbumDays(project: TravelProject): PhotoDayGroup[] {
  return groupPhotoIdsByDay(project.photoIds);
}

export function buildTravelAlbum(
  project: TravelProject,
  photos: Photo[],
  values: AlbumFormValues,
): TravelAlbum {
  const photoById = new Map(photos.map((photo) => [photo.id, photo]));
  const days = listAlbumDays(project).filter((day) =>
    values.dayLabels.length === 0 ? true : values.dayLabels.includes(day.label),
  );
  const perPage = PHOTOS_PER_PAGE[values.density];
  const coverPhotoId = pickCover(project, days);
  const pages: AlbumPage[] = [
    {
      id: generateId("page"),
      kind: "cover",
      title: values.title.trim() || project.story?.title || project.title,
      body: project.story?.subtitle?.trim() || "",
      photoIds: coverPhotoId ? [coverPhotoId] : [],
      placeLabel: firstPlace(project, days.flatMap((day) => day.ids)),
      backgroundQuery: backgroundQuery(
        firstPlace(project, days.flatMap((day) => day.ids)),
        days.flatMap((day) => day.ids).map((id) => photoById.get(id)),
      ),
    },
  ];

  for (const day of days) {
    const chunks = chunk(day.ids, perPage);
    chunks.forEach((ids, index) => {
      const place = firstPlace(project, ids);
      pages.push({
        id: generateId("page"),
        kind: "day",
        dateLabel: day.label,
        title: day.label,
        body:
          index === 0
            ? storyForPhotos(project, ids, values.density === "story" ? 2 : 1)
            : "",
        photoIds: ids,
        placeLabel: place,
        backgroundQuery: backgroundQuery(
          place,
          ids.map((id) => photoById.get(id)),
        ),
      });
    });
  }

  pages.push({
    id: generateId("page"),
    kind: "closing",
    title: values.title.trim() || project.story?.title || project.title,
    body: closingLine(project),
    photoIds: coverPhotoId ? [coverPhotoId] : [],
    placeLabel: "",
    backgroundQuery: pages[0]?.backgroundQuery || "travel scenery",
  });

  return {
    id: generateId("album"),
    projectId: project.id,
    title: values.title.trim() || project.story?.title || project.title,
    density: values.density,
    layout: values.layout,
    dayLabels: days.map((day) => day.label),
    pages,
    createdAt: new Date().toISOString(),
  };
}

function pickCover(project: TravelProject, days: PhotoDayGroup[]): string {
  const all = days.flatMap((day) => day.ids);
  if (project.coverPhotoId && all.includes(project.coverPhotoId)) return project.coverPhotoId;
  return all[0] ?? "";
}

function firstPlace(project: TravelProject, photoIds: string[]): string {
  const wanted = new Set(photoIds);
  const scene = project.scenes.find(
    (item) => item.location && item.photoIds.some((id) => wanted.has(id)),
  );
  return scene?.location?.trim() ?? "";
}

function storyForPhotos(project: TravelProject, photoIds: string[], sentenceCount: number): string {
  const wanted = new Set(photoIds);
  const bodies = (project.story?.chapters ?? [])
    .filter((chapter) => chapter.photoIds.some((id) => wanted.has(id)))
    .map((chapter) => chapter.body.trim())
    .filter(Boolean);
  return takeSentences(bodies.join(" "), sentenceCount, sentenceCount === 1 ? 90 : 180);
}

function closingLine(project: TravelProject): string {
  const chapters = project.story?.chapters ?? [];
  const last = [...chapters].reverse().find((chapter) => chapter.body.trim());
  return takeSentences(last?.body || project.story?.subtitle || "", 1, 90);
}

function backgroundQuery(place: string, photos: Array<Photo | undefined>): string {
  if (place && place.length <= 40) return `${place} travel`;
  const tag = photos
    .flatMap((photo) => photo?.analysis?.tags ?? [])
    .map((item) => item.trim())
    .find((item) => item.length > 0 && item.length <= 16);
  if (tag) return `${tag} travel`;
  const mood = photos
    .map((photo) => photo?.analysis?.mood?.trim())
    .find((item) => item && item.length <= 16);
  if (mood) return `${mood} travel scenery`;
  return "travel scenery";
}

function takeSentences(text: string, count: number, maxChars: number): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  const parts = normalized.split(/(?<=[.!?。])\s+/).filter(Boolean);
  let out = "";
  for (const part of (parts.length > 0 ? parts : [normalized]).slice(0, count)) {
    const next = out ? `${out} ${part}` : part;
    if (next.length > maxChars) break;
    out = next;
  }
  return out || normalized.slice(0, maxChars).trim();
}

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}
