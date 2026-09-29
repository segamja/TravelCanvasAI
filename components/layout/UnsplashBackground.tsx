"use client";

import { useEffect, useState } from "react";
import { getCurrentSeasonQuery } from "@/lib/utils";

interface BackgroundImage {
  url: string;
  authorName: string;
  authorLink: string;
}

/**
 * Full-page backdrop from Unsplash. User travel photos stay the content;
 * this image is only atmosphere, with the attribution Unsplash requires.
 */
export default function UnsplashBackground() {
  const [image, setImage] = useState<BackgroundImage | null>(null);

  useEffect(() => {
    const { label } = getCurrentSeasonQuery();
    const cacheKey = `unsplashBackground:${label}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        // sessionStorage is client-only; reading it during render would mismatch SSR output.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setImage(JSON.parse(cached) as BackgroundImage);
        return;
      } catch {
        sessionStorage.removeItem(cacheKey);
      }
    }

    let cancelled = false;
    fetch("/api/unsplash/background")
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { image?: BackgroundImage } | null) => {
        if (cancelled || !json?.image?.url) return;
        setImage(json.image);
        sessionStorage.setItem(cacheKey, JSON.stringify(json.image));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10 bg-canvas-paper" aria-hidden={!image}>
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image.url} alt="" className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-canvas-paper/50 via-canvas-paper/72 to-canvas-paper/90" />
      </div>
      {image && (
        <a
          href={image.authorLink}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-3 right-4 z-40 text-[11px] text-text-tertiary hover:text-primary"
        >
          Photo by {image.authorName} on Unsplash
        </a>
      )}
    </>
  );
}
