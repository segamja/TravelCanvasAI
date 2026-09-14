"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import { createProject } from "@/storage/travelStorage";

export default function NewTravelPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const project = createProject({
      title: title.trim() || "제목 없는 여행",
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
    router.push(`/travel/${project.id}`);
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-5 py-16">
      <h1 className="mb-2 text-headline-page-mobile font-display font-semibold text-charcoal">
        당신의 여행을 이야기로 만들어보세요
      </h1>
      <p className="mb-8 text-body-default text-on-surface-variant">
        제목과 날짜는 나중에 언제든 바꿀 수 있어요. AI가 사진을 분석한 뒤 제목을 추천해드릴게요.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <label className="text-body-sm">
          <span className="mb-1 block font-medium text-on-surface-variant">여행 제목 (선택)</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 바람을 따라 걷다, 제주 4일"
            className="w-full rounded-lg border border-border-subdued bg-white px-3 py-2.5 text-body-default outline-none focus:border-primary"
          />
        </label>
        <div className="flex gap-3">
          <label className="flex-1 text-body-sm">
            <span className="mb-1 block font-medium text-on-surface-variant">시작일 (선택)</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-border-subdued bg-white px-3 py-2.5 text-body-default outline-none focus:border-primary"
            />
          </label>
          <label className="flex-1 text-body-sm">
            <span className="mb-1 block font-medium text-on-surface-variant">종료일 (선택)</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-border-subdued bg-white px-3 py-2.5 text-body-default outline-none focus:border-primary"
            />
          </label>
        </div>
        <Button type="submit" variant="primary" className="mt-2 self-start">
          사진 업로드하러 가기
          <ArrowRight size={16} />
        </Button>
      </form>
    </main>
  );
}
