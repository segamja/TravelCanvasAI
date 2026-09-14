"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CUSTOM_ANSWER_OPTION } from "@/lib/constants";
import type { MemoryQuestion } from "@/types/scene";

interface MemoryQuestionCardProps {
  question: MemoryQuestion;
  onAnswer: (answer: string, isCustomAnswer: boolean) => void;
}

export default function MemoryQuestionCard({ question, onAnswer }: MemoryQuestionCardProps) {
  const [customText, setCustomText] = useState(question.isCustomAnswer ? question.answer ?? "" : "");
  const [showCustomInput, setShowCustomInput] = useState(Boolean(question.isCustomAnswer));

  const options = [...question.options, CUSTOM_ANSWER_OPTION];

  return (
    <div className="rounded-xl border border-border-subdued bg-surface-card p-6 shadow-[var(--shadow-keepsake)]">
      <p className="mb-4 text-body-editorial font-display text-charcoal">{question.question}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isCustom = option === CUSTOM_ANSWER_OPTION;
          const selected = isCustom ? showCustomInput : question.answer === option && !question.isCustomAnswer;
          return (
            <button
              key={option}
              type="button"
              onClick={() => {
                if (isCustom) {
                  setShowCustomInput(true);
                  if (customText.trim()) onAnswer(customText.trim(), true);
                } else {
                  setShowCustomInput(false);
                  onAnswer(option, false);
                }
              }}
              className={cn(
                "rounded-full border px-4 py-2 text-body-sm transition-colors",
                selected
                  ? "border-primary bg-primary-subtle text-primary font-semibold"
                  : "border-border-subdued bg-surface-stone text-on-surface-variant hover:border-border-contrast",
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
      {showCustomInput && (
        <input
          autoFocus
          value={customText}
          onChange={(e) => {
            setCustomText(e.target.value);
            onAnswer(e.target.value.trim(), true);
          }}
          placeholder="직접 입력해주세요"
          className="mt-3 w-full rounded-lg border border-border-subdued bg-white px-3 py-2 text-body-default outline-none focus:border-primary"
        />
      )}
    </div>
  );
}
