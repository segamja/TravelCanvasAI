"use client";

import { ArrowRight } from "lucide-react";
import MemoryQuestionCard from "@/components/memory/MemoryQuestionCard";
import Button from "@/components/ui/Button";
import type { MemoryQuestion } from "@/types/scene";
import type { TravelScene } from "@/types/scene";

interface MemoryQuestionStepProps {
  questions: MemoryQuestion[];
  scenes: TravelScene[];
  onAnswer: (questionId: string, answer: string, isCustomAnswer: boolean) => void;
  onNext: () => void;
}

export default function MemoryQuestionStep({
  questions,
  scenes,
  onAnswer,
  onNext,
}: MemoryQuestionStepProps) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <p className="text-body-default text-on-surface-variant">
        이 순간을 특별하게 만든 이야기가 있었나요? 답하지 않아도 이야기를 완성할 수 있어요.
      </p>
      <div className="flex flex-col gap-5">
        {questions.map((question) => {
          const scene = scenes.find((s) => s.id === question.sceneId);
          return (
            <div key={question.id}>
              {scene && (
                <p className="mb-2 text-caption-meta font-semibold uppercase tracking-widest text-primary">
                  {scene.title}
                </p>
              )}
              <MemoryQuestionCard
                question={question}
                onAnswer={(answer, isCustomAnswer) =>
                  onAnswer(question.id, answer, isCustomAnswer)
                }
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-end">
        <Button variant="primary" onClick={onNext}>
          여행 이야기 만들기
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
}
