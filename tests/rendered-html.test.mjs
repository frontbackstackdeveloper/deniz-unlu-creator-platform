import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(pathname) {
  return readFile(new URL(`../${pathname}`, import.meta.url), "utf8");
}

test("contains the completed Deniz Ünlü public experience", async () => {
  const [
    home,
    layout,
    giveaway,
    wheel,
    managedContent,
    adminManager,
    siteChrome,
    styles,
    interfacePolish,
  ] =
    await Promise.all([
    source("app/page.tsx"),
    source("app/layout.tsx"),
    source("app/cekilis/page.tsx"),
    source("app/cekilis/GiveawayWheel.tsx"),
    source("app/managed-content.ts"),
    source("app/admin/AdminContentManager.tsx"),
    source("app/components/SiteChrome.tsx"),
    source("app/globals.css"),
    source("app/interface-polish.css"),
  ]);

  assert.match(home, /Yayın kaçarsa/);
  assert.match(home, /Video arşivini keşfet/);
  assert.match(layout, /Deniz Ünlü \| Metin2 Yayın ve Video Arşivi/);
  assert.match(layout, /lotus-icon\.png/);
  assert.match(giveaway, /GiveawayEntryForm/);
  assert.match(giveaway, /winnerDisplayName/);
  assert.match(giveaway, /getChatGPTUser/);
  assert.match(giveaway, /chatGPTSignInPath/);
  assert.match(giveaway, /verifiedEmail/);
  assert.match(home, /giveawayProgress/);
  assert.match(wheel, /wheel-segment-size/);
  assert.match(home, /live-broadcast/);
  assert.match(home, /hero-cover-card__media/);
  assert.match(home, /hero-cover-card__lotus/);
  assert.match(managedContent, /"live"/);
  assert.match(adminManager, /doğrudan yayın bağlantısını yapıştırın/);
  assert.match(siteChrome, /brand-monogram--lily/);
  assert.match(siteChrome, /brand-monogram--lotus-image/);
  assert.match(siteChrome, /brand-monogram--footer/);
  assert.match(siteChrome, /METİN2 YOLCULUĞU/);
  assert.match(siteChrome, /prefetch=\{false\}/);
  assert.match(styles, /@keyframes border-light-orbit/);
  assert.match(styles, /--orbit-angle/);
  assert.match(styles, /lotus-cursor\.png/);
  assert.match(styles, /lotus-cursor-active\.png/);
  assert.match(interfacePolish, /\.watch-player iframe/);
  assert.match(interfacePolish, /position: absolute/);
  assert.match(interfacePolish, /\.admin-panel:hover/);
  assert.match(interfacePolish, /\.admin-community-item/);
  assert.doesNotMatch(`${home}\n${layout}`, /codex-preview|SkeletonPreview/);
});

