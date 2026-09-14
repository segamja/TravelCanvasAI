import { deleteBlob, deleteBlobs, getBlob, putBlob } from "./indexedDB";
import { getItem, setItem, removeItem } from "./localStorage";
import { resizeImageToDataUrl } from "@/lib/utils";
import { AI_ANALYSIS_JPEG_QUALITY, AI_ANALYSIS_MAX_DIMENSION } from "@/lib/constants";
import type { Photo } from "@/types/photo";

const PHOTO_META_KEY = (id: string) => `photo:${id}`;

const objectUrlCache = new Map<string, string>();

/** Persists the (already resized) display image bytes for a photo. */
export async function savePhotoBlob(id: string, blob: Blob): Promise<void> {
  await putBlob(id, blob);
}

export async function savePhotoMeta(photo: Photo): Promise<void> {
  setItem(PHOTO_META_KEY(photo.id), photo);
}

export function getPhotoMeta(id: string): Photo | undefined {
  return getItem<Photo>(PHOTO_META_KEY(id));
}

export function getPhotosMeta(ids: string[]): Photo[] {
  return ids
    .map((id) => getPhotoMeta(id))
    .filter((p): p is Photo => Boolean(p));
}

/** Returns a cached object URL for the photo's stored image, creating one if needed. */
export async function getPhotoObjectUrl(id: string): Promise<string | undefined> {
  const cached = objectUrlCache.get(id);
  if (cached) return cached;
  const blob = await getBlob(id);
  if (!blob) return undefined;
  const url = URL.createObjectURL(blob);
  objectUrlCache.set(id, url);
  return url;
}

/**
 * Derives a smaller data URL for AI analysis from the already-stored blob,
 * so re-running analysis after a reload doesn't require the original File.
 */
export async function getPhotoAnalysisDataUrl(id: string): Promise<string | undefined> {
  const blob = await getBlob(id);
  if (!blob) return undefined;
  return resizeImageToDataUrl(blob, AI_ANALYSIS_MAX_DIMENSION, AI_ANALYSIS_JPEG_QUALITY);
}

export async function deletePhoto(id: string): Promise<void> {
  const url = objectUrlCache.get(id);
  if (url) {
    URL.revokeObjectURL(url);
    objectUrlCache.delete(id);
  }
  removeItem(PHOTO_META_KEY(id));
  await deleteBlob(id);
}

export async function deletePhotos(ids: string[]): Promise<void> {
  ids.forEach((id) => {
    const url = objectUrlCache.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      objectUrlCache.delete(id);
    }
    removeItem(PHOTO_META_KEY(id));
  });
  await deleteBlobs(ids);
}
