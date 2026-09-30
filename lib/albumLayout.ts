/** Width / height. Missing sizes are treated as a portrait frame. */
export function photoAspect(photo?: { width?: number; height?: number } | null): number {
  if (!photo?.width || !photo?.height) return 3 / 4;
  return photo.width / photo.height;
}

export function isLandscapePhoto(photo?: { width?: number; height?: number } | null): boolean {
  return photoAspect(photo) >= 1;
}

const GAP = 28;
const CAPTION = 36;

export interface AlbumPhotoBox {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Unscaled block. Callers fit it into the page without changing these ratios. */
export interface AlbumPhotoBlock {
  width: number;
  height: number;
  photos: AlbumPhotoBox[];
}

/**
 * One day, in capture order within each orientation.
 * A portrait plus two landscapes share a page: portrait on the left,
 * landscapes stacked on the right. Leftover landscapes stack up to two.
 * Leftover portraits sit side by side, up to two. One of each stays on its own page.
 */
export function planDayPhotoPages(photoIds: string[], isWide: (id: string) => boolean): string[][] {
  const landscapes = photoIds.filter(isWide);
  const portraits = photoIds.filter((id) => !isWide(id));
  const pages: string[][] = [];
  while (portraits.length >= 1 && landscapes.length >= 2) {
    const portrait = portraits.shift();
    const top = landscapes.shift();
    const bottom = landscapes.shift();
    if (portrait && top && bottom) pages.push([portrait, top, bottom]);
  }
  while (landscapes.length > 0) pages.push(landscapes.splice(0, 2));
  while (portraits.length > 0) pages.push(portraits.splice(0, 2));
  return pages;
}

export function measureAlbumBlock(
  photoIds: string[],
  aspect: (id: string) => number,
  isWide: (id: string) => boolean,
  hasCaption: (id: string) => boolean = () => false,
): AlbumPhotoBlock {
  const wide = photoIds.filter(isWide);
  const tall = photoIds.filter((id) => !isWide(id));
  if (photoIds.length === 3 && tall.length === 1 && wide.length === 2) {
    return measureSplit(tall[0], wide, aspect, hasCaption);
  }
  if (wide.length === 0 && tall.length > 0 && tall.length <= 2) return measurePair(tall, aspect, hasCaption);
  if (tall.length === 0 && wide.length > 0 && wide.length <= 2) return measureStack(wide, aspect, hasCaption);
  return measureStack(photoIds, aspect, hasCaption);
}

function captionSize(id: string, hasCaption: (id: string) => boolean): number {
  return hasCaption(id) ? CAPTION : 0;
}

function measureStack(
  ids: string[],
  aspect: (id: string) => number,
  hasCaption: (id: string) => boolean,
): AlbumPhotoBlock {
  const width = 1000;
  const photos: AlbumPhotoBox[] = [];
  let y = 0;
  ids.forEach((id, index) => {
    const height = width / Math.max(aspect(id), 0.2);
    photos.push({ id, x: 0, y, w: width, h: height });
    y += height + captionSize(id, hasCaption);
    if (index < ids.length - 1) y += GAP;
  });
  return { width, height: Math.max(y, 1), photos };
}

function measurePair(
  ids: string[],
  aspect: (id: string) => number,
  hasCaption: (id: string) => boolean,
): AlbumPhotoBlock {
  const height = 1000;
  const photos: AlbumPhotoBox[] = [];
  let x = 0;
  ids.forEach((id, index) => {
    const width = height * Math.max(aspect(id), 0.2);
    photos.push({ id, x, y: 0, w: width, h: height });
    x += width;
    if (index < ids.length - 1) x += GAP;
  });
  const caption = Math.max(...ids.map((id) => captionSize(id, hasCaption)), 0);
  return { width: Math.max(x, 1), height: height + caption, photos };
}

function measureSplit(
  portraitId: string,
  landscapeIds: string[],
  aspect: (id: string) => number,
  hasCaption: (id: string) => boolean,
): AlbumPhotoBlock {
  const portraitH = 1000;
  const portraitW = portraitH * Math.max(aspect(portraitId), 0.2);
  const capP = captionSize(portraitId, hasCaption);
  const caps = landscapeIds.map((id) => captionSize(id, hasCaption));
  const landH = Math.max((portraitH + capP - caps.reduce((sum, cap) => sum + cap, 0) - GAP) / 2, 1);
  const landWidths = landscapeIds.map((id) => landH * Math.max(aspect(id), 0.2));
  const rightW = Math.max(...landWidths, 1);
  const photos: AlbumPhotoBox[] = [{ id: portraitId, x: 0, y: 0, w: portraitW, h: portraitH }];
  let y = 0;
  landscapeIds.forEach((id, index) => {
    const landW = landWidths[index];
    photos.push({ id, x: portraitW + GAP + (rightW - landW) / 2, y, w: landW, h: landH });
    y += landH + caps[index] + GAP;
  });
  return {
    width: portraitW + GAP + rightW,
    height: portraitH + capP,
    photos,
  };
}
