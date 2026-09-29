"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import TravelHeader from "@/components/travel/TravelHeader";
import PhotoUploadStep from "@/components/steps/PhotoUploadStep";
import AnalysisProgress from "@/components/analysis/AnalysisProgress";
import SceneReviewStep from "@/components/steps/SceneReviewStep";
import MemoryQuestionStep from "@/components/steps/MemoryQuestionStep";
import StoryViewer from "@/components/story/StoryViewer";
import StoryEditor from "@/components/story/StoryEditor";
import StoryCardGenerator from "@/components/story-card/StoryCardGenerator";
import AlbumStudio from "@/components/album/AlbumStudio";
import ErrorBanner from "@/components/ui/ErrorBanner";
import {
  getProject,
  updateProject,
  saveScenes,
  saveMemoryQuestions,
  saveStory,
  deleteProject,
} from "@/storage/travelStorage";
import {
  savePhotoBlob,
  savePhotoMeta,
  getPhotoMeta,
  deletePhoto,
  getPhotoAnalysisDataUrl,
} from "@/storage/photoStorage";
import { extractExif } from "@/lib/exif";
import {
  dateRangeFromPhotoIds,
  effectiveCapturedAt,
  sortPhotoIds,
  toDateInputValue,
  capturedAtFromFileName,
} from "@/lib/photoDates";
import {
  generateId,
  getImageDimensions,
  resizeImageToDataUrl,
  toFriendlyErrorMessage,
} from "@/lib/utils";
import {
  ANALYSIS_PROGRESS_STEPS,
  DEFAULT_MEMORY_QUESTION_OPTIONS,
  MAX_MEMORY_QUESTIONS,
  MAX_ORIGINAL_FILE_SIZE_BYTES,
  MAX_PHOTOS_PER_PROJECT,
  STORAGE_JPEG_QUALITY,
  STORAGE_MAX_DIMENSION,
  STORY_PROGRESS_STEPS,
} from "@/lib/constants";
import type { TravelProject, ProjectStatus } from "@/types/travel";
import type { Photo } from "@/types/photo";
import type { TravelScene, MemoryQuestion } from "@/types/scene";
import type { TravelStory } from "@/types/story";

const STEP_LABEL: Record<ProjectStatus, string> = {
  draft: "사진 업로드",
  "photos-uploaded": "사진 업로드",
  analyzing: "AI 분석 중",
  "scenes-ready": "Scene 검토",
  "questions-pending": "기억 질문",
  "generating-story": "Story 생성 중",
  completed: "완성",
};

