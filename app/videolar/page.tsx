import type { Metadata } from "next";
import {
  BotanicalBackground,
  PageHero,
  SiteFooter,
  SiteHeader,
} from "../components/SiteChrome";
import { getPublicManagedContent } from "../../db/content-store";
import { managedLinksToMap } from "../managed-content";
import { getCurrentYouTubeVideos } from "../youtube";
import { VideoExplorer } from "./VideoExplorer";

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
        <VideoExplorer videos={videos} youtubeUrl={links.youtube} />
      </section>
      <SiteFooter />
    </main>
  );
}
