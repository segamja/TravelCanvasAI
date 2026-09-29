import { STORY_CARD_THEMES } from "@/lib/storyCardTheme";
import type { StoryCard } from "@/types/storyCard";

interface StoryCardTemplateProps {
  card: StoryCard;
  photoUrl?: string;
}

export default function StoryCardTemplate({ card, photoUrl }: StoryCardTemplateProps) {
  if (card.layout === "cinematic") return <Cinematic card={card} photoUrl={photoUrl} />;
  if (card.layout === "journal") return <Journal card={card} photoUrl={photoUrl} />;
  if (card.layout === "minimal") return <Minimal card={card} photoUrl={photoUrl} />;
  return <Editorial card={card} photoUrl={photoUrl} />;
}

function Photo({ photoUrl, className }: { photoUrl?: string; className?: string }) {
  if (!photoUrl) return <div className={className} style={{ background: "#e7e1d6" }} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={photoUrl} alt="" className={className} />
  );
}

function whenLabel(card: StoryCard): string {
  return [card.dateLabel, card.capturedAtLabel].filter(Boolean).join("  ");
}

function Editorial({ card, photoUrl }: StoryCardTemplateProps) {
  const theme = STORY_CARD_THEMES[card.palette];
  const when = whenLabel(card);
  return (
    <div className="flex h-full w-full flex-col" style={{ background: theme.paper, color: theme.ink }}>
      <div className="relative h-[56%] shrink-0 overflow-hidden">
        <Photo photoUrl={photoUrl} className="h-full w-full object-cover" />
        <div
          className="absolute inset-x-0 bottom-0 h-16"
          style={{ background: `linear-gradient(to top, ${theme.paper}, transparent)` }}
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-[7%] pb-[6%] pt-[1%]">
        <p
          className="font-sans font-semibold uppercase tracking-[0.22em]"
          style={{ color: theme.accent, fontSize: "clamp(10px, 2.5cqw, 13px)" }}
        >
          Travel Story
        </p>
        <h2
          className="mt-[2%] font-display font-bold leading-[1.15]"
          style={{ fontSize: "clamp(22px, 6.6cqw, 34px)" }}
        >
          {card.title}
        </h2>
        <p
          className="mt-[3%] line-clamp-5 font-sans leading-relaxed"
          style={{ color: theme.muted, fontSize: "clamp(12px, 3.15cqw, 16px)" }}
        >
          {card.story}
        </p>
        {card.keywords.length > 0 && (
          <p
            className="mt-[3%] font-sans font-semibold tracking-wide"
            style={{ color: theme.accent, fontSize: "clamp(10px, 2.4cqw, 13px)" }}
          >
            {card.keywords.join("   ·   ")}
          </p>
        )}
        <div className="mt-auto pt-[4%]">
          {card.keyMoment && (
            <p
              className="line-clamp-2 border-l-2 pl-[3%] font-display font-semibold leading-snug"
              style={{ borderColor: theme.accent, fontSize: "clamp(13px, 3.2cqw, 17px)" }}
            >
              {card.keyMoment}
            </p>
          )}
          <div
            className="mt-[4%] flex items-end justify-between gap-3 font-sans"
            style={{ color: theme.muted, fontSize: "clamp(10px, 2.5cqw, 13px)" }}
          >
            <span>{when}</span>
            <span className="text-right" style={{ color: theme.ink }}>
              {card.placeLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Cinematic({ card, photoUrl }: StoryCardTemplateProps) {
  const theme = STORY_CARD_THEMES[card.palette];
  const when = whenLabel(card);
  return (
    <div className="relative h-full w-full overflow-hidden bg-charcoal text-white">
      <Photo photoUrl={photoUrl} className="absolute inset-0 h-full w-full object-cover" />
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to top, ${theme.veil} 0%, rgba(0,0,0,0.25) 42%, transparent 68%)`,
        }}
      />
      <div className="absolute inset-x-0 bottom-0 flex flex-col px-[7%] pb-[7%]">
        <p
          className="font-sans font-semibold uppercase tracking-[0.2em] text-white/80"
          style={{ fontSize: "clamp(10px, 2.5cqw, 13px)" }}
        >
          {card.keywords.length > 0 ? card.keywords.join("   ·   ") : "Travel Story"}
        </p>
        <h2
          className="mt-[2%] font-display font-bold leading-[1.12]"
          style={{ fontSize: "clamp(24px, 7cqw, 36px)" }}
        >
          {card.title}
        </h2>
        <p
          className="mt-[3%] line-clamp-4 font-sans leading-relaxed text-white/90"
          style={{ fontSize: "clamp(12px, 3.15cqw, 16px)" }}
        >
          {card.story}
        </p>
        {card.keyMoment && (
          <p
            className="mt-[4%] line-clamp-2 font-display font-semibold leading-snug text-[#f3e6d4]"
            style={{ fontSize: "clamp(13px, 3.1cqw, 16px)" }}
          >
            {card.keyMoment}
          </p>
        )}
        <div
          className="mt-[4%] flex items-end justify-between gap-3 font-sans text-white/75"
          style={{ fontSize: "clamp(10px, 2.5cqw, 13px)" }}
        >
          <span>{when}</span>
          <span className="text-right text-white">{card.placeLabel}</span>
        </div>
      </div>
    </div>
  );
}

function Journal({ card, photoUrl }: StoryCardTemplateProps) {
  const theme = STORY_CARD_THEMES[card.palette];
  const when = whenLabel(card);
  return (
    <div
      className="flex h-full w-full flex-col px-[8%] py-[7%]"
      style={{ background: theme.paper, color: theme.ink }}
    >
      <p
        className="font-sans font-semibold uppercase tracking-[0.18em]"
        style={{ color: theme.accent, fontSize: "clamp(10px, 2.3cqw, 12px)" }}
      >
        A page from the journey
      </p>
      <h2
        className="mt-[2%] font-display font-bold leading-[1.15]"
        style={{ fontSize: "clamp(22px, 6.2cqw, 32px)" }}
      >
        {card.title}
      </h2>
      <div className="mt-[4%] h-[36%] shrink-0 bg-white p-[2.5%] shadow-[var(--shadow-floating)]">
        <Photo photoUrl={photoUrl} className="h-full w-full object-cover" />
      </div>
      <p
        className="mt-[4%] line-clamp-4 font-sans leading-relaxed"
        style={{ color: theme.muted, fontSize: "clamp(12px, 3cqw, 15px)" }}
      >
        {card.story}
      </p>
      {card.keyMoment && (
        <p
          className="mt-[3%] line-clamp-2 font-display font-semibold leading-snug"
          style={{ fontSize: "clamp(13px, 3.2cqw, 16px)" }}
        >
          {card.keyMoment}
        </p>
      )}
      <div
        className="mt-auto flex items-end justify-between gap-3 pt-[4%] font-sans"
        style={{ color: theme.muted, fontSize: "clamp(10px, 2.4cqw, 13px)" }}
      >
        <span>{when}</span>
        <span className="text-right" style={{ color: theme.ink }}>
          {card.placeLabel}
        </span>
      </div>
    </div>
  );
}

function Minimal({ card, photoUrl }: StoryCardTemplateProps) {
  const theme = STORY_CARD_THEMES[card.palette];
  const when = whenLabel(card);
  return (
    <div className="flex h-full w-full flex-col" style={{ background: theme.paper, color: theme.ink }}>
      <div className="h-[66%] shrink-0 p-[4.5%] pb-0">
        <Photo photoUrl={photoUrl} className="h-full w-full object-cover" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-[7%] pb-[6%] pt-[4%]">
        <p
          className="font-sans font-semibold tracking-wide"
          style={{ color: theme.accent, fontSize: "clamp(10px, 2.4cqw, 13px)" }}
        >
          {card.keywords.length > 0 ? card.keywords.join("   ·   ") : "Travel Story"}
        </p>
        <h2
          className="mt-[2%] font-display font-bold leading-[1.15]"
          style={{ fontSize: "clamp(22px, 6.2cqw, 32px)" }}
        >
          {card.title}
        </h2>
        <p
          className="mt-[3%] line-clamp-3 font-sans leading-relaxed"
          style={{ color: theme.muted, fontSize: "clamp(12px, 3cqw, 15px)" }}
        >
          {card.story}
        </p>
        <div
          className="mt-auto flex items-end justify-between gap-3 pt-[4%] font-sans"
          style={{ color: theme.muted, fontSize: "clamp(10px, 2.4cqw, 13px)" }}
        >
          <span>{when}</span>
          <span className="text-right" style={{ color: theme.ink }}>
            {card.placeLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
