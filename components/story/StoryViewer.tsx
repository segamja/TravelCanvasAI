"use client";

import { Camera, MapPin, Pencil, Sparkles } from "lucide-react";
import { usePhotoUrls } from "@/lib/hooks/usePhotoUrls";
import { formatDateRange } from "@/lib/utils";
import type { TravelProject } from "@/types/travel";

interface StoryViewerProps {
  project: TravelProject;
  onEdit: () => void;
  onOpenStoryCard: () => void;
}

export default function StoryViewer({ project, onEdit, onOpenStoryCard }: StoryViewerProps) {
  const story = project.story;
  const allPhotoIds = project.photoIds;
  const urls = usePhotoUrls(allPhotoIds);
  const heroId = project.coverPhotoId ?? allPhotoIds[0];

  if (!story) return null;

  return (
    <article className="w-full">
      <section className="relative -mx-5 mb-12 flex min-h-[70vh] flex-col justify-end overflow-hidden bg-charcoal text-white sm:min-h-[80vh]">
        {urls[heroId] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={urls[heroId]}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-80"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/50 to-charcoal/10" />
        <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center px-6 pb-16 pt-24 text-center">
          {project.scenes[0]?.location && (
            <span className="mb-3 flex items-center gap-1.5 text-label-badge uppercase tracking-widest text-white/80">
              <MapPin size={13} />
              {project.scenes[0].location}
            </span>
          )}
          <h1 className="mb-3 text-display-story-mobile font-display font-bold leading-tight sm:text-display-story">
            {story.title}
          </h1>
          {story.subtitle && (
            <p className="mb-4 max-w-xl text-headline-card font-display italic text-white/85">
              {story.subtitle}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-caption-meta text-white/75">
            <span>{formatDateRange(project.startDate, project.endDate)}</span>
            <span className="text-white/40">•</span>
            <span className="flex items-center gap-1">
              <Camera size={13} /> 사진 {project.photoIds.length}장
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto mb-6 flex max-w-2xl flex-wrap items-center justify-end gap-2 px-1">
        <button
          type="button"
          onClick={onOpenStoryCard}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-body-sm font-semibold text-on-primary"
        >
          <Sparkles size={15} />
          {project.storyCard ? "AI Story Card 보기" : "AI Story Card 만들기"}
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-body-sm text-on-surface-variant hover:bg-surface-stone"
        >
          <Pencil size={15} />
          스토리 편집
        </button>
      </div>

      <div className="mx-auto flex max-w-2xl flex-col gap-16 px-1 pb-20">
        {story.chapters.map((chapter, index) => (
          <section key={chapter.id}>
            <p className="mb-2 text-caption-meta font-semibold uppercase tracking-widest text-primary">
              Chapter {String(index + 1).padStart(2, "0")}
            </p>
            <h2 className="mb-5 text-headline-chapter font-display font-semibold text-charcoal">
              {chapter.title}
            </h2>
            <div className="mb-5 flex flex-col gap-3">
              {chapter.photoIds.map((id) =>
                urls[id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={id}
                    src={urls[id]}
                    alt=""
                    className="w-full rounded-lg object-cover shadow-[var(--shadow-keepsake)]"
                  />
                ) : null,
              )}
            </div>
            <p className="whitespace-pre-line text-body-editorial text-on-surface-variant">
              {chapter.body}
            </p>
          </section>
        ))}
      </div>
    </article>
  );
}
