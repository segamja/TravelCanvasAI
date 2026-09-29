import { STORY_CARD_THEMES } from "@/lib/storyCardTheme";
import type { StoryCard } from "@/types/storyCard";

const WIDTH = 1080;
const HEIGHT = 1440;

export async function renderStoryCardToBlob(card: StoryCard, photoUrl?: string): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");

  const fonts = await resolveFonts();
  const image = photoUrl ? await loadImage(photoUrl) : null;
  const theme = STORY_CARD_THEMES[card.palette];

  ctx.fillStyle = theme.paper;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  if (card.layout === "cinematic") drawCinematic(ctx, card, image, fonts);
  else if (card.layout === "journal") drawJournal(ctx, card, image, fonts);
  else if (card.layout === "minimal") drawMinimal(ctx, card, image, fonts);
  else drawEditorial(ctx, card, image, fonts);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("png");
  return blob;
}

interface Fonts {
  display: string;
  sans: string;
}

async function resolveFonts(): Promise<Fonts> {
  const root = getComputedStyle(document.documentElement);
  const display = root.getPropertyValue("--font-playfair").trim() || "serif";
  const sans = root.getPropertyValue("--font-inter").trim() || "sans-serif";
  try {
    await document.fonts.load(`700 72px ${display}`);
    await document.fonts.load(`400 32px ${sans}`);
    await document.fonts.ready;
  } catch {
    // Fall back to whatever the browser can draw.
  }
  return { display, sans };
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
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
  const sx = (image.width - sw) / 2;
  const sy = (image.height - sh) / 2;
  ctx.drawImage(image, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
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

function drawLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y: number,
  lineHeight: number,
) {
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });
}

function metaLine(card: StoryCard): string {
  return [card.dateLabel, card.capturedAtLabel].filter(Boolean).join("  ");
}

function drawEditorial(
  ctx: CanvasRenderingContext2D,
  card: StoryCard,
  image: HTMLImageElement | null,
  fonts: Fonts,
) {
  const theme = STORY_CARD_THEMES[card.palette];
  const photoH = 806;
  drawCover(ctx, image, 0, 0, WIDTH, photoH, theme.line);
  const fade = ctx.createLinearGradient(0, photoH - 140, 0, photoH);
  fade.addColorStop(0, "rgba(0,0,0,0)");
  fade.addColorStop(1, theme.paper);
  ctx.fillStyle = fade;
  ctx.fillRect(0, photoH - 140, WIDTH, 140);

  const x = 72;
  const maxW = WIDTH - 144;
  ctx.fillStyle = theme.accent;
  ctx.font = `600 22px ${fonts.sans}`;
  ctx.fillText("TRAVEL STORY", x, 880);

  ctx.fillStyle = theme.ink;
  ctx.font = `700 64px ${fonts.display}`;
  const titleLines = wrapText(ctx, card.title, maxW, 2);
  drawLines(ctx, titleLines, x, 960, 76);

  let cursor = 960 + titleLines.length * 76 + 8;
  ctx.fillStyle = theme.muted;
  ctx.font = `400 30px ${fonts.sans}`;
  const storyLines = wrapText(ctx, card.story, maxW, 6);
  drawLines(ctx, storyLines, x, cursor, 46);
  cursor += storyLines.length * 46 + 28;

  if (card.keywords.length > 0) {
    ctx.fillStyle = theme.accent;
    ctx.font = `600 20px ${fonts.sans}`;
    ctx.fillText(card.keywords.join("   ·   "), x, cursor);
    cursor += 48;
  }

  if (card.keyMoment) {
    ctx.fillStyle = theme.accent;
    ctx.fillRect(x, cursor - 22, 3, 64);
    ctx.fillStyle = theme.ink;
    ctx.font = `600 28px ${fonts.display}`;
    const moment = wrapText(ctx, card.keyMoment, maxW - 28, 2);
    drawLines(ctx, moment, x + 24, cursor, 38);
  }

  drawFooter(ctx, card, fonts, theme.muted, theme.ink, 72, 1368);
}

