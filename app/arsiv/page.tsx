import type { Metadata } from "next";
import {
  BotanicalBackground,
  PageHero,
  SiteFooter,
  SiteHeader,
} from "../components/SiteChrome";
import { getPublicManagedContent } from "../../db/content-store";
import { managedLinksToMap } from "../managed-content";
import {
  formatYouTubePublishedDate,
  getCurrentYouTubeVideos,
} from "../youtube";
import {
  ArchiveExplorer,
  type ArchiveCatalogVideo,
} from "./ArchiveExplorer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Video Arşivi",
  description:
    "Deniz Ünlü'nün güncel videoları, eski yayınları ve erişime kapanan kendi kayıtları.",
};

export default async function ArchivePage() {
  const links = managedLinksToMap((await getPublicManagedContent()).links);
  const currentVideos = await getCurrentYouTubeVideos(links.youtube, 15);
  const youtubeVideos: ArchiveCatalogVideo[] = currentVideos.map((video) => ({
    id: `archive-${video.videoId}`,
    videoId: video.videoId,
    title: video.title,
    description: "Aktif YouTube kanalındaki güncel Metin2 videosu.",
    category: "guncel",
    categoryLabel: "Güncel",
    source: "YouTube",
    status: "Yayında",
    duration:
      video.duration ?? formatYouTubePublishedDate(video.publishedAt),
    year: video.publishedAt
      ? new Date(video.publishedAt).getUTCFullYear().toString()
      : new Date().getUTCFullYear().toString(),
    accent: video.accent,
    thumbnailUrl: video.thumbnailUrl,
    href: video.href,
  }));

  return (
    <main>
      <BotanicalBackground />
      <SiteHeader />
      <PageHero
        kicker="DENİZ ÜNLÜ ARŞİVİ"
        title="Güncel ve arşiv videoları, tek yerde."
        description="Aktif YouTube kanalındaki güncel videolar ve Dailymotion'a yüklenen arşiv kayıtları burada bir araya geliyor."
      />

      <section className="page-content shell">
        <ArchiveExplorer
          initialVideos={youtubeVideos}
          dailymotionProfileUrl={links.dailymotion}
        />
      </section>
      <SiteFooter />
    </main>
  );
}
