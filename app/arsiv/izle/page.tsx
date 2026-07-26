import type { Metadata } from "next";
import {
  BotanicalBackground,
  SiteFooter,
  SiteHeader,
} from "../../components/SiteChrome";
import { isDailymotionVideoId } from "../../dailymotion";
import { DailymotionWatch } from "./DailymotionWatch";

export const metadata: Metadata = {
  title: "Arşiv Videosu",
  description: "Deniz Ünlü Dailymotion video arşivi.",
};

type ArchiveVideoPageProps = {
  searchParams: Promise<{ v?: string | string[] }>;
};

export default async function ArchiveVideoPage({
  searchParams,
}: ArchiveVideoPageProps) {
  const requestedId = (await searchParams).v;
  const videoId = Array.isArray(requestedId) ? requestedId[0] : requestedId;

  if (!videoId || !isDailymotionVideoId(videoId)) {
    return (
      <main>
        <BotanicalBackground />
        <SiteHeader />
        <section className="watch-page shell">
          <a className="page-back" href="/arsiv">← Tüm arşiv</a>
          <div className="archive-empty">
            <h1>Video seçilemedi.</h1>
            <p>Arşiv sayfasından izlemek istediğiniz videoyu seçebilirsiniz.</p>
          </div>
        </section>
        <SiteFooter />
      </main>
    );
  }

  return (
    <main>
      <BotanicalBackground />
      <SiteHeader />

      <section className="watch-page shell">
        <a className="page-back" href="/arsiv">← Tüm arşiv</a>

        <DailymotionWatch videoId={videoId} />
      </section>
      <SiteFooter />
    </main>
  );
}
