"use client";

import PhotoCard from "./PhotoCard";
import { usePhotoUrls } from "@/lib/hooks/usePhotoUrls";

interface PhotoGridProps {
  photoIds: string[];
  onRemove?: (id: string) => void;
}

export default function PhotoGrid({ photoIds, onRemove }: PhotoGridProps) {
  const urls = usePhotoUrls(photoIds);

  if (photoIds.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
      {photoIds.map((id) => (
        <PhotoCard
          key={id}
          src={urls[id]}
          onRemove={onRemove ? () => onRemove(id) : undefined}
        />
      ))}
    </div>
  );
}
