"use client";

import { useEffect, useState } from "react";
import { getCurrentSeasonQuery } from "@/lib/utils";

interface SeasonalImage {
  url: string;
  authorName: string;
  authorLink: string;
}

/**
 * Decorative background photo behind the landing hero, pulled from Unsplash
 * for the current season. Purely supplementary (spec §17): failures are
 * swallowed so the hero still renders fine without it.
 */
export default function SeasonalHeroBackground() {
  const [image, setImage] = useState<SeasonalImage | null>(null);

  useEffect(() => {
    const { label, query } = getCurrentSeasonQuery();
    const cacheKey = `seasonalHero:${label}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        // sessionStorage is client-only; reading it during render would mismatch SSR output.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setImage(JSON.parse(cached));
        return;
      } catch {
        // fall through to refetch
      }
    }

    let cancelled = false;
    fetch(`/api/unsplash?q=${encodeURIComponent(query)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (cancelled || !json?.images?.length) return;
        const picked = json.images[Math.floor(Math.random() * json.images.length)];
        const next: SeasonalImage = {
          url: picked.url,
          authorName: picked.authorName,
          authorLink: picked.authorLink,
        };
        setImage(next);
        sessionStorage.setItem(cacheKey, JSON.stringify(next));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  if (!image) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url}
        alt=""
        className="h-full w-full object-cover opacity-25"
        loading="eager"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-canvas-paper via-canvas-paper/85 to-canvas-paper/40" />
      <a
        href={image.authorLink}
        target="_blank"
        rel="noopener noreferrer"
        className="pointer-events-auto absolute bottom-2 right-3 text-[10px] text-text-tertiary hover:text-primary"
      >
        Photo by {image.authorName} on Unsplash
      </a>
    </div>
  );
}
