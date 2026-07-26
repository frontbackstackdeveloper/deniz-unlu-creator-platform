import { siteContent } from "./content";

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
]);
const CHANNEL_ID_PATTERN = /^UC[A-Za-z0-9_-]{22}$/;
const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const VIDEO_CACHE_MS = 5 * 60 * 1000;
const YOUTUBE_FETCH_LIMIT = 15;

export type CurrentVideo = {
  id: string;
  videoId: string;
  index: string;
  tag: string;
  title: string;
  duration?: string;
  publishedAt?: string;
  accent: "blue" | "gold" | "cyan";
  thumbnailUrl: string;
  href: string;
};

type VideoCacheEntry = {
  expiresAt: number;
  videos: CurrentVideo[];
};

const videoCache = new Map<string, VideoCacheEntry>();
const channelIdCache = new Map<string, string>();
const pendingRequests = new Map<string, Promise<CurrentVideo[]>>();

function fallbackVideos(limit: number): CurrentVideo[] {
  return siteContent.videos.slice(0, limit).map((video) => ({ ...video }));
}

function normalizeChannelUrl(value: string) {
  const raw = value.trim();
  if (!raw) return null;

  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    const hostname = url.hostname.toLocaleLowerCase("en-US");
    if (url.protocol !== "https:" || !YOUTUBE_HOSTS.has(hostname)) return null;
    return url;
  } catch {
    return null;
  }
}

export function isYouTubeChannelUrl(value: string) {
  const url = normalizeChannelUrl(value);
  if (!url) return false;

  const path = decodeURIComponent(url.pathname);
  return /^\/(?:@[^/]+|channel\/UC[A-Za-z0-9_-]{22}|user\/[^/]+|c\/[^/]+)(?:\/|$)/i.test(
    path,
  );
}

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 10)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}

function tagValue(entry: string, tagName: string) {
  const match = entry.match(
    new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "i"),
  );
  return match ? decodeXml(match[1]) : "";
}

async function resolveChannelId(channelUrl: URL) {
  const cacheKey = channelUrl.toString();
  const cached = channelIdCache.get(cacheKey);
  if (cached) return cached;

  const directMatch = decodeURIComponent(channelUrl.pathname).match(
    /^\/channel\/(UC[A-Za-z0-9_-]{22})(?:\/|$)/i,
  );
  if (directMatch && CHANNEL_ID_PATTERN.test(directMatch[1])) {
    channelIdCache.set(cacheKey, directMatch[1]);
    return directMatch[1];
  }

  const response = await fetch(channelUrl, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent":
        "Mozilla/5.0 (compatible; DenizUnluVideoSync/1.0; +https://denizunlu.com)",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error("YouTube kanalı çözümlenemedi.");

  const html = await response.text();
  const channelId =
    html.match(
      /feeds\/videos\.xml\?channel_id=(UC[A-Za-z0-9_-]{22})/i,
    )?.[1] ??
    html.match(/"externalId":"(UC[A-Za-z0-9_-]{22})"/i)?.[1] ??
    html.match(/"browseId":"(UC[A-Za-z0-9_-]{22})"/i)?.[1] ??
    "";

  if (!CHANNEL_ID_PATTERN.test(channelId)) {
    throw new Error("YouTube kanal kimliği bulunamadı.");
  }

  channelIdCache.set(cacheKey, channelId);
  return channelId;
}

function parseYouTubeFeed(xml: string, limit: number): CurrentVideo[] {
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/gi) ?? [];
  const accents: CurrentVideo["accent"][] = ["blue", "gold", "cyan"];

  return entries
    .slice(0, limit)
    .map((entry, index): CurrentVideo | null => {
      const videoId = tagValue(entry, "yt:videoId");
      const title = tagValue(entry, "title");
      const publishedAt = tagValue(entry, "published");
      const thumbnail =
        entry.match(/<media:thumbnail[^>]+url="([^"]+)"/i)?.[1] ?? "";

      if (!VIDEO_ID_PATTERN.test(videoId) || !title) return null;

      return {
        id: `youtube-${videoId}`,
        videoId,
        index: String(index + 1).padStart(2, "0"),
        tag: "GÜNCEL VİDEO",
        title,
        publishedAt,
        accent: accents[index % accents.length],
        thumbnailUrl:
          decodeXml(thumbnail) ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        href: `/videolar/${videoId}`,
      };
    })
    .filter((video): video is CurrentVideo => Boolean(video));
}

async function fetchYouTubeVideos(channelUrl: URL, limit: number) {
  const channelId = await resolveChannelId(channelUrl);
  const response = await fetch(
    `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`,
    {
      headers: { Accept: "application/atom+xml,application/xml,text/xml" },
      signal: AbortSignal.timeout(8_000),
    },
  );
  if (!response.ok) throw new Error("YouTube video akışı alınamadı.");

  const videos = parseYouTubeFeed(await response.text(), limit);
  if (videos.length === 0) throw new Error("YouTube kanalında video bulunamadı.");
  return videos;
}

export async function getCurrentYouTubeVideos(
  channelUrl: string,
  limit = 12,
): Promise<CurrentVideo[]> {
  const normalizedUrl = normalizeChannelUrl(channelUrl);
  if (!normalizedUrl || !isYouTubeChannelUrl(normalizedUrl.toString())) {
    return fallbackVideos(limit);
  }

  const cacheKey = normalizedUrl.toString();
  const cached = videoCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.videos.slice(0, limit);
  }

  const pending = pendingRequests.get(cacheKey);
  if (pending) return (await pending).slice(0, limit);

  const request = fetchYouTubeVideos(normalizedUrl, YOUTUBE_FETCH_LIMIT)
    .then((videos) => {
      videoCache.set(cacheKey, {
        videos,
        expiresAt: Date.now() + VIDEO_CACHE_MS,
      });
      return videos;
    })
    .catch(() => {
      const stale = videoCache.get(cacheKey)?.videos;
      return stale?.length ? stale : fallbackVideos(YOUTUBE_FETCH_LIMIT);
    })
    .finally(() => {
      pendingRequests.delete(cacheKey);
    });

  pendingRequests.set(cacheKey, request);
  return (await request).slice(0, limit);
}

export function formatYouTubePublishedDate(value?: string) {
  if (!value) return "YouTube";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "YouTube";

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Istanbul",
  }).format(date);
}
