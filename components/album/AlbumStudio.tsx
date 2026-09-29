"use client";

import { useState } from "react";
import AlbumForm from "@/components/album/AlbumForm";
import AlbumPreview from "@/components/album/AlbumPreview";
import { saveAlbum } from "@/storage/travelStorage";
import type { TravelAlbum } from "@/types/album";
import type { TravelProject } from "@/types/travel";

interface AlbumStudioProps {
  project: TravelProject;
  onBack: () => void;
  onSaved: (project: TravelProject) => void;
}

function albumSignature(album: TravelAlbum): string {
  return JSON.stringify({
    title: album.title,
    density: album.density,
    layout: album.layout,
    dayLabels: album.dayLabels,
    pages: album.pages.map((page) => ({
      kind: page.kind,
      dateLabel: page.dateLabel ?? "",
      title: page.title,
      body: page.body,
      photoIds: page.photoIds,
      placeLabel: page.placeLabel,
    })),
  });
}

export default function AlbumStudio({ project, onBack, onSaved }: AlbumStudioProps) {
  const [album, setAlbum] = useState<TravelAlbum | null>(project.album ?? null);
  const [editing, setEditing] = useState(!project.album);
  const [savedSignature, setSavedSignature] = useState<string | null>(
    project.album ? albumSignature(project.album) : null,
  );

  if (editing || !album) {
    return (
      <AlbumForm
        project={project}
        onCancel={onBack}
        onCreate={(next) => {
          setAlbum(next);
          setEditing(false);
        }}
      />
    );
  }

  return (
    <AlbumPreview
      album={album}
      saved={savedSignature === albumSignature(album)}
      onBack={onBack}
      onEdit={() => setEditing(true)}
      onSave={() => {
        const updated = saveAlbum(project.id, album);
        setSavedSignature(albumSignature(album));
        onSaved(updated);
      }}
    />
  );
}
