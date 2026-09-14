"use client";

import { useState } from "react";
import { Loader2, Search, Sparkles } from "lucide-react";
import ErrorBanner from "@/components/ui/ErrorBanner";

interface UnsplashImageResult {
  id: string;
  description: string | null;
  url: string;
  thumbUrl: string;
  authorName: string;
  authorLink: string;
}

interface UnsplashInspirationProps {
  defaultQuery?: string;
}

/**
 * Supplementary-only image search (spec §16-17): never a source for the
 * user's own photos, always visually and functionally separate, with the
 * author credit Unsplash's API terms require.
 */
export default function UnsplashInspiration({ defaultQuery = "" }: UnsplashInspirationProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(defaultQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [images, setImages] = useState<UnsplashImageResult[]>([]);

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    setError(undefined);
    try {
      const res = await fetch(`/api/unsplash?q=${encodeURIComponent(query.trim())}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "이미지를 불러오지 못했습니다.");
      setImages(json.images ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "이미지를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-border-subdued bg-surface-stone/60 p-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-body-sm font-semibold text-on-surface-variant"
      >
        <span className="flex items-center gap-1.5">
          <Sparkles size={15} className="text-tertiary" />
          장소/분위기 보조 이미지 둘러보기 (Unsplash)
        </span>
        <span className="text-caption-meta text-text-tertiary">{open ? "닫기" : "열기"}</span>
      </button>
      {open && (
        <div className="mt-4">
          <p className="mb-3 text-caption-meta text-text-tertiary">
            참고용 이미지예요. 여행기 본문에는 항상 회원님의 사진만 사용됩니다.
          </p>
          <div className="mb-4 flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="예: Kyoto, 제주 바다"
              className="flex-1 rounded-lg border border-border-subdued bg-white px-3 py-2 text-body-sm outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={search}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg bg-secondary px-4 py-2 text-body-sm font-semibold text-on-secondary hover:bg-secondary-hover disabled:opacity-50"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
              검색
            </button>
          </div>
          {error && <ErrorBanner message={error} />}
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {images.map((img) => (
                <a
                  key={img.id}
                  href={img.authorLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square overflow-hidden rounded-lg bg-white"
                  title={`Photo by ${img.authorName} on Unsplash`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.thumbUrl}
                    alt={img.description ?? ""}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute inset-x-0 bottom-0 truncate bg-charcoal/60 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100">
                    {img.authorName} · Unsplash
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
