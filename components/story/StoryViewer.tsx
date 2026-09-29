"use client";

import { Camera, MapPin, Pencil, Sparkles } from "lucide-react";
import { usePhotoUrls } from "@/lib/hooks/usePhotoUrls";
import {
  dateRangeFromPhotoIds,
  groupPhotoIdsByDay,
  photoDateTimeCaption,
} from "@/lib/photoDates";
import { formatDateRange } from "@/lib/utils";
import type { TravelProject } from "@/types/travel";

interface StoryViewerProps {
  project: TravelProject;
  onEdit: () => void;
  onOpenStoryCard: () => void;
  onOpenAlbum: () => void;
}

export default function StoryViewer({ project, onEdit, onOpenStoryCard, onOpenAlbum }: StoryViewerProps) {
  const story = project.story;
  const allPhotoIds = project.photoIds;
  const urls = usePhotoUrls(allPhotoIds);
  const heroId = project.coverPhotoId ?? allPhotoIds[0];
  const tripRange = dateRangeFromPhotoIds(allPhotoIds);
  const tripDates = formatDateRange(
    project.startDate || tripRange.start,
    project.endDate || tripRange.end,
  );

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
            <span>{tripDates || "날짜 없음"}</span>
            <span className="text-white/40">•</span>
            <span className="flex items-center gap-1">
              <Camera size={13} /> 사진 {project.photoIds.length}장
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto mb-10 flex max-w-2xl flex-col gap-4 rounded-xl border border-border-subdued bg-surface-card/95 p-5 shadow-[var(--shadow-keepsake)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-label-badge font-semibold uppercase tracking-widest text-primary">
            AI Story Card
          </p>
          <h2 className="mt-1 font-display text-headline-card font-semibold text-charcoal">
            이 여행을 한 장의 카드로
          </h2>
          <p className="mt-1 max-w-md text-body-sm text-on-surface-variant">
            대표 사진과 핵심 문장을 골라, 저장하고 이미지로 받을 수 있는 카드로 만듭니다.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenStoryCard}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-body-sm font-semibold text-on-primary"
        >
          <Sparkles size={15} />
          {project.storyCard ? "AI Story Card 보기" : "AI Story Card 만들기"}
        </button>
      </section>

      <section className="mx-auto mb-10 flex max-w-2xl flex-col gap-4 rounded-xl border border-border-subdued bg-surface-card/95 p-5 shadow-[var(--shadow-keepsake)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-label-badge font-semibold uppercase tracking-widest text-primary">Photobook</p>
          <h2 className="mt-1 font-display text-headline-card font-semibold text-charcoal">
            날짜별로 넘기는 앨범
          </h2>
          <p className="mt-1 max-w-md text-body-sm text-on-surface-variant">
            촬영일마다 사진과 짧은 글이 한 페이지가 됩니다. Unsplash 사진은 배경으로만 깔립니다.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAlbum}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-charcoal px-4 py-2.5 text-body-sm font-semibold text-white"
        >
          {project.album ? "앨범 보기" : "앨범 만들기"}
        </button>
      </section>

      <div className="mx-auto mb-6 flex max-w-2xl justify-end px-1">
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
        {story.chapters.map((chapter, index) => {
          const groups = groupPhotoIdsByDay(chapter.photoIds);
          const chapterRange = dateRangeFromPhotoIds(chapter.photoIds);
          const chapterDates = formatDateRange(chapterRange.start, chapterRange.end);
          return (
          <section key={chapter.id}>
            <p className="mb-2 text-caption-meta font-semibold uppercase tracking-widest text-primary">
              Chapter {String(index + 1).padStart(2, "0")}
              {chapterDates ? ` · ${chapterDates}` : ""}
            </p>
            <h2 className="mb-5 text-headline-chapter font-display font-semibold text-charcoal">
              {chapter.title}
            </h2>
            <div className="mb-5 flex flex-col gap-6">
              {groups.map((group) => (
                <div key={group.label} className="flex flex-col gap-3">
                  <p className="text-caption-meta font-semibold text-on-surface-variant">{group.label}</p>
                  {group.ids.map((id) =>
                    urls[id] ? (
                      <figure key={id}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={urls[id]}
                          alt=""
                          className="w-full rounded-lg object-cover shadow-[var(--shadow-keepsake)]"
                        />
                        {photoDateTimeCaption(id) && (
                          <figcaption className="mt-1.5 text-caption-meta text-text-tertiary">
                            {photoDateTimeCaption(id)}
                          </figcaption>
                        )}
                      </figure>
                    ) : null,
                  )}
                </div>
              ))}
            </div>
            <p className="whitespace-pre-line text-body-editorial text-on-surface-variant">
              {chapter.body}
            </p>
          </section>
          );
        })}
      </div>
    </article>
  );
}
