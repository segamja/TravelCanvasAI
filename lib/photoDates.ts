import { getPhotoMeta } from "@/storage/photoStorage";
import type { Photo } from "@/types/photo";
import { formatDate } from "@/lib/utils";

export function capturedAtFromFileName(fileName: string): string | undefined {
  const named = fileName.match(/(20\d{2})[-_]?(\d{2})[-_]?(\d{2})[-_ ]?(\d{2})(\d{2})(\d{2})/);
  if (named) {
    return localDateToIso(+named[1], +named[2], +named[3], +named[4], +named[5], +named[6]);
  }
  const day = fileName.match(/(20\d{2})[-_]?(\d{2})[-_]?(\d{2})/);
  if (!day) return undefined;
  return localDateToIso(+day[1], +day[2], +day[3], 0, 0, 0);
}

/** EXIF time when present, otherwise a timestamp encoded in the file name. */
export function effectiveCapturedAt(
  photo?: Pick<Photo, "capturedAt" | "fileName"> | null,
): string | undefined {
  if (!photo) return undefined;
  return photo.capturedAt || capturedAtFromFileName(photo.fileName);
}

export function formatPhotoTime(iso?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  if (date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0) return "";
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatPhotoDateTime(iso?: string): string {
  const date = iso ? formatDate(iso) : "";
  const time = formatPhotoTime(iso);
  return [date, time].filter(Boolean).join(" ");
}

export function toDateInputValue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export interface PhotoDayGroup {
  label: string;
  ids: string[];
}

export function groupPhotoIdsByDay(photoIds: string[]): PhotoDayGroup[] {
  const sorted = [...photoIds].sort(comparePhotoIds);
  const groups: PhotoDayGroup[] = [];
  for (const id of sorted) {
    const capturedAt = effectiveCapturedAt(getPhotoMeta(id));
    const label = capturedAt ? formatDate(capturedAt) : "날짜 없음";
    const last = groups[groups.length - 1];
    if (last?.label === label) last.ids.push(id);
    else groups.push({ label, ids: [id] });
  }
  return groups;
}

export function sortPhotoIds(photoIds: string[]): string[] {
  return [...photoIds].sort(comparePhotoIds);
}

export function photoTimeCaption(photoId: string): string {
  return formatPhotoTime(effectiveCapturedAt(getPhotoMeta(photoId)));
}

export function photoDateTimeCaption(photoId: string): string {
  return formatPhotoDateTime(effectiveCapturedAt(getPhotoMeta(photoId)));
}

export function dateRangeFromPhotoIds(photoIds: string[]): { start?: string; end?: string } {
  const times = photoIds
    .map((id) => effectiveCapturedAt(getPhotoMeta(id)))
    .filter((value): value is string => Boolean(value))
    .sort();
  if (times.length === 0) return {};
  return { start: times[0], end: times[times.length - 1] };
}

function comparePhotoIds(a: string, b: string): number {
  const left = effectiveCapturedAt(getPhotoMeta(a)) ?? "\uffff";
  const right = effectiveCapturedAt(getPhotoMeta(b)) ?? "\uffff";
  return left.localeCompare(right);
}

function localDateToIso(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
  seconds: number,
): string | undefined {
  const date = new Date(year, month - 1, day, hours, minutes, seconds);
  if (Number.isNaN(date.getTime())) return undefined;
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return undefined;
  }
  return date.toISOString();
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}
