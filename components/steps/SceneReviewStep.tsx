"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import SceneCard from "@/components/scene/SceneCard";
import SceneEditor from "@/components/scene/SceneEditor";
import Button from "@/components/ui/Button";
import ErrorBanner from "@/components/ui/ErrorBanner";
import type { TravelScene } from "@/types/scene";

interface SceneReviewStepProps {
  scenes: TravelScene[];
  allProjectPhotoIds: string[];
  error?: string;
  onChange: (scenes: TravelScene[]) => void;
  onNext: () => void;
}

export default function SceneReviewStep({
  scenes,
  allProjectPhotoIds,
  error,
  onChange,
  onNext,
}: SceneReviewStepProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingScene = scenes.find((s) => s.id === editingId) ?? null;

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= scenes.length) return;
    const next = [...scenes];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function remove(id: string) {
    onChange(scenes.filter((s) => s.id !== id));
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      {error && <ErrorBanner message={error} />}
      <p className="text-body-default text-on-surface-variant">
        여행에서 {scenes.length}개의 장면을 찾았어요. 제목이나 사진을 자유롭게 수정할 수 있어요.
      </p>
      <div className="flex flex-col gap-4">
        {scenes.map((scene, index) => (
          <SceneCard
            key={scene.id}
            scene={scene}
            index={index}
            total={scenes.length}
            onEdit={() => setEditingId(scene.id)}
            onDelete={() => remove(scene.id)}
            onMoveUp={() => move(index, -1)}
            onMoveDown={() => move(index, 1)}
          />
        ))}
      </div>
      <div className="flex justify-end">
        <Button variant="primary" disabled={scenes.length === 0} onClick={onNext}>
          다음
          <ArrowRight size={16} />
        </Button>
      </div>

      {editingScene && (
        <SceneEditor
          scene={editingScene}
          allProjectPhotoIds={allProjectPhotoIds}
          onCancel={() => setEditingId(null)}
          onSave={(updated) => {
            onChange(scenes.map((s) => (s.id === updated.id ? updated : s)));
            setEditingId(null);
          }}
        />
      )}
    </div>
  );
}