function drawCinematic(
  ctx: CanvasRenderingContext2D,
  card: StoryCard,
  image: HTMLImageElement | null,
  fonts: Fonts,
) {
  const theme = STORY_CARD_THEMES[card.palette];
  drawCover(ctx, image, 0, 0, WIDTH, HEIGHT, "#1c1917");
  const veil = ctx.createLinearGradient(0, HEIGHT * 0.38, 0, HEIGHT);
  veil.addColorStop(0, "rgba(0,0,0,0)");
  veil.addColorStop(0.42, "rgba(10,8,6,0.2)");
  veil.addColorStop(1, theme.veil);
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const x = 72;
  const maxW = WIDTH - 144;
  ctx.fillStyle = "rgba(255,255,255,0.78)";
  ctx.font = `600 22px ${fonts.sans}`;
  ctx.fillText(card.keywords[0] ? card.keywords.join("   ·   ") : "TRAVEL STORY", x, 980);

  ctx.fillStyle = "#faf9f6";
  ctx.font = `700 68px ${fonts.display}`;
  const titleLines = wrapText(ctx, card.title, maxW, 2);
  drawLines(ctx, titleLines, x, 1064, 80);

  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.font = `400 30px ${fonts.sans}`;
  const storyLines = wrapText(ctx, card.story, maxW, 5);
  drawLines(ctx, storyLines, x, 1064 + titleLines.length * 80 + 12, 46);

  if (card.keyMoment) {
    ctx.fillStyle = "#f3e6d4";
    ctx.font = `600 26px ${fonts.display}`;
    const moment = wrapText(ctx, card.keyMoment, maxW, 2);
    drawLines(ctx, moment, x, 1288, 36);
  }
  drawFooter(ctx, card, fonts, "rgba(255,255,255,0.75)", "#ffffff", 72, 1368);
}

function drawJournal(
  ctx: CanvasRenderingContext2D,
  card: StoryCard,
  image: HTMLImageElement | null,
  fonts: Fonts,
) {
  const theme = STORY_CARD_THEMES[card.palette];
  const x = 84;
  const maxW = WIDTH - 168;

  ctx.fillStyle = theme.accent;
  ctx.font = `600 20px ${fonts.sans}`;
  ctx.fillText("A PAGE FROM THE JOURNEY", x, 96);

  ctx.fillStyle = theme.ink;
  ctx.font = `700 58px ${fonts.display}`;
  const titleLines = wrapText(ctx, card.title, maxW, 2);
  drawLines(ctx, titleLines, x, 172, 70);

  const photoY = 172 + titleLines.length * 70 + 12;
  const photoH = 620;
  ctx.save();
  ctx.shadowColor = "rgba(40,30,20,0.18)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x - 14, photoY - 14, maxW + 28, photoH + 28);
  ctx.restore();
  drawCover(ctx, image, x, photoY, maxW, photoH, theme.line);

  let cursor = photoY + photoH + 64;
  ctx.fillStyle = theme.muted;
  ctx.font = `400 28px ${fonts.sans}`;
  const storyLines = wrapText(ctx, card.story, maxW, 4);
  drawLines(ctx, storyLines, x, cursor, 42);
  cursor += storyLines.length * 42 + 28;

  if (card.keyMoment) {
    ctx.fillStyle = theme.ink;
    ctx.font = `600 28px ${fonts.display}`;
    const moment = wrapText(ctx, card.keyMoment, maxW, 2);
    drawLines(ctx, moment, x, cursor, 38);
  }
  drawFooter(ctx, card, fonts, theme.muted, theme.ink, x, 1368);
}

function drawMinimal(
  ctx: CanvasRenderingContext2D,
  card: StoryCard,
  image: HTMLImageElement | null,
  fonts: Fonts,
) {
  const theme = STORY_CARD_THEMES[card.palette];
  const photoH = 980;
  drawCover(ctx, image, 48, 48, WIDTH - 96, photoH - 48, theme.line);

  const x = 72;
  const maxW = WIDTH - 144;
  ctx.fillStyle = theme.accent;
  ctx.font = `600 20px ${fonts.sans}`;
  ctx.fillText(card.keywords.join("   ·   ") || "TRAVEL STORY", x, 1068);

  ctx.fillStyle = theme.ink;
  ctx.font = `700 56px ${fonts.display}`;
  const titleLines = wrapText(ctx, card.title, maxW, 2);
  drawLines(ctx, titleLines, x, 1144, 66);

  ctx.fillStyle = theme.muted;
  ctx.font = `400 28px ${fonts.sans}`;
  const storyLines = wrapText(ctx, card.story, maxW, 3);
  drawLines(ctx, storyLines, x, 1144 + titleLines.length * 66 + 8, 42);

  drawFooter(ctx, card, fonts, theme.muted, theme.ink, x, 1368);
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  card: StoryCard,
  fonts: Fonts,
  muted: string,
  ink: string,
  x: number,
  y: number,
) {
  const when = metaLine(card);
  ctx.font = `500 22px ${fonts.sans}`;
  ctx.fillStyle = muted;
  if (when) ctx.fillText(when, x, y);
  if (card.placeLabel) {
    ctx.fillStyle = ink;
    ctx.textAlign = "right";
    ctx.fillText(card.placeLabel, WIDTH - x, y);
    ctx.textAlign = "left";
  }
}
