import { NextRequest, NextResponse } from "next/server";
import { searchUnsplashPhotos } from "@/services/unsplash";
import { toFriendlyErrorMessage } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query) {
    return NextResponse.json({ error: "검색어가 필요합니다." }, { status: 400 });
  }

  try {
    const images = await searchUnsplashPhotos(query);
    return NextResponse.json({ images });
  } catch (error) {
    console.error("[/api/unsplash]", error);
    return NextResponse.json({ error: toFriendlyErrorMessage(error) }, { status: 502 });
  }
}
