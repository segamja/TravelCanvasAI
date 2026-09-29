import { parse } from "exifr";

export interface ExifResult {
  capturedAt?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Reads real EXIF metadata from the original file so capture time/GPS come
 * from the camera, not from AI guesswork (spec §7.2: AI must not confirm
 * time/location on its own).
 */
export async function extractExif(file: File): Promise<ExifResult> {
  try {
    const data = await parse(file, { gps: true });
    if (!data) return {};

    const result: ExifResult = {};
    const capturedAt = normalizeExifDate(data.DateTimeOriginal ?? data.CreateDate);
    if (capturedAt) result.capturedAt = capturedAt;
    if (typeof data.latitude === "number" && typeof data.longitude === "number") {
      result.latitude = data.latitude;
      result.longitude = data.longitude;
    }
    return result;
  } catch {
    return {};
  }
}

function normalizeExifDate(value: unknown): string | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  if (typeof value !== "string") return undefined;
  const exif = value.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (exif) {
    const date = new Date(
      Number(exif[1]),
      Number(exif[2]) - 1,
      Number(exif[3]),
      Number(exif[4]),
      Number(exif[5]),
      Number(exif[6]),
    );
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  return undefined;
}
