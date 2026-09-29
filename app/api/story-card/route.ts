import { NextRequest, NextResponse } from "next/server";
import { composeStoryCard } from "@/services/openai";
import { toFriendlyErrorMessage } from "@/lib/utils";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const facts = body as { chapters?: unknown; photos?: unknown };
  if (!Array.isArray(facts.chapters) || facts.chapters.length === 0) {
    return NextResponse.json({ error: "카드로 만들 스토리가 없습니다." }, { status: 400 });
  }
  if (!Array.isArray(facts.photos) || facts.photos.length === 0) {
    return NextResponse.json({ error: "카드에 쓸 사진이 없습니다." }, { status: 400 });
  }

  try {
    const decision = await composeStoryCard(facts);
    return NextResponse.json({ decision });
  } catch (error) {
    if (error instanceof Error && error.message.includes("OPENAI_API_KEY")) {
      return NextResponse.json(
        { code: "missing_api_key", error: "AI 구성 키를 찾지 못했습니다." },
        { status: 503 },
      );
    }
    console.error("[/api/story-card]", error);
    return NextResponse.json({ error: toFriendlyErrorMessage(error) }, { status: 502 });
  }
}
