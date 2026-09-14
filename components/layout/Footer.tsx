export default function Footer() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION;
  return (
    <footer className="border-t border-border-subdued px-5 py-4 text-center text-caption-meta text-text-tertiary">
      TravelCanvas.ai{version ? ` · v${version}` : ""}
    </footer>
  );
}
