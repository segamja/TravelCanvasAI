"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import PhotoCard from "@/components/photo/PhotoCard";
import { usePhotoUrls } from "@/lib/hooks/usePhotoUrls";
import type { TravelScene } from "@/types/scene";

interface SceneEditorProps {
  scene: TravelScene;
  allProjectPhotoIds: string[];
  onSave: (updated: TravelScene) => void;
  onCancel: () => void;
}

export default function SceneEditor({
  scene,
  allProjectPhotoIds,
  onSave,
  onCancel,
}: SceneEditorProps) {
  const [title, setTitle] = useState(scene.title);
  const [summary, setSummary] = useState(scene.summary);
  const [photoIds, setPhotoIds] = useState(scene.photoIds);
  const [showAddPhotos, setShowAddPhotos] = useState(false);
  const unassignedIds = allProjectPhotoIds.filter((id) => !photoIds.includes(id));
  const urls = usePhotoUrls([...photoIds, ...unassignedIds]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal/40 backdrop-blur-sm px-4"
      onClick={onCancel}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-surface-card p-6 shadow-[var(--shadow-floating)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-headline-card font-display font-semibold text-charcoal">
          Scene 수정
        </h3>
        <label className="mb-3 block text-body-sm">
          <span className="mb-1 block font-medium text-on-surface-variant">제목</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-border-subdued bg-white px-3 py-2 text-body-default outline-none focus:border-primary"
          />
        </label>
        <label className="mb-4 block text-body-sm">
          <span className="mb-1 block font-medium text-on-surface-variant">설명</span>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-lg border border-border-subdued bg-white px-3 py-2 text-body-default outline-none focus:border-primary"
          />
        </label>
        <p className="mb-2 text-body-sm font-medium text-on-surface-variant">
          사진 ({photoIds.length}장) — 클릭하여 삭제
        </p>
        <div className="mb-3 grid grid-cols-4 gap-1.5 sm:grid-cols-6">
          {photoIds.map((id) => (
            <PhotoCard
              key={id}
              src={urls[id]}
              onRemove={() => setPhotoIds((prev) => prev.filter((p) => p !== id))}
            />
          ))}
        </div>
        {unassignedIds.length > 0 && (
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setShowAddPhotos((v) => !v)}
              className="mb-2 text-body-sm font-medium text-secondary hover:underline"
            >
              {showAddPhotos ? "닫기" : `+ 다른 사진 추가 (${unassignedIds.length}장)`}
            </button>
            {showAddPhotos && (
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
                {unassignedIds.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPhotoIds((prev) => [...prev, id])}
                    className="opacity-70 hover:opacity-100"
                  >
                    <PhotoCard src={urls[id]} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            취소
          </Button>
          <Button
            variant="primary"
            disabled={photoIds.length === 0 || !title.trim()}
            onClick={() => onSave({ ...scene, title: title.trim(), summary: summary.trim(), photoIds })}
          >
            저장
          </Button>
        </div>
      </div>
    </div>
  );
}