export default function TravelProjectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = params.id;

  const [project, setProject] = useState<TravelProject | null | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>();
  const [analysisStepIndex, setAnalysisStepIndex] = useState(0);
  const [analysisError, setAnalysisError] = useState<string>();
  const [storyStepIndex, setStoryStepIndex] = useState(0);
  const [storyError, setStoryError] = useState<string>();
  const [sceneError, setSceneError] = useState<string>();
  const [editingStory, setEditingStory] = useState(false);
  const [storyCardOpen, setStoryCardOpen] = useState(false);
  const [albumOpen, setAlbumOpen] = useState(false);
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);

  const reload = useCallback(() => {
    setProject(getProject(projectId) ?? null);
  }, [projectId]);

  useEffect(() => {
    // localStorage is client-only; reading it during render would mismatch SSR output.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [reload]);

  // ---- Photo upload -------------------------------------------------------

  async function handleAddFiles(files: File[]) {
    if (!project) return;
    setUploadError(undefined);
    setIsUploading(true);
    const room = MAX_PHOTOS_PER_PROJECT - project.photoIds.length;
    const toProcess = files.slice(0, Math.max(0, room));
    const newIds: string[] = [];
    let skipped = 0;

    for (const file of toProcess) {
      try {
        if (file.size > MAX_ORIGINAL_FILE_SIZE_BYTES) {
          skipped++;
          continue;
        }
        const [exif, dims, dataUrl] = await Promise.all([
          extractExif(file),
          getImageDimensions(file),
          resizeImageToDataUrl(file, STORAGE_MAX_DIMENSION, STORAGE_JPEG_QUALITY),
        ]);
        const blob = await (await fetch(dataUrl)).blob();
        const id = generateId("photo");
        await savePhotoBlob(id, blob);
        const photo: Photo = {
          id,
          projectId: project.id,
          fileName: file.name,
          mimeType: "image/jpeg",
          width: dims.width,
          height: dims.height,
          capturedAt: exif.capturedAt ?? capturedAtFromFileName(file.name),
          latitude: exif.latitude,
          longitude: exif.longitude,
        };
        await savePhotoMeta(photo);
        newIds.push(id);
      } catch {
        skipped++;
      }
    }

    if (newIds.length > 0) {
      const photoIds = sortPhotoIds([...project.photoIds, ...newIds]);
      const range = dateRangeFromPhotoIds(photoIds);
      const updated = updateProject(project.id, {
        photoIds,
        coverPhotoId: project.coverPhotoId ?? photoIds[0],
        startDate: project.startDate || (range.start ? toDateInputValue(range.start) : undefined),
        endDate: project.endDate || (range.end ? toDateInputValue(range.end) : undefined),
        status: "photos-uploaded",
      });
      setProject(updated);
    }
    if (skipped > 0) {
      setUploadError(
        `${skipped}장의 사진을 처리하지 못했어요. 형식이나 크기를 확인해주세요.`,
      );
    }
    setIsUploading(false);
  }

  async function handleRemovePhoto(photoId: string) {
    if (!project) return;
    await deletePhoto(photoId);
    const photoIds = project.photoIds.filter((id) => id !== photoId);
    const updated = updateProject(project.id, {
      photoIds,
      coverPhotoId: project.coverPhotoId === photoId ? photoIds[0] : project.coverPhotoId,
    });
    setProject(updated);
  }

  // ---- Analysis pipeline (Step 1: photo analysis, Step 2: scenes) ---------

  async function handleStartAnalysis() {
    if (!project) return;
    setAnalysisError(undefined);
    setAnalysisStepIndex(0);
    let current = updateProject(project.id, { status: "analyzing" });
    setProject(current);

    try {
      const inputs = await Promise.all(
        current.photoIds.map(async (id) => {
          const meta = getPhotoMeta(id);
          const dataUrl = await getPhotoAnalysisDataUrl(id);
          if (!dataUrl) throw new Error("사진을 불러오지 못했습니다.");
          return {
            id,
            dataUrl,
            knownCapturedAt: meta?.capturedAt,
            knownLocationHint:
              meta?.latitude != null && meta?.longitude != null
                ? `${meta.latitude}, ${meta.longitude}`
                : undefined,
          };
        }),
      );

      setAnalysisStepIndex(1);
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos: inputs }),
      });
      const analyzeJson = await analyzeRes.json();
      if (!analyzeRes.ok) throw new Error(analyzeJson.error ?? "사진 분석에 실패했습니다.");
      const analyses: Record<string, Photo["analysis"]> = analyzeJson.analyses;

      const updatedPhotos: Photo[] = [];
      for (const id of current.photoIds) {
        const meta = getPhotoMeta(id);
        if (!meta) continue;
        const merged: Photo = { ...meta, analysis: analyses[id] };
        await savePhotoMeta(merged);
        updatedPhotos.push(merged);
      }

      setAnalysisStepIndex(2);
      const sceneInputs = updatedPhotos
        .filter((p) => p.analysis)
        .map((p) => ({
          id: p.id,
          capturedAt: p.capturedAt,
          location: p.analysis!.location,
          description: p.analysis!.description,
          tags: p.analysis!.tags,
          mood: p.analysis!.mood,
          importance: p.analysis!.importance,
          sceneCandidates: p.analysis!.sceneCandidates,
        }));

      setAnalysisStepIndex(3);
      const scenesRes = await fetch("/api/scenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos: sceneInputs }),
      });
      const scenesJson = await scenesRes.json();
      if (!scenesRes.ok) throw new Error(scenesJson.error ?? "장면 구성에 실패했습니다.");

      const photoById = new Map(updatedPhotos.map((p) => [p.id, p]));
      const scenesInModelOrder: TravelScene[] = (scenesJson.scenes ?? []).map(
        (raw: {
          title: string;
          summary: string;
          photoIds: string[];
          location?: string;
          startTime?: string;
          endTime?: string;
          confidence?: number;
        }) => {
          // Real EXIF dates are ground truth; prefer them over the AI's own
          // startTime/endTime guess, which it may omit or get wrong.
          const photoIds = [...raw.photoIds].sort((a, b) => {
            const left = effectiveCapturedAt(photoById.get(a)) ?? "";
            const right = effectiveCapturedAt(photoById.get(b)) ?? "";
            return left.localeCompare(right);
          });
          const capturedDates = photoIds
            .map((id) => effectiveCapturedAt(photoById.get(id)))
            .filter((d): d is string => !!d);
          return {
            id: generateId("scene"),
            projectId: current.id,
            title: raw.title,
            summary: raw.summary,
            photoIds,
            location: raw.location ?? undefined,
            startTime: capturedDates[0] ?? raw.startTime ?? undefined,
            endTime: capturedDates[capturedDates.length - 1] ?? raw.endTime ?? undefined,
            confidence: raw.confidence,
          };
        });
      const scenes = [...scenesInModelOrder].sort((a, b) =>
        (a.startTime ?? "").localeCompare(b.startTime ?? ""),
      );

      const rawQuestions: { sceneIndex: number; question: string; options: string[] }[] =
        scenesJson.memoryQuestions ?? [];
      const questions: MemoryQuestion[] = rawQuestions
        .filter((q) => scenesInModelOrder[q.sceneIndex])
        .slice(0, MAX_MEMORY_QUESTIONS)
        .map((q) => ({
          id: generateId("question"),
          sceneId: scenesInModelOrder[q.sceneIndex].id,
          question: q.question,
          options: q.options?.length ? q.options : DEFAULT_MEMORY_QUESTION_OPTIONS,
        }));

      current = saveScenes(current.id, scenes);
      current = saveMemoryQuestions(current.id, questions);
      setProject(current);
      void fetchTitleSuggestions(current, updatedPhotos);
    } catch (error) {
      setAnalysisError(toFriendlyErrorMessage(error));
    }
  }

  /** Best-effort AI title suggestions (spec §7); failures are silent since the title stays editable regardless. */
  async function fetchTitleSuggestions(proj: TravelProject, photos: Photo[]) {
    const locations = Array.from(
      new Set(
        [...proj.scenes.map((s) => s.location), ...photos.map((p) => p.analysis?.location)].filter(
          (v): v is string => !!v,
        ),
      ),
    );
    const moods = Array.from(
      new Set(photos.map((p) => p.analysis?.mood).filter((v): v is string => !!v)),
    );
    try {
      const res = await fetch("/api/suggest-title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locations,
          moods,
          startDate: proj.startDate,
          endDate: proj.endDate,
        }),
      });
      if (!res.ok) return;
      const json: { titles?: string[] } = await res.json();
      setTitleSuggestions(json.titles ?? []);
    } catch {
      // Supplementary only; the user can always type their own title.
    }
  }

  function handleApplyTitleSuggestion(title: string) {
    if (!project) return;
    setProject(updateProject(project.id, { title }));
    setTitleSuggestions([]);
  }

  // ---- Scene review ---------------------------------------------------

  function handleSceneChange(scenes: TravelScene[]) {
    if (!project) return;
    const validSceneIds = new Set(scenes.map((s) => s.id));
    const memoryQuestions = project.memoryQuestions.filter((q) => validSceneIds.has(q.sceneId));
    setProject(updateProject(project.id, { scenes, memoryQuestions }));
  }

  function handleSceneReviewNext() {
    if (!project) return;
    setSceneError(undefined);
    if (project.memoryQuestions.length > 0) {
      setProject(updateProject(project.id, { status: "questions-pending" }));
    } else {
      void handleGenerateStory();
    }
  }

  // ---- Memory questions -------------------------------------------------

  function handleAnswerQuestion(questionId: string, answer: string, isCustomAnswer: boolean) {
    if (!project) return;
    const memoryQuestions = project.memoryQuestions.map((q) =>
      q.id === questionId
        ? { ...q, answer, isCustomAnswer, answeredAt: new Date().toISOString() }
        : q,
    );
    setProject(updateProject(project.id, { memoryQuestions }));
  }

  // ---- Story generation ---------------------------------------------------

  async function handleGenerateStory() {
    if (!project) return;
    setStoryError(undefined);
    setStoryStepIndex(0);
    const current = updateProject(project.id, { status: "generating-story" });
    setProject(current);

    try {
      setStoryStepIndex(1);
      const sceneInputs = current.scenes.map((scene) => {
        const photos = scene.photoIds.map((id) => getPhotoMeta(id)).filter(Boolean) as Photo[];
        const memoryAnswers = current.memoryQuestions
          .filter((q) => q.sceneId === scene.id && q.answer)
          .map((q) => ({
            question: q.question,
            answer: q.answer as string,
            isCustomAnswer: q.isCustomAnswer,
          }));
        return {
          title: scene.title,
          summary: scene.summary,
          location: scene.location,
          startTime: scene.startTime,
          endTime: scene.endTime,
          photoIds: scene.photoIds,
          photoDescriptions: photos.map((p) => p.analysis?.description ?? ""),
          memoryAnswers,
        };
      });

      setStoryStepIndex(2);
      const res = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectTitle: current.title,
          startDate: current.startDate,
          endDate: current.endDate,
          scenes: sceneInputs,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "이야기 생성에 실패했습니다.");

      const raw = json.story as {
        title: string;
        subtitle?: string;
        chapters: { title: string; photoIds: string[]; body: string }[];
      };
      const story: TravelStory = {
        projectId: current.id,
        title: raw.title,
        subtitle: raw.subtitle,
        chapters: raw.chapters.map((c) => ({
          id: generateId("chapter"),
          title: c.title,
          photoIds: c.photoIds,
          body: c.body,
        })),
      };

      setProject(saveStory(current.id, story));
    } catch (error) {
      setStoryError(toFriendlyErrorMessage(error));
    }
  }

  async function handleSaveStory(story: TravelStory) {
    if (!project) return;
    setProject(updateProject(project.id, { story }));
    setEditingStory(false);
  }

  async function handleDeleteProject() {
    await deleteProject(projectId);
    router.push("/");
  }

  // ---- Render ---------------------------------------------------------

  if (project === undefined) {
    return (
      <main className="flex flex-1 items-center justify-center py-24 text-text-tertiary">
        <Loader2 className="animate-spin" />
      </main>
    );
  }

  if (project === null) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-5 py-24 text-center">
        <p className="mb-4 text-headline-card text-charcoal">프로젝트를 찾을 수 없어요.</p>
        <button onClick={() => router.push("/")} className="text-primary underline">
          홈으로 돌아가기
        </button>
      </main>
    );
  }

  const showHeader = !(project.status === "completed" && !editingStory);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">
      {showHeader && <TravelHeader project={project} stepLabel={STEP_LABEL[project.status]} />}

      {(project.status === "draft" || project.status === "photos-uploaded") && (
        <PhotoUploadStep
          photoIds={project.photoIds}
          isProcessing={isUploading}
          error={uploadError}
          onAddFiles={handleAddFiles}
          onRemovePhoto={handleRemovePhoto}
          onNext={handleStartAnalysis}
        />
      )}

      {project.status === "analyzing" && (
        <>
          {analysisError && (
            <div className="mx-auto mb-6 max-w-md">
              <ErrorBanner message={analysisError} onRetry={handleStartAnalysis} />
            </div>
          )}
          <AnalysisProgress
            headline="여행을 살펴보고 있어요"
            steps={ANALYSIS_PROGRESS_STEPS}
            currentStepIndex={analysisStepIndex}
          />
        </>
      )}

      {project.status === "scenes-ready" && (
        <SceneReviewStep
          scenes={project.scenes}
          allProjectPhotoIds={project.photoIds}
          error={sceneError}
          titleSuggestions={titleSuggestions}
          onSelectTitle={handleApplyTitleSuggestion}
          onChange={handleSceneChange}
          onNext={handleSceneReviewNext}
        />
      )}

      {project.status === "questions-pending" && (
        <MemoryQuestionStep
          questions={project.memoryQuestions}
          scenes={project.scenes}
          onAnswer={handleAnswerQuestion}
          onNext={() => void handleGenerateStory()}
        />
      )}

      {project.status === "generating-story" && (
        <>
          {storyError && (
            <div className="mx-auto mb-6 max-w-md">
              <ErrorBanner message={storyError} onRetry={() => void handleGenerateStory()} />
            </div>
          )}
          <AnalysisProgress
            headline="당신의 여행 이야기를 만들고 있어요"
            steps={STORY_PROGRESS_STEPS}
            currentStepIndex={storyStepIndex}
          />
        </>
      )}

      {project.status === "completed" && project.story && (
        storyCardOpen ? (
          <StoryCardGenerator
            project={project}
            onBack={() => setStoryCardOpen(false)}
            onSaved={setProject}
          />
        ) : albumOpen ? (
          <AlbumStudio
            project={project}
            onBack={() => setAlbumOpen(false)}
            onSaved={setProject}
          />
        ) : editingStory ? (
          <StoryEditor
            story={project.story}
            allPhotoIds={project.photoIds}
            locationHint={project.scenes[0]?.location}
            onCancel={() => setEditingStory(false)}
            onSave={handleSaveStory}
            onRegenerate={() => {
              setEditingStory(false);
              void handleGenerateStory();
            }}
            onDeleteProject={handleDeleteProject}
          />
        ) : (
          <StoryViewer
            project={project}
            onEdit={() => setEditingStory(true)}
            onOpenStoryCard={() => setStoryCardOpen(true)}
            onOpenAlbum={() => setAlbumOpen(true)}
          />
        )
      )}
    </main>
  );
}
