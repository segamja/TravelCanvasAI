export const MAX_PHOTOS_PER_PROJECT = 50;

export const SUPPORTED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

export const MAX_ORIGINAL_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB per photo before resize

/** Longest edge sent to OpenAI Vision; keeps payload/cost predictable. */
export const AI_ANALYSIS_MAX_DIMENSION = 1024;
export const AI_ANALYSIS_JPEG_QUALITY = 0.8;

/**
 * Max JSON body for one /api/analyze call. The platform rejects larger
 * requests with 413, so the browser sends several smaller batches.
 */
export const ANALYZE_REQUEST_MAX_BYTES = 3 * 1024 * 1024;

/** Longest edge kept for the single stored/display image (grid + story view). */
export const STORAGE_MAX_DIMENSION = 1600;
export const STORAGE_JPEG_QUALITY = 0.85;

export const DEFAULT_MEMORY_QUESTION_OPTIONS = [
  "특별한 일이 있었다",
  "음식이 맛있었다",
  "분위기가 좋았다",
  "그냥 잠시 쉬었다",
  "잘 모르겠다",
];

export const CUSTOM_ANSWER_OPTION = "직접 입력";

/** Caps how many memory questions are asked per trip (spec: 1~2). */
export const MAX_MEMORY_QUESTIONS = 2;

export const ANALYSIS_PROGRESS_STEPS = [
  "사진을 분석하고 있습니다",
  "장소를 확인하고 있습니다",
  "여행의 순서를 정리하고 있습니다",
  "기억할 만한 장면을 찾고 있습니다",
] as const;

export const STORY_PROGRESS_STEPS = [
  "기억 질문 답변을 반영하고 있습니다",
  "여행의 흐름을 구성하고 있습니다",
  "이야기를 다듬고 있습니다",
] as const;

export const STORY_CARD_PROGRESS_STEPS = [
  "여행 이야기에서 핵심을 고르고 있습니다",
  "대표 사진을 고르고 있습니다",
  "카드의 분위기와 배치를 정하고 있습니다",
] as const;
