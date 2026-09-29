export function generateId(prefix?: string): string {
  const raw =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return prefix ? `${prefix}_${raw}` : raw;
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDateRange(startDate?: string, endDate?: string): string {
  if (!startDate) return "";
  const start = formatDate(startDate);
  if (!endDate) return start;
  const end = formatDate(endDate);
  if (!end || start === end) return start;
  return `${start} – ${end}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/**
 * Resizes an image file client-side (canvas) so we never ship oversized
 * originals to the AI API or into browser storage previews.
 * Returns a JPEG data URL capped at maxDimension on the longest edge.
 */
export function resizeImageToDataUrl(
  source: Blob,
  maxDimension: number,
  quality: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(source);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2D context를 사용할 수 없습니다."));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("이미지를 불러올 수 없습니다."));
    };
    img.src = objectUrl;
  });
}

export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("이미지를 불러올 수 없습니다."));
    };
    img.src = objectUrl;
  });
}

/** Current-month-based season, used to pick a fitting Unsplash background query. */
export function getCurrentSeasonQuery(date: Date = new Date()): {
  label: string;
  query: string;
} {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return { label: "봄", query: "spring travel scenery" };
  if (month >= 6 && month <= 8) return { label: "여름", query: "summer travel scenery" };
  if (month >= 9 && month <= 11) return { label: "가을", query: "autumn travel scenery" };
  return { label: "겨울", query: "winter travel scenery" };
}

/** Maps technical errors to friendly, user-facing messages (spec §35). */
export function toFriendlyErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (/rate.?limit/i.test(error.message)) {
      return "AI 요청이 많아 잠시 후 다시 시도해야 해요.";
    }
    if (/network|fetch/i.test(error.message)) {
      return "네트워크 연결을 확인한 뒤 다시 시도해주세요.";
    }
    if (/json/i.test(error.message)) {
      return "AI 응답을 해석하지 못했어요. 다시 시도해주세요.";
    }
  }
  return "문제가 발생했어요. 잠시 후 다시 시도해주세요.";
}
