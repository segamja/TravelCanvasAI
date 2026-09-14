import { NextRequest, NextResponse } from "next/server";
import { analyzePhotos, type AnalyzePhotoInput } from "@/services/openai";
import { MAX_PHOTOS_PER_PROJECT } from "@/lib/constants";
import { toFriendlyErrorMessage } from "@/lib/utils";
import type { PhotoAnalysis } from "@/types/photo";

interface AnalyzeRequestBody {
  photos: AnalyzePhotoInput[];
}

export async function POST(request: NextRequest) {
  let body: AnalyzeRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (!Array.isArray(body.photos) || body.photos.length === 0) {
    return NextResponse.json({ error: "분석할 사진이 없습니다." }, { status: 400 });
  }
  if (body.photos.length > MAX_PHOTOS_PER_PROJECT) {
    return NextResponse.json(
      { error: `사진은 최대 ${MAX_PHOTOS_PER_PROJECT}장까지 분석할 수 있습니다.` },
      { status: 400 },
    );
  }

  try {
    const results = await analyzePhotos(body.photos);
    const analyses: Record<string, PhotoAnalysis> = {};
    for (const [photoId, raw] of results.entries()) {
      analyses[photoId] = {
        description: raw.description,
        location: raw.location ?? undefined,
        tags: raw.tags ?? [],
        objects: raw.objects,
        peopleDetected: raw.peopleDetected,
        mood: raw.mood,
        importance: raw.importance ?? 0.5,
        sceneCandidates: raw.sceneCandidates,
        confidence: raw.confidence,
      };
    }
    return NextResponse.json({ analyses });
  } catch (error) {
    console.error("[/api/analyze]", error);
    return NextResponse.json({ error: toFriendlyErrorMessage(error) }, { status: 502 });
  }
}
