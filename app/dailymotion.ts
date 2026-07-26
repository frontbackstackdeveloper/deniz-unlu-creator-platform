export const dailymotionProfile = {
  id: "denizunlu",
  url: "https://www.dailymotion.com/user/denizunlu",
  studioUrl: "https://www.dailymotion.com/partner",
} as const;

export function getDailymotionProfileId(profileUrl: string) {
  try {
    const parsed = new URL(profileUrl);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const userIndex = parts.indexOf("user");
    const profileId = userIndex >= 0 ? parts[userIndex + 1] : parts.at(-1);
    return profileId && /^[a-z0-9_-]+$/i.test(profileId) ? profileId : null;
  } catch {
    return /^[a-z0-9_-]+$/i.test(profileUrl) ? profileUrl : null;
  }
}

export type DailymotionVideo = {
  id: string;
  title: string;
  description: string;
  duration: number;
  thumbnail_720_url: string;
  created_time: number;
  url: string;
  embed_url: string;
};

type DailymotionListResponse = {
  page: number;
  has_more: boolean;
  list: DailymotionVideo[];
};

type DailymotionCacheEntry = {
  expiresAt: number;
  videos: DailymotionVideo[];
};

const DAILYMOTION_CACHE_MS = 5 * 60 * 1000;
const dailymotionCache = new Map<string, DailymotionCacheEntry>();
const pendingDailymotionRequests = new Map<
  string,
  Promise<DailymotionVideo[]>
>();

const videoFields = [
  "id",
  "title",
  "description",
  "duration",
  "thumbnail_720_url",
  "created_time",
  "url",
  "embed_url",
].join(",");

export function isDailymotionVideoId(value: string) {
  return /^x[a-z0-9]+$/i.test(value);
}

export function formatVideoDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

async function loadDailymotionVideos(
  profileId = dailymotionProfile.id,
) {
  const videos: DailymotionVideo[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= 10) {
    const endpoint = new URL(
      `https://api.dailymotion.com/user/${profileId}/videos`,
    );
    endpoint.searchParams.set("fields", videoFields);
    endpoint.searchParams.set("limit", "100");
    endpoint.searchParams.set("sort", "recent");
    endpoint.searchParams.set("page", String(page));

    const response = await fetch(endpoint, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Dailymotion video listesi alınamadı (${response.status}).`);
    }

    const data = (await response.json()) as DailymotionListResponse;
    videos.push(
      ...data.list.filter((video) => isDailymotionVideoId(video.id)),
    );
    hasMore = data.has_more;
    page += 1;
  }

  return videos;
}

export async function fetchDailymotionVideos(
  profileId = dailymotionProfile.id,
) {
  const cached = dailymotionCache.get(profileId);
  if (cached && cached.expiresAt > Date.now()) return cached.videos;

  const pending = pendingDailymotionRequests.get(profileId);
  if (pending) return pending;

  const request = loadDailymotionVideos(profileId)
    .then((videos) => {
      dailymotionCache.set(profileId, {
        videos,
        expiresAt: Date.now() + DAILYMOTION_CACHE_MS,
      });
      return videos;
    })
    .catch((error) => {
      const stale = dailymotionCache.get(profileId)?.videos;
      if (stale?.length) return stale;
      throw error;
    })
    .finally(() => {
      pendingDailymotionRequests.delete(profileId);
    });

  pendingDailymotionRequests.set(profileId, request);
  return request;
}

export async function getDailymotionVideo(videoId: string) {
  if (!isDailymotionVideoId(videoId)) return null;

  const endpoint = new URL(`https://api.dailymotion.com/video/${videoId}`);
  endpoint.searchParams.set("fields", videoFields);

  const response = await fetch(endpoint, {
    headers: { Accept: "application/json" },
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Dailymotion videosu alınamadı (${response.status}).`);
  }

  return (await response.json()) as DailymotionVideo;
}
