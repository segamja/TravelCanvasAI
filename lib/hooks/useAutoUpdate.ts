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
        // Omit cookies so Vercel skew protection does not pin this request
        // to the deployment that originally served the page.
        const res = await fetch(`/api/version?t=${Date.now()}`, {
          cache: "no-store",
          credentials: "omit",
        });
        if (!res.ok) return;
        const data: { version?: string } = await res.json();
        const latest = data.version;
        if (cancelled || !latest || latest === builtVersion) return;

        const reloadKey = `travelcanvasai:reloaded-for:${latest}`;
        if (sessionStorage.getItem(reloadKey) === "1") return;
        sessionStorage.setItem(reloadKey, "1");

        const url = new URL(window.location.href);
        url.searchParams.set("_v", latest);
        window.location.replace(url.toString());
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
