import { ALBUM_THEMES, type AlbumFrame } from "@/lib/albumTheme";
import { effectiveCapturedAt, formatPhotoTime } from "@/lib/photoDates";
import { getPhotoMeta } from "@/storage/photoStorage";
import type { AlbumLayout, AlbumPage } from "@/types/album";

const WIDTH = 1080;
const HEIGHT = 1440;

export interface AlbumBackground {
  url: string;
  authorName: string;
}

export async function renderAlbumPageToBlob(
  page: AlbumPage,
  layout: AlbumLayout,
  photoUrls: Record<string, string>,
  background?: AlbumBackground,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");

  const theme = ALBUM_THEMES[layout];
  const fonts = await resolveFonts();
  const backdrop = background ? await loadImage(background.url) : null;
  const photos = await Promise.all(page.photoIds.map((id) => loadImage(photoUrls[id])));

  ctx.fillStyle = theme.paper;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  if (backdrop) {
    drawCover(ctx, backdrop, 0, 0, WIDTH, HEIGHT, theme.paper);
    ctx.fillStyle = hexToRgba(theme.paper, 0.78);
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  const x = 72;
  const maxW = WIDTH - 144;
  ctx.fillStyle = theme.accent;
  ctx.font = `600 22px ${fonts.sans}`;
  ctx.fillText(page.kind === "cover" ? "PHOTOBOOK" : page.kind === "closing" ? "THE END" : page.dateLabel || "", x, 110);

  ctx.fillStyle = theme.ink;
  ctx.font = `700 64px ${fonts.display}`;
  const titleLines = wrapText(ctx, page.title, maxW, 2);
  drawLines(ctx, titleLines, x, 190, 74);

  let cursor = 210 + titleLines.length * 74;
  if (page.placeLabel) {
    ctx.fillStyle = theme.muted;
    ctx.font = `500 24px ${fonts.sans}`;
    ctx.fillText(page.placeLabel, x, cursor);
    cursor += 36;
  }

  const photoTop = cursor + 16;
  const photoBottom = page.body ? 1120 : 1280;
  drawPhotoGrid(
    ctx,
    photos,
    page.photoIds,
    x,
    photoTop,
    maxW,
    photoBottom - photoTop,
    theme.line,
    theme.muted,
    fonts.sans,
    theme.frame,
  );

  if (page.body) {
    ctx.fillStyle = theme.ink;
    ctx.font = `400 30px ${fonts.sans}`;
    const lines = wrapText(ctx, page.body, maxW, 4);
    drawLines(ctx, lines, x, 1180, 44);
  }

  if (background?.authorName) {
    ctx.fillStyle = theme.muted;
    ctx.font = `500 18px ${fonts.sans}`;
    ctx.fillText(`Background photo by ${background.authorName} on Unsplash`, x, 1388);
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("png");
  return blob;
}

function drawPhotoGrid(
  ctx: CanvasRenderingContext2D,
  images: Array<HTMLImageElement | null>,
  photoIds: string[],
  x: number,
  y: number,
  width: number,
  height: number,
  fallback: string,
  captionColor: string,
  sans: string,
  frame: AlbumFrame,
) {
  if (images.length === 0 || height < 40) return;
  const columns = images.length > 1 ? 2 : 1;
  const rows = Math.ceil(images.length / columns);
  const gap = 28;
  const cellW = (width - gap * (columns - 1)) / columns;
  const cellH = (height - gap * (rows - 1)) / rows;
  images.forEach((image, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const left = x + col * (cellW + gap);
    const top = y + row * (cellH + gap);
    drawFramedPhoto(ctx, image, left, top, cellW, cellH - 28, fallback, frame);
    const time = formatPhotoTime(effectiveCapturedAt(getPhotoMeta(photoIds[index])));
    if (time) {
      ctx.fillStyle = captionColor;
      ctx.font = `500 20px ${sans}`;
      ctx.fillText(time, left, top + cellH - 4);
    }
  });
}

function drawFramedPhoto(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  x: number,
  y: number,
  w: number,
  h: number,
  fallback: string,
  frame: AlbumFrame,
) {
  const pad = Math.min(frame.border, Math.floor(Math.min(w, h) / 5));
  if (frame.canvasShadow) {
    ctx.save();
    ctx.shadowColor = frame.canvasShadow.color;
    ctx.shadowBlur = frame.canvasShadow.blur;
    ctx.shadowOffsetY = frame.canvasShadow.offsetY;
    ctx.fillStyle = pad > 0 ? frame.borderColor : "#ffffff";
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }
  if (pad > 0) {
    ctx.fillStyle = frame.borderColor;
    ctx.fillRect(x, y, w, h);
  }
  drawCover(ctx, image, x + pad, y + pad, w - pad * 2, h - pad * 2, fallback);
}

async function resolveFonts(): Promise<{ display: string; sans: string }> {
  const root = getComputedStyle(document.documentElement);
  const display = root.getPropertyValue("--font-playfair").trim() || "serif";
  const sans = root.getPropertyValue("--font-inter").trim() || "sans-serif";
  try {
    await document.fonts.load(`700 64px ${display}`);
    await document.fonts.load(`400 30px ${sans}`);
    await document.fonts.ready;
  } catch {
    // The canvas still draws with fallback fonts.
  }
  return { display, sans };
}

function loadImage(url?: string): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null);
  return new Promise((resolve) => {
    const image = new Image();
    if (url.startsWith("http")) image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  x: number,
  y: number,
  w: number,
  h: number,
  fallback: string,
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (!image) {
    ctx.fillStyle = fallback;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
    return;
  }
  const scale = Math.max(w / image.width, h / image.height);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(image, (image.width - sw) / 2, (image.height - sh) / 2, sw, sh, x, y, w, h);
  ctx.restore();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const ch of text.trim()) {
    const next = line + ch;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = ch === " " ? "" : ch;
      if (lines.length === maxLines) return lines;
    } else {
      line = next;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines;
}

function drawLines(ctx: CanvasRenderingContext2D, lines: string[], x: number, y: number, lineHeight: number) {
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
}

function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
