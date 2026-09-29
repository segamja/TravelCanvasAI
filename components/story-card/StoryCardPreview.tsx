"use client";

import { useState } from "react";
import { ArrowLeft, Download, RefreshCw, Save, Share2 } from "lucide-react";
import StoryCardRenderer from "@/components/story-card/StoryCardRenderer";
import Button from "@/components/ui/Button";
import { renderStoryCardToBlob } from "@/lib/renderStoryCardImage";
import type { StoryCard } from "@/types/storyCard";

interface StoryCardPreviewProps {
  card: StoryCard;
  photoUrl?: string;
  saved: boolean;
  notice?: string;
  isBusy: boolean;
  onBack: () => void;
  onRegenerate: () => void;
  onSave: () => void;
}

export default function StoryCardPreview({
  card,
  photoUrl,
  saved,
  notice,
  isBusy,
  onBack,
  onRegenerate,
  onSave,
}: StoryCardPreviewProps) {
  const [exportError, setExportError] = useState<string>();
  const [shareNote, setShareNote] = useState<string>();

  async function makeFile(): Promise<File> {
    const blob = await renderStoryCardToBlob(card, photoUrl);
    const name = `${card.title.replace(/[\\/:*?"<>|]/g, "").trim() || "travel"}-story-card.png`;
    return new File([blob], name, { type: "image/png" });
  }

  async function handleDownload() {
    setExportError(undefined);
    try {
      const file = await makeFile();
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError("이미지를 만들지 못했어요. 다시 시도해주세요.");
    }
  }

  async function handleShare() {
    setShareNote(undefined);
    setExportError(undefined);
    try {
      const file = await makeFile();
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: card.title });
        return;
      }
      setShareNote("이 브라우저에서는 공유 대신 이미지 저장을 이용해주세요.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setExportError("공유하지 못했어요. 이미지 저장을 이용해주세요.");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 pb-16">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-body-sm text-on-surface-variant hover:text-charcoal"
        >
          <ArrowLeft size={16} />
          스토리로 돌아가기
        </button>
        <p className="text-caption-meta uppercase tracking-widest text-primary">AI Story Card</p>
      </div>

      <div className="mx-auto w-full max-w-[440px]">
        <StoryCardRenderer card={card} photoUrl={photoUrl} />
      </div>

      {notice && <p className="text-center text-caption-meta text-text-tertiary">{notice}</p>}
      {exportError && <p className="text-center text-body-sm text-status-error">{exportError}</p>}
      {shareNote && <p className="text-center text-caption-meta text-text-tertiary">{shareNote}</p>}

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="secondary" onClick={onRegenerate} disabled={isBusy}>
          <RefreshCw size={16} />
          다시 만들기
        </Button>
        <Button variant="ghost" onClick={onSave} disabled={isBusy || saved}>
          <Save size={16} />
          {saved ? "저장됨" : "저장"}
        </Button>
        <Button onClick={() => void handleDownload()} disabled={isBusy || !photoUrl}>
          <Download size={16} />
          이미지 저장
        </Button>
        <Button variant="secondary" onClick={() => void handleShare()} disabled={isBusy || !photoUrl}>
          <Share2 size={16} />
          공유
        </Button>
      </div>
    </div>
  );
}
