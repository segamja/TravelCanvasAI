"use client";

import { ChevronDown, ChevronUp, MapPin, Pencil, Trash2 } from "lucide-react";
import PhotoCard from "@/components/photo/PhotoCard";
import { usePhotoUrls } from "@/lib/hooks/usePhotoUrls";
import type { TravelScene } from "@/types/scene";

interface SceneCardProps {
  scene: TravelScene;
  index: number;
  total: number;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export default function SceneCard({
  scene,
  index,
  total,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: SceneCardProps) {
  const urls = usePhotoUrls(scene.photoIds.slice(0, 8));

  return (
    <div className="rounded-xl border border-border-subdued bg-surface-card p-5 shadow-[var(--shadow-keepsake)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-caption-meta font-medium text-primary">
            <span>Scene {String(index + 1).padStart(2, "0")}</span>
            {scene.location && (
              <span className="flex items-center gap-1 text-text-tertiary">
                <MapPin size={12} /> {scene.location}
              </span>
            )}
          </div>
          <h3 className="text-headline-card font-display font-semibold text-charcoal">
            {scene.title}
          </h3>
          <p className="mt-1 text-body-sm text-on-surface-variant">{scene.summary}</p>
          <p className="mt-1 text-caption-meta text-text-tertiary">
            사진 {scene.photoIds.length}장
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            aria-label="위로 이동"
            className="rounded p-1.5 text-text-tertiary hover:bg-surface-stone disabled:opacity-30"
          >
            <ChevronUp size={16} />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            aria-label="아래로 이동"
            className="rounded p-1.5 text-text-tertiary hover:bg-surface-stone disabled:opacity-30"
          >
            <ChevronDown size={16} />
          </button>
          <button
            type="button"
            onClick={onEdit}
            aria-label="Scene 수정"
            className="rounded p-1.5 text-on-surface-variant hover:bg-surface-stone"
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Scene 삭제"
            className="rounded p-1.5 text-status-error hover:bg-status-error/10"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-8">
        {scene.photoIds.slice(0, 8).map((id) => (
          <PhotoCard key={id} src={urls[id]} />
        ))}
      </div>
    </div>
  );
}
