"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowIcon,
  VideoCard,
} from "../components/SiteChrome";
import type { CurrentVideo } from "../youtube";

type VideoFilter = "tumu" | "guncel";

export function VideoExplorer({
  videos,
  youtubeUrl,
}: {
  videos: CurrentVideo[];
  youtubeUrl: string;
}) {
  const [activeFilter, setActiveFilter] = useState<VideoFilter>("tumu");
  const visibleVideos = useMemo(
    () => (activeFilter === "guncel" ? videos.slice(0, 4) : videos),
    [activeFilter, videos],
  );

  return (
    <>
      <div className="page-toolbar">
        <div className="filter-pills" aria-label="Video filtreleri">
          <button
            className={`filter-pill${activeFilter === "tumu" ? " filter-pill--active" : ""}`}
            type="button"
            aria-pressed={activeFilter === "tumu"}
            onClick={() => setActiveFilter("tumu")}
          >
            Tümü
          </button>
          <button
            className={`filter-pill${activeFilter === "guncel" ? " filter-pill--active" : ""}`}
            type="button"
            aria-pressed={activeFilter === "guncel"}
            onClick={() => setActiveFilter("guncel")}
          >
            Güncel videolar
          </button>
          <Link className="filter-pill" href="/arsiv" prefetch={false}>
            Arşiv
          </Link>
        </div>

        {youtubeUrl && (
          <a
            className="button button--ghost"
            href={youtubeUrl}
            target="_blank"
            rel="noreferrer"
          >
            YouTube kanalını aç <ArrowIcon />
          </a>
        )}
      </div>

      <div
        className="video-grid video-grid--page"
        id="video-listesi"
        aria-live="polite"
      >
        {visibleVideos.map((video) => (
          <VideoCard video={video} key={video.id} />
        ))}
      </div>
    </>
  );
}
