export interface UnsplashImage {
  id: string;
  description: string | null;
  url: string;
  thumbUrl: string;
  authorName: string;
  authorLink: string;
}

/**
 * Searches Unsplash for supplementary images only (spec §17: user photos are
 * always the primary content, Unsplash results are supporting material).
 */
/** One landscape photo for the app background. Not a substitute for the user's travel photos. */
export async function getRandomUnsplashPhoto(query: string): Promise<UnsplashImage> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    throw new Error("UNSPLASH_ACCESS_KEY가 설정되어 있지 않습니다.");
  }

  const url = new URL("https://api.unsplash.com/photos/random");
  url.searchParams.set("query", query);
  url.searchParams.set("orientation", "landscape");

  const response = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${accessKey}`,
      "Accept-Version": "v1",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Unsplash API 요청이 실패했습니다 (${response.status}).`);
  }

  const photo = (await response.json()) as {
    id: string;
    description: string | null;
    alt_description: string | null;
    urls: { regular: string; thumb: string };
    user: { name: string; links: { html: string } };
  };

  return {
    id: photo.id,
    description: photo.description ?? photo.alt_description,
    url: photo.urls.regular,
    thumbUrl: photo.urls.thumb,
    authorName: photo.user.name,
    authorLink: withUnsplashReferral(photo.user.links.html),
  };
}

function withUnsplashReferral(link: string): string {
  const url = new URL(link);
  url.searchParams.set("utm_source", "travelcanvasai");
  url.searchParams.set("utm_medium", "referral");
  return url.toString();
}

export async function searchUnsplashPhotos(
  query: string,
  perPage = 6,
): Promise<UnsplashImage[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    throw new Error("UNSPLASH_ACCESS_KEY가 설정되어 있지 않습니다.");
  }

  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("orientation", "landscape");

  const response = await fetch(url, {
    headers: { Authorization: `Client-ID ${accessKey}` },
  });

  if (!response.ok) {
    throw new Error(`Unsplash API 요청이 실패했습니다 (${response.status}).`);
  }

  const data = await response.json();
  const results: unknown[] = Array.isArray(data?.results) ? data.results : [];

  return results.map((item) => {
    const photo = item as {
      id: string;
      description: string | null;
      alt_description: string | null;
      urls: { regular: string; thumb: string };
      user: { name: string; links: { html: string } };
    };
    return {
      id: photo.id,
      description: photo.description ?? photo.alt_description,
      url: photo.urls.regular,
      thumbUrl: photo.urls.thumb,
      authorName: photo.user.name,
      authorLink: photo.user.links.html,
    };
  });
}
