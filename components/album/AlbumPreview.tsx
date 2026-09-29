"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Download, RefreshCw, Save } from "lucide-react";
import AlbumPageView from "@/components/album/AlbumPageView";
import Button from "@/components/ui/Button";
import { usePhotoUrls } from "@/lib/hooks/usePhotoUrls";
import { renderAlbumPageToBlob, type AlbumBackground } from "@/lib/renderAlbumPage";
import type { TravelAlbum } from "@/types/album";

interface AlbumPreviewProps {
  album: TravelAlbum;
  saved: boolean;
  onBack: () => void;
  onEdit: () => void;
  onSave: () => void;
}

export default function AlbumPreview({ album, saved, onBack, onEdit, onSave }: AlbumPreviewProps) {
  const [index, setIndex] = useState(0);
  const [backgrounds, setBackgrounds] = useState<Record<string, AlbumBackground>>({});
  const [exportError, setExportError] = useState<string>();
  const page = album.pages[Math.min(index, Math.max(album.pages.length - 1, 0))];

  useEffect(() => {
    setIndex(0);
  }, [album.id]);
  const photoIds = album.pages.flatMap((item) => item.photoIds);
  const urls = usePhotoUrls(photoIds);

  useEffect(() => {
    const queries = [...new Set(album.pages.map((item) => item.backgroundQuery))];
    let cancelled = false;
    Promise.all(
      queries.map(async (query) => {
        const response = await fetch(`/api/unsplash?q=${encodeURIComponent(query)}`);
        if (!response.ok) return null;
        const json = (await response.json()) as {
          images?: { url: string; authorName: string }[];
        };
        const image = json.images?.[0];
        return image ? ([query, { url: image.url, authorName: image.authorName }] as const) : null;
      }),
    )
      .then((entries) => {
        if (cancelled) return;
        setBackgrounds(Object.fromEntries(entries.filter((entry) => entry !== null)));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [album]);

  if (!page) return null;

  const background = backgrounds[page.backgroundQuery];

  async function handleDownload() {
    setExportError(undefined);
    try {
      const blob = await renderAlbumPageToBlob(page, album.layout, urls, background);
      const name = `${album.title.replace(/[\\/:*?"<>|]/g, "").trim() || "album"}-${index + 1}.png`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError("이 페이지 이미지를 만들지 못했어요. 다시 시도해주세요.");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 pb-16">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-body-sm text-on-surface-variant"
        >
          <ArrowLeft size={16} />
          스토리로 돌아가기
        </button>
        <p className="text-caption-meta text-text-tertiary">
          {index + 1} / {album.pages.length}
        </p>
      </div>
      <AlbumPageView
        page={page}
        layout={album.layout}
        photoUrls={urls}
        backgroundUrl={background?.url}
        authorName={background?.authorName}
      />
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          aria-label="이전 페이지"
          disabled={index === 0}
          onClick={() => setIndex((current) => current - 1)}
          className="rounded-full bg-surface-stone p-2 text-charcoal disabled:opacity-30"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          aria-label="다음 페이지"
          disabled={index === album.pages.length - 1}
          onClick={() => setIndex((current) => current + 1)}
          className="rounded-full bg-surface-stone p-2 text-charcoal disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>
      {exportError && <p className="text-center text-body-sm text-status-error">{exportError}</p>}
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="secondary" onClick={onEdit}>
          <RefreshCw size={16} />
          다시 만들기
        </Button>
        <Button variant="ghost" onClick={onSave} disabled={saved}>
          <Save size={16} />
          {saved ? "저장됨" : "저장"}
        </Button>
        <Button onClick={() => void handleDownload()}>
          <Download size={16} />
          이 페이지 저장
        </Button>
      </div>
    </div>
  );
}
