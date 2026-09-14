"use client";

import { useState } from "react";
import { BookImage } from "lucide-react";
import Link from "next/link";
import TravelCard from "./TravelCard";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { TravelProject } from "@/types/travel";

interface TravelListProps {
  projects: TravelProject[];
  onDelete: (id: string) => Promise<void>;
}

export default function TravelList({ projects, onDelete }: TravelListProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed border-border-contrast bg-surface-stone/50 px-6 py-16 text-center">
        <BookImage size={32} className="mb-3 text-text-tertiary" />
        <p className="mb-1 text-headline-card font-display font-semibold text-charcoal">
          아직 저장된 여행 이야기가 없어요
        </p>
        <p className="mb-5 text-body-sm text-on-surface-variant">
          사진을 올리는 것부터 시작해보세요.
        </p>
        <Link
          href="/travel/new"
          className="rounded-lg bg-primary px-5 py-2.5 text-body-sm font-semibold text-on-primary hover:bg-primary-hover"
        >
          새 여행 시작하기
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <TravelCard
            key={project.id}
            project={project}
            onDelete={() => setPendingDeleteId(project.id)}
          />
        ))}
      </div>
      {pendingDeleteId && (
        <ConfirmDialog
          title="이야기 프로젝트를 삭제할까요?"
          description="사진, 분석 결과, Scene, Story를 포함한 모든 데이터가 삭제되며 되돌릴 수 없어요."
          confirmLabel="삭제"
          danger
          onCancel={() => setPendingDeleteId(null)}
          onConfirm={async () => {
            const id = pendingDeleteId;
            setPendingDeleteId(null);
            await onDelete(id);
          }}
        />
      )}
    </>
  );
}
