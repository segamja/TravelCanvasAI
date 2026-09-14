"use client";

import { useEffect, useState } from "react";
import { getPhotoObjectUrl } from "@/storage/photoStorage";

/** Resolves IndexedDB-stored photo blobs into cached object URLs for <img> rendering. */
export function usePhotoUrls(photoIds: string[]): Record<string, string> {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = photoIds.join(",");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        photoIds.map(async (id) => [id, await getPhotoObjectUrl(id)] as const),
      );
      if (cancelled) return;
      setUrls((prev) => {
        const next = { ...prev };
        for (const [id, url] of entries) {
          if (url) next[id] = url;
        }
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return urls;
}
