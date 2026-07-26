"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchDailymotionVideos,
  formatVideoDuration,
  getDailymotionProfileId,
} from "../dailymotion";

export type ArchiveCatalogVideo = {
  id: string;
  videoId: string;
  title: string;
  description: string;
  category: "guncel" | "arsiv";
  categoryLabel: string;
  source: string;
  status: string;
  duration: string;
  year: string;
  accent: "cyan" | "gold" | "blue" | "teal";
  thumbnailUrl: string;
  href: string;
};

const filters = [
  { value: "tumu", label: "Tümü" },
  { value: "guncel", label: "YouTube · Güncel" },
  { value: "arsiv", label: "Dailymotion · Arşiv" },
] as const;

type ArchiveExplorerProps = {
  initialVideos: ArchiveCatalogVideo[];
  dailymotionProfileUrl: string;
};

export function ArchiveExplorer({
  initialVideos,
  dailymotionProfileUrl,
}: ArchiveExplorerProps) {
  const dailymotionProfileId = getDailymotionProfileId(dailymotionProfileUrl);
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]["value"]>("tumu");
  const [query, setQuery] = useState("");
  const [videos, setVideos] = useState(initialVideos);
  const [archiveState, setArchiveState] = useState<"loading" | "ready" | "error">(
    dailymotionProfileId ? "loading" : "error",
  );

  useEffect(() => {
    let cancelled = false;

    if (!dailymotionProfileId) {
      return () => {
        cancelled = true;
      };
    }

    fetchDailymotionVideos(dailymotionProfileId)
      .then((dailymotionVideos) => {
        if (cancelled) return;

        const archiveVideos: ArchiveCatalogVideo[] = dailymotionVideos.map(
          (video) => ({
            id: `dailymotion-${video.id}`,
            videoId: video.id,
            title: video.title,
            description:
              video.description ||
              "Deniz Ünlü'nün Dailymotion arşivindeki Metin2 videosu.",
            category: "arsiv",
            categoryLabel: "Arşiv",
            source: "Dailymotion",
            status: "Yayında",
            duration: formatVideoDuration(video.duration),
            year: new Date(video.created_time * 1000)
              .getUTCFullYear()
              .toString(),
            accent: "teal",
            thumbnailUrl: video.thumbnail_720_url,
            href: `/arsiv/izle?v=${video.id}`,
          }),
        );

        setVideos([...initialVideos, ...archiveVideos]);
        setArchiveState("ready");
      })
      .catch(() => {
        if (!cancelled) setArchiveState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [dailymotionProfileId, initialVideos]);

  const visibleVideos = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");

    return videos.filter((video) => {
      const matchesFilter =
        activeFilter === "tumu" || video.category === activeFilter;
      const searchableText =
        `${video.title} ${video.description} ${video.categoryLabel} ${video.source}`
          .toLocaleLowerCase("tr-TR");

      return matchesFilter && searchableText.includes(normalizedQuery);
    });
  }, [activeFilter, query, videos]);

  return (
    <div className="archive-explorer">
      <div className="archive-controls">
        <div className="archive-filters" aria-label="Arşiv kategorileri">
          {filters.map((filter) => (
            <button
              className={activeFilter === filter.value ? "is-active" : ""}
              type="button"
              onClick={() => setActiveFilter(filter.value)}
              key={filter.value}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <label className="archive-search">
          <span className="sr-only">Arşivde ara</span>
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Arşivde ara..."
          />
        </label>
      </div>

      <div className="archive-results-heading">
        <p>
          <strong>{visibleVideos.length}</strong> içerik gösteriliyor
        </p>
        <span>
          {archiveState === "loading"
            ? "Dailymotion arşivi yükleniyor…"
            : archiveState === "ready"
              ? "YouTube + Dailymotion · En yeniden eskiye"
              : "Dailymotion arşivine geçici olarak ulaşılamıyor"}
        </span>
      </div>

      {visibleVideos.length > 0 ? (
        <div className="archive-catalog">
          {visibleVideos.map((video, index) => {
            const cardContent = (
              <>
                <div
                  className={`archive-card__art archive-card__art--${video.accent}${
                    video.thumbnailUrl ? " archive-card__art--thumbnail" : ""
                  }`}
                  style={
                    video.thumbnailUrl
                      ? { backgroundImage: `url("${video.thumbnailUrl}")` }
                      : undefined
                  }
                >
                  <span className="archive-card__index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="archive-card__source">{video.source}</span>
                  <span className="archive-card__play" aria-hidden="true">
                    {video.href ? "▶" : "⌁"}
                  </span>
                  <span className="archive-card__duration">{video.duration}</span>
                </div>
                <div className="archive-card__body">
                  <div className="archive-card__meta">
                    <span>{video.categoryLabel}</span>
                    <span>{video.year}</span>
                  </div>
                  <h3>{video.title}</h3>
                  <p>{video.description}</p>
                  <div className="archive-card__footer">
                    <span className={video.href ? "is-live" : ""}>
                      <i /> {video.status}
                    </span>
                    <strong>{video.href ? "İzle ↗" : "Yakında"}</strong>
                  </div>
                </div>
              </>
            );

            return video.href ? (
              <a
                className="archive-card"
                href={video.href}
                target={video.href.startsWith("http") ? "_blank" : undefined}
                rel={video.href.startsWith("http") ? "noreferrer" : undefined}
                key={video.id}
              >
                {cardContent}
              </a>
            ) : (
              <article className="archive-card archive-card--pending" key={video.id}>
                {cardContent}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="archive-empty">
          <span aria-hidden="true">⌕</span>
          <h3>Bu aramaya uygun içerik bulunamadı.</h3>
          <p>Farklı bir kelime veya kategori deneyebilirsiniz.</p>
        </div>
      )}
    </div>
  );
}
