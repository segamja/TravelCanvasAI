"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, UploadCloud } from "lucide-react";
import TravelList from "@/components/travel/TravelList";
import { listProjects, deleteProject } from "@/storage/travelStorage";
import type { TravelProject } from "@/types/travel";

export default function HomePage() {
  const [projects, setProjects] = useState<TravelProject[] | null>(null);

  useEffect(() => {
    // localStorage is client-only; reading it during render would mismatch SSR output.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProjects(listProjects());
  }, []);

  async function handleDelete(id: string) {
    await deleteProject(id);
    setProjects(listProjects());
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
      <section className="mb-14 grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary-subtle px-3 py-1 text-caption-meta font-medium text-primary">
            <Sparkles size={13} />
            Local-First &amp; Zero Input AI Curation
          </div>
          <h1 className="mb-4 text-display-story-mobile font-display font-bold leading-tight text-charcoal sm:text-display-story">
            흩어진 사진 속 기억이,
            <br />
            <span className="italic text-primary">한 편의 여행 이야기로</span>
          </h1>
          <p className="max-w-xl text-body-editorial text-on-surface-variant">
            사진을 올리기만 하면 AI가 장소와 시간, 감정의 흐름을 엮어 하나의 여행 이야기로
            재구성합니다.
          </p>
        </div>
        <div className="lg:col-span-5">
          <div className="relative rounded-xl bg-surface-card p-6 shadow-[var(--shadow-floating)]">
            <div className="absolute left-0 top-6 bottom-6 w-1.5 rounded-r bg-primary" />
            <div className="flex flex-col items-center rounded-lg bg-surface-stone/70 p-6 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-subtle text-primary">
                <UploadCloud size={26} />
              </div>
              <p className="mb-1 text-headline-card font-display font-semibold text-charcoal">
                새 여행 이야기 시작하기
              </p>
              <p className="mb-5 max-w-xs text-body-sm text-on-surface-variant">
                여행 사진들을 한꺼번에 올려주세요.
              </p>
              <Link
                href="/travel/new"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-body-default font-semibold text-on-primary shadow-md transition-all hover:-translate-y-0.5 hover:bg-primary-hover"
              >
                사진 일괄 업로드
              </Link>
              <p className="mt-4 text-caption-meta text-text-tertiary">
                서버 저장 없이 브라우저에만 저장돼요
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-5 text-headline-chapter font-display font-semibold text-charcoal">
          나의 여행
        </h2>
        {projects === null ? (
          <p className="text-body-sm text-text-tertiary">불러오는 중...</p>
        ) : (
          <TravelList projects={projects} onDelete={handleDelete} />
        )}
      </section>
    </main>
  );
}
