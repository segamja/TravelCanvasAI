"use client";

import { useRef, useState, type DragEvent } from "react";
import { ImagePlus, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { SUPPORTED_MIME_TYPES } from "@/lib/constants";

interface PhotoUploaderProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  compact?: boolean;
}

function filterSupportedFiles(fileList: FileList | File[]): File[] {
  return Array.from(fileList).filter((file) =>
    SUPPORTED_MIME_TYPES.includes(file.type as (typeof SUPPORTED_MIME_TYPES)[number]),
  );
}

export default function PhotoUploader({
  onFilesSelected,
  disabled,
  compact,
}: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const files = filterSupportedFiles(e.dataTransfer.files);
    if (files.length > 0) onFilesSelected(files);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const files = filterSupportedFiles(e.target.files);
    if (files.length > 0) onFilesSelected(files);
    e.target.value = "";
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border-[1.5px] border-dashed bg-surface-stone/70 text-center transition-colors",
        compact ? "p-6" : "p-12",
        isDragging ? "border-primary bg-primary-subtle/50" : "border-border-contrast",
        disabled && "opacity-50",
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-subtle text-primary">
        {compact ? <ImagePlus size={26} /> : <UploadCloud size={28} />}
      </div>
      {!compact && (
        <p className="mb-1 text-headline-card font-semibold text-charcoal">
          여행 사진을 올려주세요
        </p>
      )}
      <p className="mb-5 text-body-sm text-on-surface-variant">
        사진을 여러 장 선택하거나 이곳에 끌어다 놓으세요 (JPG, PNG, WEBP)
      </p>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-body-sm font-semibold text-on-primary transition-all hover:bg-primary-hover disabled:opacity-50"
      >
        <ImagePlus size={18} />
        사진 선택하기
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={SUPPORTED_MIME_TYPES.join(",")}
        multiple
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  );
}
