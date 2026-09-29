"use client";

import { useAppVersion } from "@/lib/hooks/useAppVersion";

/** Stays on screen on every page, including long story and album views. */
export default function VersionBadge() {
  const version = useAppVersion();
  if (!version) return null;

  return (
    <p className="fixed bottom-3 left-4 z-50 rounded-full border border-border-subdued bg-canvas-paper/95 px-2.5 py-1 text-caption-meta font-medium text-on-surface-variant shadow-sm backdrop-blur-md">
      v{version}
    </p>
  );
}
