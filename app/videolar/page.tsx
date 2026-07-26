import type { Metadata } from "next";
import {
  ArrowIcon,
  BotanicalBackground,
  PageHero,
  SiteFooter,
  SiteHeader,
  VideoCard,
} from "../components/SiteChrome";
import { getPublicManagedContent } from "../../db/content-store";
import { managedLinksToMap } from "../managed-content";
import { getCurrentYouTubeVideos } from "../youtube";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Güncel Videolar",
  description: "Deniz Ünlü'nün güncel Metin2 videoları ve aktif YouTube kanalı.",
};

export default async function VideosPage() {
  const links = managedLinksToMap((await getPublicManagedContent()).links);
  const videos = await getCurrentYouTubeVideos(links.youtube, 15);

  return (
    <main>
      <BotanicalBackground />
      <SiteHeader />
      <PageHero
        kicker="GÜNCEL İÇERİKLER"
        title="Videolar"
        description="Yeni Metin2 videolarını buradan görüntüleyebilir, aktif YouTube kanalına doğrudan ulaşabilirsiniz."
      />

      <section className="page-content shell">
        <div className="page-toolbar">
          <div className="filter-pills" aria-label="Video filtreleri">
            <span className="filter-pill filter-pill--active">Tümü</span>
            <span className="filter-pill">Güncel videolar</span>
            <a className="filter-pill" href="/arsiv">Arşiv</a>
          </div>
          {links.youtube && (
            <a
              className="button button--ghost"
              href={links.youtube}
              target="_blank"
              rel="noreferrer"
            >
              YouTube kanalını aç <ArrowIcon />
            </a>
          )}
        </div>

        <div className="video-grid video-grid--page">
          {videos.map((video) => (
            <VideoCard video={video} key={video.id} />
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
