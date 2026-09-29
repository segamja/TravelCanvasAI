import { effectiveCapturedAt, toDateInputValue } from "@/lib/photoDates";
import { formatDateRange, generateId } from "@/lib/utils";
import type { Photo } from "@/types/photo";
import type { StoryCard, StoryCardDecision, StoryCardLayout, StoryCardPalette } from "@/types/storyCard";
import { STORY_CARD_LAYOUTS, STORY_CARD_PALETTES } from "@/types/storyCard";
import type { TravelProject } from "@/types/travel";

export interface StoryCardPhotoFact {
  id: string;
  capturedAt?: string;
  location?: string;
  description?: string;
  mood?: string;
  tags: string[];
  importance: number;
}

/** Grounded facts sent to the model. Nothing here is invented. */
export interface StoryCardFacts {
  projectId: string;
  storyTitle: string;
  subtitle?: string;
  chapters: { title: string; body: string; photoIds: string[] }[];
  startDate?: string;
  endDate?: string;
  coverPhotoId?: string;
  knownPlaces: string[];
  photos: StoryCardPhotoFact[];
}

export function collectStoryCardFacts(project: TravelProject, photos: Photo[]): StoryCardFacts {
  const knownPlaces = uniqueStrings([
    ...project.scenes.map((scene) => scene.location),
    ...photos.map((photo) => photo.analysis?.location),
  ]);
  const captured = photos
    .map((photo) => effectiveCapturedAt(photo))
    .filter((value): value is string => Boolean(value))
    .sort();

  return {
    projectId: project.id,
    storyTitle: project.story?.title || project.title,
    subtitle: project.story?.subtitle,
    chapters: (project.story?.chapters ?? []).map((chapter) => ({
      title: chapter.title,
      body: chapter.body,
      photoIds: chapter.photoIds,
    })),
    startDate: project.startDate || (captured[0] ? toDateInputValue(captured[0]) : undefined),
    endDate:
      project.endDate ||
      (captured.length > 0 ? toDateInputValue(captured[captured.length - 1]) : undefined),
    coverPhotoId: project.coverPhotoId,
    knownPlaces,
    photos: photos.map((photo) => ({
      id: photo.id,
      capturedAt: effectiveCapturedAt(photo),
      location: photo.analysis?.location,
      description: photo.analysis?.description,
      mood: photo.analysis?.mood,
      tags: photo.analysis?.tags ?? [],
      importance: photo.analysis?.importance ?? 0,
    })),
  };
}

export function finalizeStoryCard(
  decision: Partial<StoryCardDecision> | null | undefined,
  facts: StoryCardFacts,
): StoryCard {
  const local = buildLocalDecision(facts);
  const heroPhotoId = facts.photos.some((photo) => photo.id === decision?.heroPhotoId)
    ? (decision?.heroPhotoId as string)
    : local.heroPhotoId;
  const sourceText = storySourceText(facts);
  const story = limitSentences(decision?.story?.trim() || "", 4, 360) || local.story;
  const keyMoment = limitSentences(decision?.keyMoment?.trim() || "", 1, 90) || local.keyMoment;

  return {
    id: generateId("card"),
    projectId: facts.projectId,
    title: facts.storyTitle,
    heroPhotoId,
    story: story || firstSentences(sourceText, 3, 360),
    dateLabel: formatDateRange(facts.startDate, facts.endDate),
    placeLabel: resolvePlace(decision?.place, facts),
    capturedAtLabel: formatCapturedTime(
      facts.photos.find((photo) => photo.id === heroPhotoId)?.capturedAt,
    ),
    keyMoment: keyMoment || local.keyMoment,
    keywords: resolveKeywords(decision?.keywords, facts, heroPhotoId),
    mood: (decision?.mood?.trim() || local.mood).slice(0, 24),
    layout: isLayout(decision?.layout) ? decision.layout : local.layout,
    palette: isPalette(decision?.palette) ? decision.palette : local.palette,
    createdAt: new Date().toISOString(),
  };
}

export function buildLocalDecision(facts: StoryCardFacts): StoryCardDecision {
  const heroPhotoId = pickHero(facts);
  const hero = facts.photos.find((photo) => photo.id === heroPhotoId);
  const chapter =
    facts.chapters.find((item) => item.photoIds.includes(heroPhotoId)) ?? facts.chapters[0];
  const source = storySourceText(facts);
  const mood = hero?.mood || mostCommon(facts.photos.map((photo) => photo.mood)) || "";
  const tags = facts.photos.flatMap((photo) => photo.tags);

  return {
    heroPhotoId,
    story: firstSentences(source, 3, 360),
    place: facts.knownPlaces[0],
    keyMoment: limitSentences(chapter?.body || chapter?.title || source, 1, 90),
    keywords: uniqueStrings(hero?.tags ?? tags).slice(0, 3),
    mood,
    layout: inferLayout(mood, tags),
    palette: inferPalette(mood, tags),
  };
}

