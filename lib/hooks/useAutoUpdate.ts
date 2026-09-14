"use client";

import { useEffect } from "react";

const CHECK_INTERVAL_MS = 60_000;

/**
 * Polls /api/version and, if the running server reports a version newer
 * than the one this page was built with, reloads automatically so the
 * visitor always ends up on the latest deployed version without having to
 * manually refresh.
 */
export function useAutoUpdate() {
  useEffect(() => {
    const builtVersion = process.env.NEXT_PUBLIC_APP_VERSION;
    if (!builtVersion) return;

    let cancelled = false;

    async function checkForUpdate() {
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        if (!res.ok) return;
        const data: { version?: string } = await res.json();
        if (!cancelled && data.version && data.version !== builtVersion) {
          window.location.reload();
        }
      } catch {
        // Offline or the server is briefly unreachable; just try again later.
      }
    }

    checkForUpdate();
    const intervalId = window.setInterval(checkForUpdate, CHECK_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") checkForUpdate();
    };
    window.addEventListener("focus", checkForUpdate);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", checkForUpdate);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
}
