import { albumPhotoCaption } from "@/lib/buildAlbum";
import { ALBUM_THEMES } from "@/lib/albumTheme";
import { isLandscapePhoto, measureAlbumBlock, photoAspect } from "@/lib/albumLayout";
import { getPhotoMeta } from "@/storage/photoStorage";
import type { AlbumLayout, AlbumPage } from "@/types/album";

interface AlbumPageViewProps {
  page: AlbumPage;
  layout: AlbumLayout;
  photoUrls: Record<string, string>;
  photoPlaces?: Record<string, string>;
  backgroundUrl?: string;
  authorName?: string;
}

export default function AlbumPageView({
  page,
  layout,
  photoUrls,
  photoPlaces = {},
  backgroundUrl,
  authorName,
}: AlbumPageViewProps) {
  const theme = ALBUM_THEMES[layout];
  const frame = theme.frame;
  const kicker = page.kind === "cover" ? "Photobook" : page.kind === "closing" ? "The end" : page.dateLabel;
  const captionFor = (id: string) => albumPhotoCaption(id, page.placeLabel, photoPlaces);
  const block = measureAlbumBlock(
    page.photoIds,
    (id) => photoAspect(getPhotoMeta(id)),
    (id) => isLandscapePhoto(getPhotoMeta(id)),
    (id) => captionFor(id).length > 0,
  );

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
        <div className="relative mt-[4%] min-h-0 flex-1" style={{ containerType: "size" }}>
          {block.photos.length > 0 && (
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{
                width: `min(100cqw, calc(100cqh * ${block.width} / ${block.height}))`,
                aspectRatio: `${block.width} / ${block.height}`,
              }}
            >
              {block.photos.map((photo) => (
                <figure
                  key={photo.id}
                  className="absolute"
                  style={{
                    left: `${(photo.x / block.width) * 100}%`,
                    top: `${(photo.y / block.height) * 100}%`,
                    width: `${(photo.w / block.width) * 100}%`,
                    height: `${(photo.h / block.height) * 100}%`,
                  }}
                >
                  <div
                    className="h-full w-full"
                    style={{
                      border:
                        frame.border > 0
                          ? `calc(${frame.border} * 100cqi / 1080) solid ${frame.borderColor}`
                          : undefined,
                      boxShadow: frame.shadowCss,
                      background: frame.borderColor,
                    }}
                  >
                    {photoUrls[photo.id] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photoUrls[photo.id]} alt="" className="h-full w-full object-contain" />
                    ) : (
                      <div className="h-full w-full" style={{ background: theme.line }} />
                    )}
                  </div>
                  {captionFor(photo.id) && (
                    <figcaption
                      className="absolute left-0 top-full w-full truncate pt-[1%] font-sans"
                      style={{ color: theme.muted, fontSize: "clamp(10px, 2.3cqi, 12px)" }}
                    >
                      {captionFor(photo.id)}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          )}
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
