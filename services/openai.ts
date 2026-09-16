import OpenAI from "openai";

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const PHOTO_BATCH_SIZE = 8;

let client: OpenAI | null = null;

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY가 설정되어 있지 않습니다.");
  }
  if (!client) {
    client = new OpenAI({ apiKey });
  }
  return client;
}

/** Retries on OpenAI 429s, honoring the API's retry-after hint instead of failing the whole analysis. */
async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 5): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isRateLimited = error instanceof OpenAI.APIError && error.status === 429;
      if (!isRateLimited || attempt >= maxAttempts) throw error;
      const retryAfterMs = Number(error.headers?.get("retry-after-ms"));
      const retryAfterSec = Number(error.headers?.get("retry-after"));
      const waitMs = Number.isFinite(retryAfterMs) && retryAfterMs > 0
        ? retryAfterMs
        : Number.isFinite(retryAfterSec) && retryAfterSec > 0
          ? retryAfterSec * 1000
          : 1000 * attempt;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
}

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

function parseJsonObject<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error("JSON 파싱에 실패했습니다.");
  }
}

// ---------------------------------------------------------------------------
// Step 1: Photo Analysis (Vision + Structured Output)
// ---------------------------------------------------------------------------

export interface AnalyzePhotoInput {
  id: string;
  dataUrl: string;
  /** Real EXIF facts, if any — told to the model as known facts, not left for it to guess. */
  knownCapturedAt?: string;
  knownLocationHint?: string;
}

export interface RawPhotoAnalysis {
  photoId: string;
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

const PHOTO_ANALYSIS_SYSTEM_PROMPT = `당신은 여행 사진을 분석하는 어시스턴트입니다.
반드시 다음 원칙을 따르세요.
- 사진에서 실제로 관찰 가능한 정보만 사용합니다. 추측이 필요한 정보는 낮은 confidence로 표시하세요.
- 촬영 시간이나 GPS 위치가 별도로 주어진 경우 그 값을 사실로 취급하고, 주어지지 않았다면 사진만으로 시간/좌표를 확정하지 마세요(장소의 이름은 시각적으로 추정 가능하면 location에 적되 confidence를 낮추세요).
- 반드시 아래 JSON 스키마를 그대로 따르는 JSON 객체만 출력합니다.

{
  "photos": [
    {
      "photoId": "string",
      "description": "string (한국어, 1~2문장)",
      "location": "string | null",
      "tags": ["string"],
      "objects": ["string"],
      "peopleDetected": boolean,
      "mood": "string",
      "importance": number (0~1, 여행 이야기에서 이 사진이 얼마나 중요한지),
      "sceneCandidates": ["string"],
      "confidence": number (0~1, location/시간 추정의 확신도)
    }
  ]
}`;

export async function analyzePhotos(
  photos: AnalyzePhotoInput[],
): Promise<Map<string, RawPhotoAnalysis>> {
  const openai = getClient();
  const results = new Map<string, RawPhotoAnalysis>();

  for (const batch of chunk(photos, PHOTO_BATCH_SIZE)) {
    const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];
    content.push({
      type: "text",
      text: `다음 ${batch.length}장의 사진을 분석하세요. 각 사진 앞에 photoId가 표시됩니다.`,
    });
    for (const photo of batch) {
      const knownFacts: string[] = [];
      if (photo.knownCapturedAt) knownFacts.push(`촬영시각(EXIF 확인됨): ${photo.knownCapturedAt}`);
      if (photo.knownLocationHint) knownFacts.push(`GPS 좌표(EXIF 확인됨): ${photo.knownLocationHint}`);
      content.push({
        type: "text",
        text: `photoId: ${photo.id}${knownFacts.length ? "\n" + knownFacts.join("\n") : ""}`,
      });
      content.push({ type: "image_url", image_url: { url: photo.dataUrl, detail: "low" } });
    }

    const completion = await withRetry(() =>
      openai.chat.completions.create({
        model: MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: PHOTO_ANALYSIS_SYSTEM_PROMPT },
          { role: "user", content },
        ],
      }),
    );

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("AI로부터 응답을 받지 못했습니다.");
    const parsed = parseJsonObject<{ photos: RawPhotoAnalysis[] }>(raw);
    for (const item of parsed.photos ?? []) {
      results.set(item.photoId, item);
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Step 2: Scene Generation + Memory Question candidates
// ---------------------------------------------------------------------------

export interface SceneGenerationPhotoInput {
  id: string;
  capturedAt?: string;
  location?: string;
  description: string;
  tags: string[];
  mood?: string;
  importance: number;
  sceneCandidates?: string[];
}

export interface RawTravelScene {
  title: string;
  summary: string;
  photoIds: string[];
  location?: string;
  startTime?: string;
  endTime?: string;
  confidence?: number;
}

export interface RawMemoryQuestion {
  sceneIndex: number;
  question: string;
  options: string[];
}

const SCENE_SYSTEM_PROMPT = `당신은 여행 사진들을 의미 있는 장면(Scene)으로 재구성하는 어시스턴트입니다.
원칙:
- 시간 순서를 우선하고, 장소 연속성과 동일 활동/사건을 기준으로 사진을 묶습니다.
- 중복되는 사진을 굳이 여러 Scene에 나누지 말고, 장면의 의미가 드러나는 제목을 붙입니다.
- 모든 photoId는 정확히 하나의 Scene에만 포함되어야 하며, 입력된 모든 photoId를 빠짐없이 사용해야 합니다.
- Scene 중 개인적인 의미가 불확실하거나(예: 사진이 여러 장 몰려 있는데 이유를 알 수 없음) importance가 높은 장면에 한해 사용자에게 물어볼 기억 질문을 최대 2개까지 제안하세요. 꼭 필요하지 않으면 질문을 만들지 마세요.
- 질문에는 사용자가 고를 수 있는 4~5개의 객관식 선택지를 함께 제안하세요("직접 입력"은 시스템이 자동으로 추가하니 포함하지 마세요).
- 반드시 아래 JSON 스키마를 그대로 따르는 JSON 객체만 출력합니다.

{
  "scenes": [
    {
      "title": "string",
      "summary": "string (한국어, 1~2문장)",
      "photoIds": ["string"],
      "location": "string | null",
      "startTime": "string | null (ISO datetime, 알 수 없으면 null)",
      "endTime": "string | null",
      "confidence": number (0~1)
    }
  ],
  "memoryQuestions": [
    { "sceneIndex": number (scenes 배열의 0-based index), "question": "string", "options": ["string"] }
  ]
}`;

export async function generateScenes(
  photos: SceneGenerationPhotoInput[],
): Promise<{ scenes: RawTravelScene[]; memoryQuestions: RawMemoryQuestion[] }> {
  const openai = getClient();
  const completion = await withRetry(() =>
    openai.chat.completions.create({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SCENE_SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify({ photos }) },
      ],
    }),
  );

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("AI로부터 응답을 받지 못했습니다.");
  return parseJsonObject<{ scenes: RawTravelScene[]; memoryQuestions: RawMemoryQuestion[] }>(raw);
}

