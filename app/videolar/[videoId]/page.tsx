import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowIcon,
  BotanicalBackground,
  SiteFooter,
  SiteHeader,
} from "../../components/SiteChrome";
import { getPublicManagedContent } from "../../../db/content-store";
import { managedLinksToMap } from "../../managed-content";
import {
  formatYouTubePublishedDate,
  getCurrentYouTubeVideos,
} from "../../youtube";

export const dynamic = "force-dynamic";

type VideoPageProps = {
  params: Promise<{ videoId: string }>;
};

async function getVideo(videoId: string) {
  const links = managedLinksToMap((await getPublicManagedContent()).links);
  const videos = await getCurrentYouTubeVideos(links.youtube, 15);
  return videos.find((video) => video.videoId === videoId);
}

export async function generateMetadata({
  params,
}: VideoPageProps): Promise<Metadata> {
  const { videoId } = await params;
  const video = await getVideo(videoId);

  return {
    title: video?.title ?? "Video",
    description: video
      ? `${video.title} — Deniz Ünlü güncel Metin2 videosu.`
      : "Deniz Ünlü videosu.",
  };
}

export default async function VideoPage({ params }: VideoPageProps) {
  const { videoId } = await params;
  const video = await getVideo(videoId);

  if (!video) notFound();

  return (
    <main>
      <BotanicalBackground />
      <SiteHeader />

      <section className="watch-page shell">
        <Link className="page-back" href="/videolar">← Tüm videolar</Link>

        <div className="watch-layout">
          <div className="watch-player">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${video.videoId}?rel=0`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          <aside className="watch-info">
            <span className="watch-status"><i /> YAYINDA</span>
            <p className="section-kicker">GÜNCEL VİDEO</p>
            <h1>{video.title}</h1>
            <p>
              Deniz Ünlü&apos;nün güncel Metin2 videosu. Keyifli seyirler.
            </p>
            <div className="watch-facts">
              <span>
                <small>{video.duration ? "SÜRE" : "YAYIN TARİHİ"}</small>
                <strong>
                  {video.duration ??
                    formatYouTubePublishedDate(video.publishedAt)}
                </strong>
              </span>
              <span>
                <small>KAYNAK</small>
                <strong>YouTube</strong>
              </span>
            </div>
            <a
              className="button button--ghost"
              href={`https://www.youtube.com/watch?v=${video.videoId}`}
              target="_blank"
              rel="noreferrer"
            >
              YouTube&apos;da aç <ArrowIcon />
            </a>
          </aside>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
