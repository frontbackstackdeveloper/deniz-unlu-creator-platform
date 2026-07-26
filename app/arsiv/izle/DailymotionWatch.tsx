"use client";

import { useEffect, useState } from "react";
import {
  formatVideoDuration,
  getDailymotionVideo,
  type DailymotionVideo,
} from "../../dailymotion";
import { ArrowIcon } from "../../components/SiteChrome";

type DailymotionWatchProps = {
  videoId: string;
};

export function DailymotionWatch({ videoId }: DailymotionWatchProps) {
  const [video, setVideo] = useState<DailymotionVideo | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getDailymotionVideo(videoId)
      .then((result) => {
        if (cancelled) return;
        if (result) {
          setVideo(result);
        } else {
          setFailed(true);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [videoId]);

  const embedUrl = `https://geo.dailymotion.com/player.html?video=${videoId}`;
  const externalUrl = `https://www.dailymotion.com/video/${videoId}`;

  return (
    <div className="watch-layout">
      <div className="watch-player">
        <iframe
          src={embedUrl}
          title={video?.title ?? "Deniz Ünlü arşiv videosu"}
          allow="autoplay; fullscreen; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>

      <aside className="watch-info">
        <span className="watch-status"><i /> ARŞİVDE</span>
        <p className="section-kicker">DAILYMOTION ARŞİVİ</p>
        <h1>
          {video?.title ??
            (failed ? "Deniz Ünlü arşiv videosu" : "Video bilgisi yükleniyor…")}
        </h1>
        <p>
          {video?.description ||
            (failed
              ? "Video oynatıcı üzerinden izlenebilir."
              : "Deniz Ünlü'nün Dailymotion arşivi hazırlanıyor.")}
        </p>
        <div className="watch-facts">
          <span>
            <small>SÜRE</small>
            <strong>{video ? formatVideoDuration(video.duration) : "—"}</strong>
          </span>
          <span>
            <small>KAYNAK</small>
            <strong>Dailymotion</strong>
          </span>
        </div>
        <a
          className="button button--ghost"
          href={video?.url ?? externalUrl}
          target="_blank"
          rel="noreferrer"
        >
          Dailymotion&apos;da aç <ArrowIcon />
        </a>
      </aside>
    </div>
  );
}
