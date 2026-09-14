import { NextRequest, NextResponse } from "next/server";
import { generateStory, type StoryGenerationSceneInput } from "@/services/openai";
import { toFriendlyErrorMessage } from "@/lib/utils";

interface GenerateStoryRequestBody {
  projectTitle: string;
  startDate?: string;
  endDate?: string;
  scenes: StoryGenerationSceneInput[];
}

export async function POST(request: NextRequest) {
  let body: GenerateStoryRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (!Array.isArray(body.scenes) || body.scenes.length === 0) {
    return NextResponse.json({ error: "이야기를 만들 장면이 없습니다." }, { status: 400 });
  }

  try {
    const story = await generateStory(body);
    return NextResponse.json({ story });
  } catch (error) {
    console.error("[/api/generate-story]", error);
    return NextResponse.json({ error: toFriendlyErrorMessage(error) }, { status: 502 });
  }
}
