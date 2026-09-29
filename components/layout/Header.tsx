"use client";

import Link from "next/link";
import { Plus, Camera } from "lucide-react";
import { useAppVersion } from "@/lib/hooks/useAppVersion";

export default function Header() {
  const version = useAppVersion();

  return (
    <header className="sticky top-0 z-50 border-b border-border-subdued bg-canvas-paper/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-on-primary">
            <Camera size={18} />
          </span>
          <span className="flex items-baseline gap-2">
            <span className="text-headline-card font-display font-semibold text-charcoal">
              TravelCanvas<span className="text-primary">.ai</span>
            </span>
            {version && (
              <span className="text-caption-meta font-medium text-text-tertiary">
                v{version}
              </span>
            )}
          </span>
        </Link>
        <Link
          href="/travel/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-body-sm font-semibold text-on-primary shadow-[0_2px_8px_-1px_rgba(159,60,22,0.25)] transition-all hover:bg-primary-hover hover:-translate-y-0.5"
        >
          <Plus size={16} />
          새 여행 시작하기
        </Link>
      </div>
    </header>
  );
}
