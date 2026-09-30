import { ALBUM_THEMES } from "@/lib/albumTheme";
import { albumPhotoRows, albumRowWeight, isLandscapePhoto, photoAspect } from "@/lib/albumPhotoRows";
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
  const frame = theme.frame;
  const kicker = page.kind === "cover" ? "Photobook" : page.kind === "closing" ? "The end" : page.dateLabel;
  const rows = albumPhotoRows(page.photoIds, (id) => isLandscapePhoto(getPhotoMeta(id)));
  const weights = rows.map((ids) => albumRowWeight(ids, (id) => photoAspect(getPhotoMeta(id))));

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
        <div
          className="mt-[4%] grid min-h-0 flex-1 gap-[4%]"
          style={{ gridTemplateRows: weights.map((weight) => `${weight}fr`).join(" ") }}
        >
          {rows.map((ids) => (
            <div
              key={ids.join("-")}
              className={`grid min-h-0 gap-[4%] ${ids.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
            >
              {ids.map((id) => (
                <figure key={id} className="flex min-h-0 flex-col">
                  <div
                    className="min-h-0 flex-1"
                    style={{
                      border:
                        frame.border > 0
                          ? `calc(${frame.border} * 100cqw / 1080) solid ${frame.borderColor}`
                          : undefined,
                      boxShadow: frame.shadowCss,
                      background: frame.borderColor,
                    }}
                  >
                    {photoUrls[id] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photoUrls[id]} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full" style={{ background: theme.line }} />
                    )}
                  </div>
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
