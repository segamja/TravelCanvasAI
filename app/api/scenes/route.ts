import { NextRequest, NextResponse } from "next/server";
import { generateScenes, type SceneGenerationPhotoInput } from "@/services/openai";
import { toFriendlyErrorMessage } from "@/lib/utils";

interface ScenesRequestBody {
  photos: SceneGenerationPhotoInput[];
}

export async function POST(request: NextRequest) {
  let body: ScenesRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (!Array.isArray(body.photos) || body.photos.length === 0) {
    return NextResponse.json({ error: "장면을 구성할 사진 분석 결과가 없습니다." }, { status: 400 });
  }

  try {
    const result = await generateScenes(body.photos);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[/api/scenes]", error);
    return NextResponse.json({ error: toFriendlyErrorMessage(error) }, { status: 502 });
  }
}
