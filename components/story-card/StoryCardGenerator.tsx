"use client";

import { useEffect, useState } from "react";
import AnalysisProgress from "@/components/analysis/AnalysisProgress";
import StoryCardPreview from "@/components/story-card/StoryCardPreview";
import ErrorBanner from "@/components/ui/ErrorBanner";
import { STORY_CARD_PROGRESS_STEPS } from "@/lib/constants";
import { usePhotoUrls } from "@/lib/hooks/usePhotoUrls";
import {
  buildLocalDecision,
  collectStoryCardFacts,
  finalizeStoryCard,
} from "@/lib/storyCard";
import { toFriendlyErrorMessage } from "@/lib/utils";
import { getPhotosMeta } from "@/storage/photoStorage";
import { saveStoryCard } from "@/storage/travelStorage";
import type { StoryCard, StoryCardDecision } from "@/types/storyCard";
import type { TravelProject } from "@/types/travel";

interface StoryCardGeneratorProps {
  project: TravelProject;
  onBack: () => void;
  onSaved: (project: TravelProject) => void;
}

function cardSignature(card: StoryCard): string {
  return JSON.stringify({
    projectId: card.projectId,
    title: card.title,
    heroPhotoId: card.heroPhotoId,
    story: card.story,
    dateLabel: card.dateLabel,
    placeLabel: card.placeLabel,
    capturedAtLabel: card.capturedAtLabel ?? "",
    keyMoment: card.keyMoment,
    keywords: card.keywords,
    mood: card.mood,
    layout: card.layout,
    palette: card.palette,
  });
}

export default function StoryCardGenerator({ project, onBack, onSaved }: StoryCardGeneratorProps) {
  const [card, setCard] = useState<StoryCard | null>(project.storyCard ?? null);
  const [savedSignature, setSavedSignature] = useState<string | null>(
    project.storyCard ? cardSignature(project.storyCard) : null,
  );
  const [notice, setNotice] = useState<string>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(!project.storyCard);
  const [stepIndex, setStepIndex] = useState(0);
  const urls = usePhotoUrls(card ? [card.heroPhotoId] : []);

  useEffect(() => {
    if (project.storyCard) return;
    const controller = new AbortController();
    void generate(controller.signal);
    return () => controller.abort();
    // The first open without a saved card starts generation once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading) return;
    const timer = window.setInterval(() => {
      setStepIndex((current) => Math.min(current + 1, STORY_CARD_PROGRESS_STEPS.length - 1));
    }, 900);
    return () => window.clearInterval(timer);
  }, [loading]);

  async function generate(signal?: AbortSignal) {
    setLoading(true);
    setError(undefined);
    setStepIndex(0);
    try {
      const photos = getPhotosMeta(project.photoIds);
      const facts = collectStoryCardFacts(project, photos);
      if (facts.chapters.length === 0 || facts.photos.length === 0) {
        throw new Error("카드로 만들 스토리나 사진이 없습니다.");
      }

      let decision: Partial<StoryCardDecision> | null = null;
      let composedLocally = false;
      const response = await fetch("/api/story-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(facts),
        signal,
      });
      if (signal?.aborted) return;
      const json = (await response.json()) as {
        decision?: Partial<StoryCardDecision>;
        error?: string;
        code?: string;
      };

      if (response.status === 503 && json.code === "missing_api_key") {
        decision = buildLocalDecision(facts);
        composedLocally = true;
      } else if (!response.ok) {
        throw new Error(json.error ?? "스토리 카드를 만들지 못했습니다.");
      } else {
        decision = json.decision ?? null;
      }

      if (signal?.aborted) return;
      setCard(finalizeStoryCard(decision, facts));
      setNotice(
        composedLocally
          ? "AI 키 없이, 이미 있는 스토리와 사진 정보만으로 카드를 구성했어요."
          : undefined,
      );
    } catch (cause) {
      if (signal?.aborted || (cause instanceof DOMException && cause.name === "AbortError")) return;
      setError(toFriendlyErrorMessage(cause));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  function handleSave() {
    if (!card) return;
    const updated = saveStoryCard(project.id, card);
    setSavedSignature(cardSignature(card));
    onSaved(updated);
  }

  if (loading || !card) {
    return (
      <div>
        {error && (
          <div className="mx-auto mb-6 max-w-md">
            <ErrorBanner message={error} onRetry={() => void generate()} />
          </div>
        )}
        {loading && (
          <AnalysisProgress
            headline="여행 이야기를 한 장의 카드로 만들고 있어요"
            steps={STORY_CARD_PROGRESS_STEPS}
            currentStepIndex={stepIndex}
          />
        )}
        <div className="mt-6 text-center">
          <button type="button" onClick={onBack} className="text-body-sm text-on-surface-variant underline">
            스토리로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mx-auto mb-6 max-w-md">
          <ErrorBanner message={error} onRetry={() => void generate()} />
        </div>
      )}
      <StoryCardPreview
        card={card}
        photoUrl={urls[card.heroPhotoId]}
        saved={savedSignature === cardSignature(card)}
        notice={notice}
        isBusy={loading}
        onBack={onBack}
        onRegenerate={() => void generate()}
        onSave={handleSave}
      />
    </div>
  );
}
