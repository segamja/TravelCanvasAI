"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import { buildTravelAlbum, listAlbumDays } from "@/lib/buildAlbum";
import { getPhotosMeta } from "@/storage/photoStorage";
import { ALBUM_DENSITIES, ALBUM_LAYOUTS, type AlbumDensity, type AlbumLayout, type TravelAlbum } from "@/types/album";
import type { TravelProject } from "@/types/travel";

const LAYOUT_LABEL: Record<AlbumLayout, string> = {
  editorial: "에디토리얼",
  journal: "저널",
  cinematic: "시네마틱",
  minimal: "미니멀",
};

const DENSITY_LABEL: Record<AlbumDensity, string> = {
  photo: "사진 중심",
  story: "이야기 중심",
};

interface AlbumFormProps {
  project: TravelProject;
  onCancel: () => void;
  onCreate: (album: TravelAlbum) => void;
}

export default function AlbumForm({ project, onCancel, onCreate }: AlbumFormProps) {
  const days = listAlbumDays(project);
  const [title, setTitle] = useState(project.album?.title || project.story?.title || project.title);
  const [selectedDays, setSelectedDays] = useState<string[]>(
    project.album?.dayLabels.length ? project.album.dayLabels : days.map((day) => day.label),
  );
  const [density, setDensity] = useState<AlbumDensity>(project.album?.density ?? "photo");
  const [layout, setLayout] = useState<AlbumLayout>(project.album?.layout ?? "editorial");

  function toggleDay(label: string) {
    setSelectedDays((current) =>
      current.includes(label) ? current.filter((item) => item !== label) : [...current, label],
    );
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (selectedDays.length === 0) return;
    const album = buildTravelAlbum(project, getPhotosMeta(project.photoIds), {
      title,
      dayLabels: selectedDays,
      density,
      layout,
    });
    onCreate(album);
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-xl flex-col gap-6 pb-16">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 self-start text-body-sm text-on-surface-variant"
      >
        <ArrowLeft size={16} />
        스토리로 돌아가기
      </button>
      <div>
        <p className="text-label-badge font-semibold uppercase tracking-widest text-primary">Photobook</p>
        <h1 className="mt-1 font-display text-headline-page-mobile font-semibold text-charcoal">앨범 만들기</h1>
        <p className="mt-2 text-body-sm text-on-surface-variant">
          촬영일마다 가로·세로를 나눠 페이지를 만듭니다. 사진은 잘리지 않고, Unsplash 이미지는 배경으로만 깔립니다.
        </p>
      </div>
      <label className="text-body-sm">
        <span className="mb-1 block font-medium text-on-surface-variant">앨범 제목</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-lg border border-border-subdued bg-white px-3 py-2.5 text-body-default outline-none focus:border-primary"
        />
      </label>
      <fieldset>
        <legend className="mb-2 text-body-sm font-medium text-on-surface-variant">넣을 날짜</legend>
        <div className="flex flex-wrap gap-2">
          {days.map((day) => {
            const checked = selectedDays.includes(day.label);
            return (
              <label
                key={day.label}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-body-sm ${
                  checked ? "border-primary bg-primary-subtle text-primary" : "border-border-subdued bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  className="accent-primary"
                  checked={checked}
                  onChange={() => toggleDay(day.label)}
                />
                {day.label}
                <span className="text-text-tertiary">{day.ids.length}장</span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-body-sm font-medium text-on-surface-variant">밀도</legend>
        <div className="flex gap-2">
          {ALBUM_DENSITIES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setDensity(item)}
              className={`rounded-lg px-4 py-2 text-body-sm ${
                density === item ? "bg-primary text-on-primary" : "bg-surface-stone text-on-surface-variant"
              }`}
            >
              {DENSITY_LABEL[item]}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-body-sm font-medium text-on-surface-variant">판형</legend>
        <div className="flex flex-wrap gap-2">
          {ALBUM_LAYOUTS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setLayout(item)}
              className={`rounded-lg px-4 py-2 text-body-sm ${
                layout === item ? "bg-charcoal text-white" : "bg-surface-stone text-on-surface-variant"
              }`}
            >
              {LAYOUT_LABEL[item]}
            </button>
          ))}
        </div>
      </fieldset>
      <Button type="submit" disabled={selectedDays.length === 0}>
        앨범 미리보기
      </Button>
    </form>
  );
}
