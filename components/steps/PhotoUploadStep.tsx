"use client";

import { Loader2, Sparkles } from "lucide-react";
import PhotoUploader from "@/components/photo/PhotoUploader";
import PhotoGrid from "@/components/photo/PhotoGrid";
import Button from "@/components/ui/Button";
import ErrorBanner from "@/components/ui/ErrorBanner";
import { MAX_PHOTOS_PER_PROJECT } from "@/lib/constants";

interface PhotoUploadStepProps {
  photoIds: string[];
  isProcessing: boolean;
  error?: string;
  onAddFiles: (files: File[]) => void;
  onRemovePhoto: (id: string) => void;
  onNext: () => void;
}

export default function PhotoUploadStep({
  photoIds,
  isProcessing,
  error,
  onAddFiles,
  onRemovePhoto,
  onNext,
}: PhotoUploadStepProps) {
  const atLimit = photoIds.length >= MAX_PHOTOS_PER_PROJECT;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      {error && <ErrorBanner message={error} />}
      <PhotoUploader
        onFilesSelected={onAddFiles}
        disabled={isProcessing || atLimit}
        compact={photoIds.length > 0}
      />
      {isProcessing && (
        <p className="flex items-center gap-2 text-body-sm text-on-surface-variant">
          <Loader2 size={16} className="animate-spin" />
          사진을 불러오는 중이에요...
        </p>
      )}
      {photoIds.length > 0 && (
        <>
          <p className="text-body-sm font-medium text-on-surface-variant">
            {photoIds.length}장의 사진
            {atLimit && ` (최대 ${MAX_PHOTOS_PER_PROJECT}장)`}
          </p>
          <PhotoGrid photoIds={photoIds} onRemove={onRemovePhoto} />
          <div className="flex justify-end">
            <Button variant="primary" disabled={isProcessing} onClick={onNext}>
              <Sparkles size={16} />
              AI 분석 시작하기
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