test("keeps giveaway administration and writes server-protected", async () => {
  const [
    adminPage,
    adminAuth,
    adminRoute,
    entryRoute,
    entryForm,
    turnstile,
    privacy,
    giveawayStore,
    giveawaySeed,
    gmail,
    contentStore,
    publicCache,
  ] =
    await Promise.all([
    source("app/admin/page.tsx"),
    source("app/admin/admin-auth.ts"),
    source("app/api/admin/giveaway/route.ts"),
    source("app/api/giveaway/entries/route.ts"),
    source("app/cekilis/GiveawayEntryForm.tsx"),
    source("app/turnstile.ts"),
    source("app/gizlilik/page.tsx"),
    source("db/giveaway-store.ts"),
    source("drizzle/0005_seed_first_giveaway.sql"),
    source("app/gmail.ts"),
    source("db/content-store.ts"),
    source("db/public-cache.ts"),
  ]);

  assert.match(adminPage, /getAdminSession/);
  assert.match(adminPage, /AdminGiveawayManager/);
  assert.match(adminPage, /Yerel yönetici test modu açık/);
  assert.match(adminAuth, /process\.env\.NODE_ENV !== "production"/);
  assert.match(adminAuth, /LOCAL_ADMIN_TEST_EMAIL/);
  assert.match(adminRoute, /if \(!isAdmin\) return unauthorized/);
  assert.match(adminRoute, /drawGiveawayWinner/);
  assert.match(entryRoute, /sameOrigin/);
  assert.match(entryRoute, /createGiveawayEntry/);
  assert.match(entryRoute, /verifyTurnstileToken/);
  assert.match(entryForm, /cf-turnstile-response/);
  assert.match(turnstile, /siteverify/);
  assert.match(privacy, /ÇEKİLİŞ AYDINLATMA METNİ/i);
  assert.match(adminRoute, /purgeGiveawayEntries/);
  assert.match(adminRoute, /deleteGiveawayEntry/);
  assert.match(entryRoute, /normalizeGmailAddress/);
  assert.match(entryRoute, /getChatGPTUser/);
  assert.doesNotMatch(entryRoute, /body\.email/);
  assert.match(entryForm, /value=\{verifiedEmail\}/);
  assert.match(entryForm, /readOnly/);
  assert.match(gmail, /@gmail\\\.com/);
  assert.match(giveawayStore, /DELETE FROM giveaway_entries WHERE id = \?/);
  assert.match(giveawayStore, /Deniz Ünlü 1\.000 EP Çekilişi/);
  assert.match(giveawayStore, /VALUES \(\?, \?, \?, 'active', 50/);
  assert.match(giveawaySeed, /`status` = 'active'/);
  assert.match(giveawaySeed, /`target_entries` = 50/);
  assert.match(giveawayStore, /getCachedPublicData/);
  assert.match(contentStore, /getCachedPublicData/);
  assert.match(publicCache, /pending/);
  assert.match(publicCache, /invalidatePublicData/);
});

test("lists all four current YouTube videos", async () => {
  const [content, sitemap, youtube, dailymotion, videosPage, videoExplorer, videoPage, adminRoute] =
    await Promise.all([
    source("app/content.ts"),
    source("app/sitemap.ts"),
    source("app/youtube.ts"),
    source("app/dailymotion.ts"),
    source("app/videolar/page.tsx"),
    source("app/videolar/VideoExplorer.tsx"),
    source("app/videolar/[videoId]/page.tsx"),
    source("app/api/admin/content/route.ts"),
  ]);

  for (const videoId of [
    "zJD9KLZ2rJk",
    "DsfcioiTcoE",
    "gyhUGE3BYCU",
    "xbltCeNb8sI",
  ]) {
    assert.match(content, new RegExp(videoId));
  }

  assert.match(sitemap, /gizlilik/);
  assert.match(youtube, /feeds\/videos/);
  assert.match(youtube, /VIDEO_CACHE_MS = 5 \* 60 \* 1000/);
  assert.match(youtube, /YOUTUBE_FETCH_LIMIT/);
  assert.match(dailymotion, /DAILYMOTION_CACHE_MS = 5 \* 60 \* 1000/);
  assert.match(dailymotion, /pendingDailymotionRequests/);
  assert.match(videosPage, /getCurrentYouTubeVideos/);
  assert.match(videosPage, /VideoExplorer/);
  assert.match(videoExplorer, /setActiveFilter/);
  assert.match(videoExplorer, /videos\.slice\(0, 4\)/);
  assert.match(videoExplorer, /href="\/arsiv"/);
  assert.match(videoPage, /getCurrentYouTubeVideos/);
  assert.match(videoPage, /className="watch-layout"/);
  assert.match(videoPage, /className="watch-player"/);
  assert.match(videoPage, /className="watch-info"/);
  assert.match(adminRoute, /isYouTubeChannelUrl/);
});

test("provides a direct-publish manageable community board with pagination", async () => {
  const [
    communityPage,
    communityBoard,
    communityModeration,
    publicRoute,
    adminRoute,
    adminManager,
    communityStore,
    schema,
  ] = await Promise.all([
    source("app/topluluk/page.tsx"),
    source("app/topluluk/CommunityBoard.tsx"),
    source("app/community-moderation.ts"),
    source("app/api/community/route.ts"),
    source("app/api/admin/community/route.ts"),
    source("app/admin/AdminCommunityManager.tsx"),
    source("db/community-store.ts"),
    source("db/schema.ts"),
  ]);

  assert.match(communityPage, /Üyelik gerekmez/);
  assert.match(communityPage, /pageSize: 10/);
  assert.match(communityBoard, /community_post/);
  assert.match(communityBoard, /Yanıtla/);
  assert.match(communityBoard, /community-pagination/);
  assert.match(communityBoard, /doğrudan\s+yayınlanır/);
  assert.match(communityBoard, /prefetch=\{false\}/);
  assert.match(communityModeration, /containsBlockedCommunityLanguage/);
  assert.match(publicRoute, /verifyTurnstileToken/);
  assert.match(publicRoute, /containsBlockedCommunityLanguage/);
  assert.match(publicRoute, /createCommunityMessage/);
  assert.match(adminRoute, /getAdminSession/);
  assert.match(adminRoute, /updateCommunityMessage/);
  assert.match(adminManager, /Düzenle/);
  assert.match(adminManager, /Sil/);
  assert.match(communityStore, /VALUES \(\?, \?, \?, \?, \?, 'approved'/);
  assert.match(communityStore, /LIMIT \? OFFSET \?/);
  assert.match(communityStore, /status = 'approved'/);
  assert.match(communityStore, /Promise\.all/);
  assert.match(schema, /communityMessages/);
});
