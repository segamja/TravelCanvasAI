"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, RefreshCw, Save, Trash2, X } from "lucide-react";
import Button from "@/components/ui/Button";
import PhotoCard from "@/components/photo/PhotoCard";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import UnsplashInspiration from "./UnsplashInspiration";
import { usePhotoUrls } from "@/lib/hooks/usePhotoUrls";
import type { TravelStory } from "@/types/story";

interface StoryEditorProps {
  story: TravelStory;
  allPhotoIds: string[];
  locationHint?: string;
  onSave: (story: TravelStory) => Promise<void>;
  onCancel: () => void;
  onRegenerate: () => void;
  onDeleteProject: () => Promise<void>;
}

export default function StoryEditor({
  story,
  allPhotoIds,
  locationHint,
  onSave,
  onCancel,
  onRegenerate,
  onDeleteProject,
}: StoryEditorProps) {
  const [draft, setDraft] = useState<TravelStory>(story);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const urls = usePhotoUrls(allPhotoIds);

  function updateChapter(index: number, patch: Partial<TravelStory["chapters"][number]>) {
    setDraft((prev) => ({
      ...prev,
      chapters: prev.chapters.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    }));
  }

  function moveChapter(index: number, direction: -1 | 1) {
    setDraft((prev) => {
      const chapters = [...prev.chapters];
      const target = index + direction;
      if (target < 0 || target >= chapters.length) return prev;
      [chapters[index], chapters[target]] = [chapters[target], chapters[index]];
      return { ...prev, chapters };
    });
  }

  function removePhotoFromChapter(chapterIndex: number, photoId: string) {
    updateChapter(chapterIndex, {
      photoIds: draft.chapters[chapterIndex].photoIds.filter((id) => id !== photoId),
    });
  }

  return (
    <div className="mx-auto w-full max-w-2xl pb-24">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-headline-page-mobile font-display font-semibold text-charcoal">
          스토리 편집
        </h2>
        <button onClick={onCancel} aria-label="닫기" className="rounded-full p-2 hover:bg-surface-stone">
          <X size={18} />
        </button>
      </div>

      <label className="mb-3 block text-body-sm">
        <span className="mb-1 block font-medium text-on-surface-variant">여행 제목</span>
        <input
          value={draft.title}
          onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
          className="w-full rounded-lg border border-border-subdued bg-white px-3 py-2 text-headline-card font-display outline-none focus:border-primary"
        />
      </label>
      <label className="mb-8 block text-body-sm">
        <span className="mb-1 block font-medium text-on-surface-variant">부제 (선택)</span>
        <input
          value={draft.subtitle ?? ""}
          onChange={(e) => setDraft((p) => ({ ...p, subtitle: e.target.value }))}
          className="w-full rounded-lg border border-border-subdued bg-white px-3 py-2 text-body-default outline-none focus:border-primary"
        />
      </label>

      <div className="mb-8">
        <UnsplashInspiration defaultQuery={locationHint} />
      </div>

      <div className="flex flex-col gap-8">
        {draft.chapters.map((chapter, index) => (
          <div
            key={chapter.id}
            className="rounded-xl border border-border-subdued bg-surface-card p-5 shadow-[var(--shadow-keepsake)]"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-caption-meta font-semibold uppercase tracking-widest text-primary">
                Chapter {String(index + 1).padStart(2, "0")}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveChapter(index, -1)}
                  disabled={index === 0}
                  aria-label="위로 이동"
                  className="rounded p-1.5 text-text-tertiary hover:bg-surface-stone disabled:opacity-30"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  onClick={() => moveChapter(index, 1)}
                  disabled={index === draft.chapters.length - 1}
                  aria-label="아래로 이동"
                  className="rounded p-1.5 text-text-tertiary hover:bg-surface-stone disabled:opacity-30"
                >
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>
            <input
              value={chapter.title}
              onChange={(e) => updateChapter(index, { title: e.target.value })}
              className="mb-2 w-full rounded-lg border border-border-subdued bg-white px-3 py-2 font-display font-semibold outline-none focus:border-primary"
            />
            <textarea
              value={chapter.body}
              onChange={(e) => updateChapter(index, { body: e.target.value })}
              rows={5}
              className="mb-3 w-full resize-none rounded-lg border border-border-subdued bg-white px-3 py-2 text-body-editorial outline-none focus:border-primary"
            />
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
              {chapter.photoIds.map((id) => (
                <PhotoCard
                  key={id}
                  src={urls[id]}
                  onRemove={() => removePhotoFromChapter(index, id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border-subdued pt-6">
        <button
          onClick={onRegenerate}
          className="inline-flex items-center gap-1.5 text-body-sm text-secondary hover:underline"
        >
          <RefreshCw size={15} />
          AI로 다시 생성하기
        </button>
        <div className="flex items-center gap-2">
          <Button variant="danger" onClick={() => setConfirmingDelete(true)}>
            <Trash2 size={16} />
            프로젝트 삭제
          </Button>
          <Button
            variant="primary"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              await onSave(draft);
              setSaving(false);
            }}
          >
            <Save size={16} />
            저장
          </Button>
        </div>
      </div>

      {confirmingDelete && (
        <ConfirmDialog
          title="이야기 프로젝트를 삭제할까요?"
          description="사진, 분석 결과, Scene, Story를 포함한 모든 데이터가 삭제되며 되돌릴 수 없어요."
          confirmLabel="삭제"
          danger
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={async () => {
            setConfirmingDelete(false);
            await onDeleteProject();
          }}
        />
      )}
    </div>
  );
}
