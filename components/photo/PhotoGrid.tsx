"use client";

import PhotoCard from "./PhotoCard";
import { usePhotoUrls } from "@/lib/hooks/usePhotoUrls";
import { groupPhotoIdsByDay, photoTimeCaption } from "@/lib/photoDates";

interface PhotoGridProps {
  photoIds: string[];
  onRemove?: (id: string) => void;
}

export default function PhotoGrid({ photoIds, onRemove }: PhotoGridProps) {
  const urls = usePhotoUrls(photoIds);
  const groups = groupPhotoIdsByDay(photoIds);

  if (photoIds.length === 0) return null;

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <section key={group.label}>
          <h3 className="mb-2 text-caption-meta font-semibold text-on-surface-variant">
            {group.label}
            <span className="ml-2 font-medium text-text-tertiary">{group.ids.length}장</span>
          </h3>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {group.ids.map((id) => (
              <PhotoCard
                key={id}
                src={urls[id]}
                caption={photoTimeCaption(id)}
                onRemove={onRemove ? () => onRemove(id) : undefined}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
