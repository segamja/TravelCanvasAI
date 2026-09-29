"use client";

import { useAppVersion } from "@/lib/hooks/useAppVersion";

export default function Footer() {
  const version = useAppVersion();
  return (
    <footer className="border-t border-border-subdued px-5 py-4 text-center text-caption-meta text-text-tertiary">
      TravelCanvas.ai{version ? ` · v${version}` : ""}
    </footer>
  );
}
