import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import UnsplashBackground from "@/components/layout/UnsplashBackground";
import VersionBadge from "@/components/layout/VersionBadge";
import VersionWatcher from "@/components/layout/VersionWatcher";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TravelCanvasAI",
  description:
    "여행 사진을 업로드하면 AI가 사진 속 여행을 이해하고, 흩어진 기억을 하나의 아름다운 여행 이야기로 만들어주는 웹앱",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans text-body-default text-on-surface">
        <UnsplashBackground />
        <VersionWatcher />
        <VersionBadge />
        <Header />
        <div className="flex-1 flex flex-col">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
