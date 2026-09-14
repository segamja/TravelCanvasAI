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

    const date: Date | undefined = data.DateTimeOriginal ?? data.CreateDate;
    const result: ExifResult = {};
    if (date instanceof Date && !Number.isNaN(date.getTime())) {
      result.capturedAt = date.toISOString();
    }
    if (typeof data.latitude === "number" && typeof data.longitude === "number") {
      result.latitude = data.latitude;
      result.longitude = data.longitude;
    }
    return result;
  } catch {
    return {};
  }
}
