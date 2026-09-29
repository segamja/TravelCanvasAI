import StoryCardTemplate from "@/components/story-card/StoryCardTemplate";
import type { StoryCard } from "@/types/storyCard";

interface StoryCardRendererProps {
  card: StoryCard;
  photoUrl?: string;
}

/** On-screen card. The downloadable PNG is drawn from the same card data. */
export default function StoryCardRenderer({ card, photoUrl }: StoryCardRendererProps) {
  return (
    <div
      className="aspect-[3/4] w-full overflow-hidden shadow-[var(--shadow-floating)]"
      style={{ containerType: "inline-size" }}
    >
      <StoryCardTemplate card={card} photoUrl={photoUrl} />
    </div>
  );
}
