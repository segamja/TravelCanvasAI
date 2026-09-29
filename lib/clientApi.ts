import { ANALYZE_REQUEST_MAX_BYTES } from "@/lib/constants";
import type { PhotoAnalysis } from "@/types/photo";
import type {
  AnalyzePhotoInput,
  RawMemoryQuestion,
  RawTravelScene,
  RawTravelStory,
  SceneGenerationPhotoInput,
  StoryGenerationSceneInput,
} from "@/services/openai";

async function postJson<T>(path: string, body: unknown, fallbackError: string): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let json: (T & { error?: string }) | undefined;
  try {
    json = (await response.json()) as T & { error?: string };
  } catch {
    json = undefined;
  }
  if (!response.ok) throw new Error(json?.error ?? fallbackError);
  if (!json) throw new Error(fallbackError);
  return json;
}

/** Keeps each /api/analyze body under the platform limit. One huge photo still goes alone. */
function analysisRequestBatches(photos: AnalyzePhotoInput[]): AnalyzePhotoInput[][] {
  const batches: AnalyzePhotoInput[][] = [];
  let batch: AnalyzePhotoInput[] = [];
  let bytes = 0;

  for (const photo of photos) {
    const size = photo.dataUrl.length + photo.id.length + 160;
    if (batch.length > 0 && bytes + size > ANALYZE_REQUEST_MAX_BYTES) {
      batches.push(batch);
      batch = [];
      bytes = 0;
    }
    batch.push(photo);
    bytes += size;
  }

  if (batch.length > 0) batches.push(batch);
  return batches;
}

/** Sends already-resized analysis JPEGs in several requests. The server still calls OpenAI 8 at a time. */
export async function requestPhotoAnalysis(
  photos: AnalyzePhotoInput[],
  onProgress?: (done: number, total: number, pending: number) => void,
): Promise<Record<string, PhotoAnalysis>> {
  const analyses: Record<string, PhotoAnalysis> = {};
  const total = photos.length;
  let done = 0;
  for (const batch of analysisRequestBatches(photos)) {
    onProgress?.(done, total, batch.length);
    const json = await postJson<{ analyses?: Record<string, PhotoAnalysis> }>(
      "/api/analyze",
      { photos: batch },
      "사진 분석에 실패했습니다.",
    );
    Object.assign(analyses, json.analyses ?? {});
    done += batch.length;
    onProgress?.(done, total, 0);
  }
  return analyses;
}

/** Scene grouping from stored analysis text. Does not send photo files. */
export async function requestScenes(photos: SceneGenerationPhotoInput[]): Promise<{
  scenes: RawTravelScene[];
  memoryQuestions: RawMemoryQuestion[];
}> {
  const json = await postJson<{
    scenes?: RawTravelScene[];
    memoryQuestions?: RawMemoryQuestion[];
  }>("/api/scenes", { photos }, "장면 구성에 실패했습니다.");
  return {
    scenes: json.scenes ?? [],
    memoryQuestions: json.memoryQuestions ?? [],
  };
}

/** Story text from scenes, descriptions, and memory answers. Does not send photo files. */
export async function requestStory(input: {
  projectTitle: string;
  startDate?: string;
  endDate?: string;
  scenes: StoryGenerationSceneInput[];
}): Promise<RawTravelStory> {
  const json = await postJson<{ story: RawTravelStory }>(
    "/api/generate-story",
    input,
    "이야기 생성에 실패했습니다.",
  );
  return json.story;
}

/** Optional title ideas from places and moods already on the trip. */
export async function requestTitleSuggestions(input: {
  locations: string[];
  moods: string[];
  startDate?: string;
  endDate?: string;
}): Promise<string[]> {
  const json = await postJson<{ titles?: string[] }>(
    "/api/suggest-title",
    input,
    "제목 추천에 실패했습니다.",
  );
  return json.titles ?? [];
}
