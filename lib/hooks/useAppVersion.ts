"use client";

import { useEffect, useState } from "react";

const builtVersion = process.env.NEXT_PUBLIC_APP_VERSION;
let resolvedVersion = builtVersion;

function loadVersion(): Promise<string | undefined> {
  if (typeof window === "undefined") return Promise.resolve(builtVersion);
  const host = window as Window & { __travelCanvasVersion?: Promise<string | undefined> };
  if (!host.__travelCanvasVersion) {
    host.__travelCanvasVersion = fetch(`/api/version?t=${Date.now()}`, {
      cache: "no-store",
      credentials: "omit",
    })
      .then(async (res) => {
        if (!res.ok) return builtVersion;
        const data = (await res.json()) as { version?: string };
        resolvedVersion = data.version || builtVersion;
        return resolvedVersion;
      })
      .catch(() => builtVersion);
  }
  return host.__travelCanvasVersion;
}

/** package.json version, refreshed from /api/version after the page loads. */
export function useAppVersion() {
  const [version, setVersion] = useState(resolvedVersion);

  useEffect(() => {
    let cancelled = false;
    loadVersion().then((value) => {
      if (!cancelled && value) setVersion(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return version;
}
