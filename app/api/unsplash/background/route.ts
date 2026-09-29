import { NextResponse } from "next/server";
import { getCurrentSeasonQuery, toFriendlyErrorMessage } from "@/lib/utils";
import { getRandomUnsplashPhoto } from "@/services/unsplash";

/** Seasonal backdrop for the app shell. The key stays on the server. */
export async function GET() {
  const { query } = getCurrentSeasonQuery();
  try {
    const image = await getRandomUnsplashPhoto(query);
    return NextResponse.json({ image });
  } catch (error) {
    console.error("[/api/unsplash/background]", error);
    return NextResponse.json({ error: toFriendlyErrorMessage(error) }, { status: 502 });
  }
}
