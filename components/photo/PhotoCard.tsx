"use client";

import { X, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoCardProps {
  src?: string;
  alt?: string;
  onRemove?: () => void;
  className?: string;
}

export default function PhotoCard({ src, alt = "", onRemove, className }: PhotoCardProps) {
  return (
    <div
      className={cn(
        "group relative aspect-square overflow-hidden rounded-lg bg-surface-stone",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-text-tertiary">
          <ImageOff size={20} />
        </div>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="사진 삭제"
          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-charcoal/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
