import { NextRequest, NextResponse } from "next/server";
import { suggestTravelTitles } from "@/services/openai";
import { toFriendlyErrorMessage } from "@/lib/utils";

interface SuggestTitleRequestBody {
  locations: string[];
  moods: string[];
  startDate?: string;
  endDate?: string;
}

export async function POST(request: NextRequest) {
  let body: SuggestTitleRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  try {
    const titles = await suggestTravelTitles(body);
    return NextResponse.json({ titles });
  } catch (error) {
    console.error("[/api/suggest-title]", error);
    return NextResponse.json({ error: toFriendlyErrorMessage(error) }, { status: 502 });
  }
}