// ---------------------------------------------------------------------------
// Step 3: Story Generation (Text Generation)
// ---------------------------------------------------------------------------

export interface StoryGenerationSceneInput {
  title: string;
  summary: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  photoIds: string[];
  photoDescriptions: string[];
  memoryAnswers: { question: string; answer: string; isCustomAnswer?: boolean }[];
}

export interface RawStoryChapter {
  title: string;
  photoIds: string[];
  body: string;
}

export interface RawTravelStory {
  title: string;
  subtitle?: string;
  chapters: RawStoryChapter[];
}

const STORY_SYSTEM_PROMPT = `당신은 여행 사진과 장면(Scene) 정보를 바탕으로 감성적이지만 담백한 여행 이야기를 쓰는 작가입니다.
원칙:
- 사진에서 확인 가능한 사실과 사용자가 직접 답한 기억 질문 답변을 우선하여 사실처럼 서술합니다.
- 사용자 답변이 없는 부분에 대한 AI의 추측은 단정적으로 쓰지 말고("~했을 것이다", "~인 듯하다" 같은 절제된 표현), 실제로 확인되지 않은 사건을 지어내지 않습니다.
- 과도하게 문학적이거나 과장된 감정 표현은 피하고, 사진 설명의 나열이 아니라 하나의 흐름(시작 → 전개 → 특별한 순간 → 마무리)을 만듭니다.
- 각 Scene은 하나의 Chapter가 됩니다. Chapter의 photoIds는 해당 Scene의 photoIds를 그대로 사용하세요.
- 반드시 아래 JSON 스키마를 그대로 따르는 JSON 객체만 출력합니다.

{
  "title": "string (전체 여행 제목, 감성적이지만 과장되지 않게)",
  "subtitle": "string | null",
  "chapters": [
    { "title": "string (Chapter 제목)", "photoIds": ["string"], "body": "string (한국어, 3~6문장)" }
  ]
}`;

export async function generateStory(input: {
  projectTitle: string;
  startDate?: string;
  endDate?: string;
  scenes: StoryGenerationSceneInput[];
}): Promise<RawTravelStory> {
  const openai = getClient();
  const completion = await withRetry(() =>
    openai.chat.completions.create({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: STORY_SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(input) },
      ],
    }),
  );

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("AI로부터 응답을 받지 못했습니다.");
  return parseJsonObject<RawTravelStory>(raw);
}

// ---------------------------------------------------------------------------
// AI title suggestion (spec §7 "AI 제목 추천")
// ---------------------------------------------------------------------------

export async function suggestTravelTitles(input: {
  locations: string[];
  moods: string[];
  startDate?: string;
  endDate?: string;
}): Promise<string[]> {
  const openai = getClient();
  const completion = await withRetry(() =>
    openai.chat.completions.create({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            '여행 사진 분석 결과를 참고해 감성적인 여행 제목 후보 3개를 한국어로 제안하세요. 과장되지 않게, 짧고 담백하게. JSON: {"titles": ["string","string","string"]}',
        },
        { role: "user", content: JSON.stringify(input) },
      ],
    }),
  );
  const raw = completion.choices[0]?.message?.content;
  if (!raw) return [];
  try {
    return parseJsonObject<{ titles: string[] }>(raw).titles ?? [];
  } catch {
    return [];
  }
}
