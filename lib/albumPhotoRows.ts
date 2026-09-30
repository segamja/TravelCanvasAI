/** Width / height. Missing sizes are treated as a portrait frame. */
export function photoAspect(photo?: { width?: number; height?: number } | null): number {
  if (!photo?.width || !photo?.height) return 3 / 4;
  return photo.width / photo.height;
}

export function isLandscapePhoto(photo?: { width?: number; height?: number } | null): boolean {
  return photoAspect(photo) >= 1;
}

/**
 * Keeps photo order. A landscape photo is its own full-width row.
 * Portrait photos sit side by side in pairs.
 */
export function albumPhotoRows(photoIds: string[], isWide: (id: string) => boolean): string[][] {
  const rows: string[][] = [];
  let pending: string | null = null;
  for (const id of photoIds) {
    if (isWide(id)) {
      if (pending) {
        rows.push([pending]);
        pending = null;
      }
      rows.push([id]);
    } else if (pending) {
      rows.push([pending, id]);
      pending = null;
    } else {
      pending = id;
    }
  }
  if (pending) rows.push([pending]);
  return rows;
}

/** Row height relative to the full content width, so wide photos stay short. */
export function albumRowWeight(ids: string[], aspect: (id: string) => number): number {
  const safe = (id: string) => Math.max(aspect(id), 0.2);
  if (ids.length >= 2) {
    return Math.max(...ids.map((id) => 0.5 / safe(id)));
  }
  return 1 / safe(ids[0]);
}
