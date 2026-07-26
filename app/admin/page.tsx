import type { Metadata } from "next";
import Link from "next/link";
import { siteContent } from "../content";
import {
  BotanicalBackground,
  SiteFooter,
} from "../components/SiteChrome";
import {
  chatGPTSignInPath,
  chatGPTSignOutPath,
} from "../chatgpt-auth";
import { getAdminSession } from "./admin-auth";
import { dailymotionProfile } from "../dailymotion";
import {
  defaultManagedLinks,
  defaultManagedServers,
  managedLinksToMap,
} from "../managed-content";
import { getManagedContent } from "../../db/content-store";
import { getAdminGiveawayData } from "../../db/giveaway-store";
import { getAdminCommunityMessages } from "../../db/community-store";
import { AdminContentManager } from "./AdminContentManager";
import { AdminCommunityManager } from "./AdminCommunityManager";
import { AdminGiveawayManager } from "./AdminGiveawayManager";
import type { AdminGiveawayData } from "../giveaway";
import type { CommunityMessage } from "../community";
import {
  formatYouTubePublishedDate,
  getCurrentYouTubeVideos,
  type CurrentVideo,
} from "../youtube";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Yönetim Paneli",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage() {
  const { user, isConfigured, isAdmin, isLocalTestMode } =
    await getAdminSession();
  let managedContent = {
    links: defaultManagedLinks,
    servers: defaultManagedServers,
  };
  let giveawayData: AdminGiveawayData = {
    giveaway: null,
    entries: [],
  };
  let currentVideos: CurrentVideo[] = siteContent.videos.map((video) => ({
    ...video,
  }));
  let communityMessages: CommunityMessage[] = [];

  if (isAdmin) {
    try {
      [managedContent, giveawayData, communityMessages] = await Promise.all([
        getManagedContent(),
        getAdminGiveawayData(),
        getAdminCommunityMessages(),
      ]);
      const links = managedLinksToMap(managedContent.links);
      currentVideos = await getCurrentYouTubeVideos(links.youtube, 15);
    } catch {
      // Varsayılanlar paneli kullanılabilir tutar; kaydetme hatası panelde gösterilir.
    }
  }

  return (
    <main className="admin-page">
      <BotanicalBackground />
      <header className="admin-header shell">
        <Link className="brand" href="/">
          <span className="brand-monogram">DÜ</span>
          <span className="brand-copy">
            <strong>DENİZ ÜNLÜ</strong>
            <small>YÖNETİM PANELİ</small>
          </span>
        </Link>
        <Link href="/">Siteye dön →</Link>
      </header>

      {!isAdmin ? (
        <section className="admin-lock shell">
          <span className="admin-lock__mark" aria-hidden="true">DÜ</span>
          <p className="section-kicker">KORUMALI ALAN</p>
          <h1>Yönetim paneli yalnızca Deniz&apos;e açık.</h1>
          <p>
            Video, sosyal bağlantı, sunucu ve çekiliş değişiklikleri sunucu
            tarafında doğrulanan tek admin hesabıyla yapılacak.
          </p>

          {!isConfigured ? (
            <div className="admin-setup-note">
              <strong>Admin e-postası henüz yapılandırılmadı.</strong>
              <span>
                Yayın aşamasında Deniz&apos;in e-posta adresi güvenli ortam ayarı
                olarak tanımlanacak.
              </span>
            </div>
          ) : user ? (
            <div className="admin-denied">
              <strong>Bu hesap için yönetim yetkisi bulunmuyor.</strong>
              <a href={chatGPTSignOutPath("/admin")}>Farklı hesapla giriş yap</a>
            </div>
          ) : (
            <a className="button button--primary" href={chatGPTSignInPath("/admin")}>
              Güvenli giriş yap →
            </a>
          )}
        </section>
      ) : (
        <section className="admin-dashboard shell">
          <div className="admin-welcome">
            <div>
              <p className="section-kicker">HOŞ GELDİN</p>
              <h1>İçerik yönetimi</h1>
              <p>{user?.displayName}</p>
            </div>
            <a href={chatGPTSignOutPath("/")}>Çıkış yap</a>
          </div>

          {isLocalTestMode && (
            <div className="admin-setup-note admin-setup-note--inline">
              <strong>Yerel yönetici test modu açık</strong>
              <span>
                Panel, yalnızca bu bilgisayardaki geliştirme adresinde
                t06294412@gmail.com yetkisiyle test edilebilir. Public sürümde
                bu geçiş otomatik olarak kapanır ve gerçek giriş gerekir.
              </span>
            </div>
          )}

          <div className="admin-stats">
            <article>
              <span>GÜNCEL VİDEOLAR</span>
              <strong>{currentVideos.length}</strong>
              <small>YouTube kanalında yayında</small>
            </article>
            <article>
              <span>SUNUCULAR</span>
              <strong>{managedContent.servers.length}</strong>
              <small>Panelden yönetilebilir</small>
            </article>
            <article>
              <span>ÇEKİLİŞ</span>
              <strong>{giveawayData.entries.length}</strong>
              <small>
                {giveawayData.giveaway?.status === "active"
                  ? "Aktif çekiliş katılımcısı"
                  : "Son çekiliş katılımcısı"}
              </small>
            </article>
            <article>
              <span>TOPLULUK</span>
              <strong>{communityMessages.length}</strong>
              <small>Yayındaki konu ve yanıt</small>
            </article>
          </div>

          <AdminGiveawayManager initialData={giveawayData} />
          <AdminCommunityManager initialMessages={communityMessages} />

          <div className="admin-grid">
            <section className="admin-panel">
              <div className="admin-panel__heading">
                <div>
                  <p className="section-kicker">VİDEO ARŞİVİ</p>
                  <h2>Dailymotion&apos;a yükle</h2>
                </div>
                <span>OTOMATİK ARŞİV</span>
              </div>
              <div className="admin-archive-connect">
                <span className="watch-status"><i /> BAĞLI</span>
                <h3>Deniz Ünlü Dailymotion kanalı</h3>
                <p>
                  Arşiv videosunu Dailymotion Studio&apos;ya yükleyip yayınlamak
                  yeterli. Site kanalı düzenli aralıklarla kontrol eder ve yeni
                  videoyu otomatik olarak arşive ekler.
                </p>
                <ol>
                  <li>Videoyu Dailymotion Studio&apos;ya yükle.</li>
                  <li>Başlık ve açıklamayı yazıp videoyu yayınla.</li>
                  <li>Video birkaç dakika içinde sitede görünür.</li>
                </ol>
                <div className="admin-archive-connect__actions">
                  <a
                    className="button button--primary"
                    href={dailymotionProfile.studioUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Dailymotion Studio&apos;yu aç →
                  </a>
                  <a
                    className="button button--ghost"
                    href={dailymotionProfile.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Kanalı görüntüle
                  </a>
                </div>
              </div>
            </section>

            <section className="admin-panel">
              <div className="admin-panel__heading">
                <div>
                  <p className="section-kicker">YAYINDAKİLER</p>
                  <h2>Güncel videolar</h2>
                </div>
              </div>
              <div className="admin-video-list">
                {currentVideos.map((video) => (
                    <article key={video.id}>
                      <span className="watch-status"><i /> YAYINDA</span>
                      <div>
                        <strong>{video.title}</strong>
                        <small>
                          {video.duration ??
                            formatYouTubePublishedDate(video.publishedAt)}{" "}
                          • YouTube
                        </small>
                      </div>
                      <a href={video.href}>Aç →</a>
                    </article>
                  ))}
              </div>
            </section>
          </div>

          <AdminContentManager
            initialLinks={managedContent.links}
            initialServers={managedContent.servers}
          />
        </section>
      )}

      <SiteFooter />
    </main>
  );
}
