"use client";

import { useAutoUpdate } from "@/lib/hooks/useAutoUpdate";

/** Invisible: just keeps the page in sync with whatever version the server is running. */
export default function VersionWatcher() {
  useAutoUpdate();
  return null;
}
