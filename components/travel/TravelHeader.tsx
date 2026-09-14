"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { formatDateRange } from "@/lib/utils";
import type { TravelProject } from "@/types/travel";

interface TravelHeaderProps {
  project: TravelProject;
  stepLabel: string;
}

export default function TravelHeader({ project, stepLabel }: TravelHeaderProps) {
  return (
    <div className="mb-8">
      <Link
        href="/"
        className="mb-3 inline-flex items-center gap-1 text-body-sm text-on-surface-variant hover:text-primary"
      >
        <ChevronLeft size={16} />
        나의 여행
      </Link>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-headline-page-mobile font-display font-semibold text-charcoal">
          {project.title}
        </h1>
        <span className="rounded-full bg-primary-subtle px-3 py-1 text-caption-meta font-semibold text-primary">
          {stepLabel}
        </span>
      </div>
      {(project.startDate || project.endDate) && (
        <p className="mt-1 text-caption-meta text-text-tertiary">
          {formatDateRange(project.startDate, project.endDate)}
        </p>
      )}
    </div>
  );
}
