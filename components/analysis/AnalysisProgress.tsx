"use client";

import { Check, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalysisProgressProps {
  headline: string;
  steps: readonly string[];
  currentStepIndex: number;
  /** Live count for the active step, such as "12 / 42장 분석 중". */
  detail?: string;
}

export default function AnalysisProgress({
  headline,
  steps,
  currentStepIndex,
  detail,
}: AnalysisProgressProps) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-20 text-center">
      <h2
        className={cn(
          "text-headline-page-mobile font-display font-semibold text-charcoal",
          detail ? "mb-3" : "mb-8",
        )}
      >
        {headline}
      </h2>
      {detail && <p className="mb-8 text-body-default font-medium text-primary">{detail}</p>}
      <ul className="w-full space-y-3 text-left">
        {steps.map((step, index) => {
          const done = index < currentStepIndex;
          const active = index === currentStepIndex;
          return (
            <li
              key={step}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-body-default transition-colors",
                active && "bg-primary-subtle text-primary font-medium",
                done && "text-on-surface-variant",
                !done && !active && "text-text-tertiary",
              )}
            >
              {done && <Check size={18} className="shrink-0 text-status-success" />}
              {active && <Loader2 size={18} className="shrink-0 animate-spin" />}
              {!done && !active && <Circle size={16} className="shrink-0" />}
              <span>{step}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
