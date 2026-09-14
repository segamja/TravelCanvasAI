"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Camera, ImageIcon, Layers, Pencil, Trash2 } from "lucide-react";
import { getPhotoObjectUrl } from "@/storage/photoStorage";
import { formatDateRange } from "@/lib/utils";
import type { TravelProject } from "@/types/travel";

const STATUS_LABEL: Record<TravelProject["status"], string> = {
  draft: "사진 업로드 대기",
  "photos-uploaded": "사진 업로드됨",
  analyzing: "AI 분석 중",
  "scenes-ready": "Scene 검토 필요",
  "questions-pending": "기억 질문 대기",
  "generating-story": "Story 생성 중",
  completed: "스토리 완성",
};

interface TravelCardProps {
  project: TravelProject;
  onDelete: () => void;
}

export default function TravelCard({ project, onDelete }: TravelCardProps) {
  const [coverUrl, setCoverUrl] = useState<string | undefined>();
  const coverId = project.coverPhotoId ?? project.photoIds[0];

  useEffect(() => {
    let cancelled = false;
    if (coverId) {
      getPhotoObjectUrl(coverId).then((url) => {
        if (!cancelled) setCoverUrl(url);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [coverId]);

  const isComplete = project.status === "completed";

  return (
    <div className="group overflow-hidden rounded-xl border border-border-subdued bg-surface-card shadow-[var(--shadow-keepsake)] transition-transform hover:-translate-y-1">
      <Link href={`/travel/${project.id}`} className="block">
        <div className="relative aspect-[4/3] bg-surface-stone">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt={project.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-text-tertiary">
              <ImageIcon size={28} />
            </div>
          )}
          <span
            className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-label-badge font-semibold uppercase tracking-wide ${
              isComplete
                ? "bg-status-success/90 text-white"
                : "bg-charcoal/70 text-white"
            }`}
          >
            {STATUS_LABEL[project.status]}
          </span>
        </div>
      </Link>
      <div className="p-4">
        <div className="mb-1 flex items-center gap-3 text-caption-meta text-text-tertiary">
          <span className="flex items-center gap-1">
            <Camera size={13} /> {project.photoIds.length}장
          </span>
          {project.scenes.length > 0 && (
            <span className="flex items-center gap-1">
              <Layers size={13} /> {project.scenes.length}개 Scene
            </span>
          )}
        </div>
        <Link href={`/travel/${project.id}`}>
          <h3 className="mb-1 line-clamp-1 text-headline-card font-display font-semibold text-charcoal hover:text-primary">
            {project.title}
          </h3>
        </Link>
        <p className="mb-3 text-caption-meta text-text-tertiary">
          {formatDateRange(project.startDate, project.endDate) || "날짜 미정"}
        </p>
        <div className="flex items-center gap-2">
          <Link
            href={`/travel/${project.id}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary-subtle px-3 py-2 text-body-sm font-medium text-primary hover:bg-primary hover:text-on-primary"
          >
            <Pencil size={14} />
            {isComplete ? "이야기 열기" : "이어서 작업하기"}
          </Link>
          <button
            type="button"
            onClick={onDelete}
            aria-label="프로젝트 삭제"
            className="rounded-lg p-2 text-status-error hover:bg-status-error/10"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
