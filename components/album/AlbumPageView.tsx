import { ALBUM_THEMES } from "@/lib/albumTheme";
import { effectiveCapturedAt, formatPhotoTime } from "@/lib/photoDates";
import { getPhotoMeta } from "@/storage/photoStorage";
import type { AlbumLayout, AlbumPage } from "@/types/album";

interface AlbumPageViewProps {
  page: AlbumPage;
  layout: AlbumLayout;
  photoUrls: Record<string, string>;
  backgroundUrl?: string;
  authorName?: string;
}

export default function AlbumPageView({
  page,
  layout,
  photoUrls,
  backgroundUrl,
  authorName,
}: AlbumPageViewProps) {
  const theme = ALBUM_THEMES[layout];
  const kicker = page.kind === "cover" ? "Photobook" : page.kind === "closing" ? "The end" : page.dateLabel;

  return (
    <article
      className="relative aspect-[3/4] w-full overflow-hidden shadow-[var(--shadow-floating)]"
      style={{ background: theme.paper, color: theme.ink, containerType: "inline-size" }}
    >
      {backgroundUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={backgroundUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
      )}
      <div className="absolute inset-0" style={{ background: `${theme.paper}cc` }} />
      <div className="relative flex h-full flex-col px-[7%] py-[7%]">
        <p
          className="font-sans font-semibold uppercase tracking-[0.18em]"
          style={{ color: theme.accent, fontSize: "clamp(10px, 2.5cqw, 13px)" }}
        >
          {kicker}
        </p>
        <h2
          className="mt-[2%] font-display font-bold leading-tight"
          style={{ fontSize: "clamp(22px, 6.4cqw, 34px)" }}
        >
          {page.title}
        </h2>
        {page.placeLabel && (
          <p className="mt-[1%] font-sans" style={{ color: theme.muted, fontSize: "clamp(11px, 2.6cqw, 14px)" }}>
            {page.placeLabel}
          </p>
        )}
        <div className={`mt-[4%] grid min-h-0 flex-1 gap-[2%] ${page.photoIds.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
          {page.photoIds.map((id) => (
            <figure key={id} className="flex min-h-0 flex-col">
              {photoUrls[id] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrls[id]} alt="" className="min-h-0 flex-1 w-full object-cover" />
              ) : (
                <div className="min-h-0 flex-1" style={{ background: theme.line }} />
              )}
              {formatPhotoTime(effectiveCapturedAt(getPhotoMeta(id))) && (
                <figcaption
                  className="pt-[2%] font-sans"
                  style={{ color: theme.muted, fontSize: "clamp(10px, 2.3cqw, 12px)" }}
                >
                  {formatPhotoTime(effectiveCapturedAt(getPhotoMeta(id)))}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
        {page.body && (
          <p
            className="mt-[4%] line-clamp-4 font-sans leading-relaxed"
            style={{ fontSize: "clamp(12px, 3cqw, 16px)" }}
          >
            {page.body}
          </p>
        )}
        {authorName && (
          <p className="mt-[3%] font-sans" style={{ color: theme.muted, fontSize: "clamp(9px, 2.1cqw, 11px)" }}>
            Background photo by {authorName} on Unsplash
          </p>
        )}
      </div>
    </article>
  );
}