function storySourceText(facts: StoryCardFacts): string {
  return [facts.subtitle, ...facts.chapters.flatMap((chapter) => [chapter.title, chapter.body])]
    .filter(Boolean)
    .join(" ");
}

function pickHero(facts: StoryCardFacts): string {
  const ranked = [...facts.photos].sort((a, b) => b.importance - a.importance);
  if (ranked[0] && ranked[0].importance > 0) return ranked[0].id;
  if (facts.coverPhotoId && facts.photos.some((photo) => photo.id === facts.coverPhotoId)) {
    return facts.coverPhotoId;
  }
  return facts.photos[0]?.id ?? "";
}

function resolvePlace(place: string | undefined, facts: StoryCardFacts): string {
  const wanted = place?.trim();
  if (!wanted) return facts.knownPlaces[0] ?? "";
  const match = facts.knownPlaces.find((known) => known.toLowerCase() === wanted.toLowerCase());
  return match ?? facts.knownPlaces[0] ?? "";
}

function resolveKeywords(
  raw: string[] | undefined,
  facts: StoryCardFacts,
  heroPhotoId: string,
): string[] {
  const corpus = [
    facts.storyTitle,
    ...facts.chapters.flatMap((chapter) => [chapter.title, chapter.body]),
    ...facts.photos.flatMap((photo) => photo.tags),
  ]
    .join(" ")
    .toLowerCase();
  const heroTags = facts.photos.find((photo) => photo.id === heroPhotoId)?.tags ?? [];
  const candidates = (raw?.length ? raw : heroTags).map((keyword) => keyword.trim()).filter(Boolean);
  const accepted = uniqueStrings(
    candidates.filter((keyword) => keyword.length <= 16 && corpus.includes(keyword.toLowerCase())),
  ).slice(0, 3);
  if (accepted.length > 0) return accepted;
  return uniqueStrings(heroTags.filter((tag) => tag.length <= 16)).slice(0, 3);
}

function inferLayout(mood: string, tags: string[]): StoryCardLayout {
  const blob = `${mood} ${tags.join(" ")}`;
  if (/밤|야경|네온|도시|night|city/i.test(blob)) return "cinematic";
  if (/고요|여백|바다|눈|sky|sea|quiet/i.test(blob)) return "minimal";
  if (/카페|골목|시장|일기|cafe|street/i.test(blob)) return "journal";
  return "editorial";
}

function inferPalette(mood: string, tags: string[]): StoryCardPalette {
  const blob = `${mood} ${tags.join(" ")}`;
  if (/바다|눈|밤|도시|비|sky|sea|blue|night/i.test(blob)) return "cool";
  if (/숲|산|자연|길|forest|mountain|green/i.test(blob)) return "earth";
  if (/노을|따뜻|음식|골목|sunset|warm|cafe|food/i.test(blob)) return "warm";
  return "ink";
}

function firstSentences(text: string, count: number, maxChars: number): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  const parts = normalized.split(/(?<=[.!?。])\s+/).filter(Boolean);
  let out = "";
  for (const part of (parts.length > 0 ? parts : [normalized]).slice(0, count)) {
    const next = out ? `${out} ${part}` : part;
    if (next.length > maxChars) break;
    out = next;
  }
  if (out) return out;
  return normalized.slice(0, maxChars).trim();
}

function limitSentences(text: string, count: number, maxChars: number): string {
  return firstSentences(text, count, maxChars);
}

function formatCapturedTime(iso?: string): string | undefined {
  if (!iso) return undefined;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  const hours = date.getHours();
  const minutes = date.getMinutes();
  if (hours === 0 && minutes === 0) return undefined;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function uniqueStrings(values: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value?.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

function mostCommon(values: Array<string | undefined>): string {
  const counts = new Map<string, number>();
  for (const value of values) {
    const trimmed = value?.trim();
    if (!trimmed) continue;
    counts.set(trimmed, (counts.get(trimmed) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}

function isLayout(value: unknown): value is StoryCardLayout {
  return typeof value === "string" && (STORY_CARD_LAYOUTS as readonly string[]).includes(value);
}

function isPalette(value: unknown): value is StoryCardPalette {
  return typeof value === "string" && (STORY_CARD_PALETTES as readonly string[]).includes(value);
}
