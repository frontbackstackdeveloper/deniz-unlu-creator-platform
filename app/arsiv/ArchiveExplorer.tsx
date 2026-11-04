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
  publishedAt: number;
};

const PAGE_SIZE = 20;

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
  const [page, setPage] = useState(1);
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

    const loadArchive = () => fetchDailymotionVideos(dailymotionProfileId)
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
            publishedAt: video.created_time * 1000,
          }),
        );

        setVideos([...initialVideos, ...archiveVideos]);
        setArchiveState("ready");
      })
      .catch(() => {
        if (!cancelled) setArchiveState("error");
      });

    void loadArchive();
    const refresh = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadArchive();
    }, 5 * 60 * 1000 + 5000);

    return () => {
      cancelled = true;
      window.clearInterval(refresh);
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
    }).sort((a, b) => b.publishedAt - a.publishedAt || a.id.localeCompare(b.id));
  }, [activeFilter, query, videos]);

  const pageCount = Math.max(1, Math.ceil(visibleVideos.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageVideos = visibleVideos.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pageNumbers = [...new Set([1, currentPage - 1, currentPage, currentPage + 1, pageCount])]
    .filter((number) => number >= 1 && number <= pageCount)
    .sort((a, b) => a - b);

  function moveToPage(nextPage: number) {
    setPage(nextPage);
    document.getElementById("archive-results")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  }

  return (
    <div className="archive-explorer">
      <div className="archive-controls">
        <div className="archive-filters" aria-label="Arşiv kategorileri">
          {filters.map((filter) => (
            <button
              className={activeFilter === filter.value ? "is-active" : ""}
              type="button"
              onClick={() => { setActiveFilter(filter.value); setPage(1); }}
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
            onChange={(event) => { setQuery(event.target.value); setPage(1); }}
            placeholder="Arşivde ara..."
          />
        </label>
      </div>

      <div className="archive-results-heading" id="archive-results">
        <p>
          <strong>{visibleVideos.length}</strong> içerik · {currentPage}/{pageCount}. sayfa
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
          {pageVideos.map((video, index) => {
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
                    {String((currentPage - 1) * PAGE_SIZE + index + 1).padStart(2, "0")}
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
      {pageCount > 1 && (
        <nav className="archive-pagination" aria-label="Arşiv sayfaları">
          <button type="button" disabled={currentPage === 1} onClick={() => moveToPage(currentPage - 1)}>← Önceki</button>
          {pageNumbers.map((number, index) => (
            <span key={number}>
              {index > 0 && number - pageNumbers[index - 1] > 1 && <span className="archive-pagination__gap" aria-hidden="true">…</span>}
              <button
                type="button"
                aria-label={`${number}. sayfa`}
                aria-current={currentPage === number ? "page" : undefined}
                onClick={() => moveToPage(number)}
              >{number}</button>
            </span>
          ))}
          <button type="button" disabled={currentPage === pageCount} onClick={() => moveToPage(currentPage + 1)}>Sonraki →</button>
        </nav>
      )}
    </div>
  );
}
