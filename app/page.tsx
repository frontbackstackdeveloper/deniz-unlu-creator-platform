import type { Metadata } from "next";
import Link from "next/link";
import { siteContent } from "./content";
import {
  ArrowIcon,
  BotanicalBackground,
  PlatformCard,
  ServerList,
  SiteFooter,
  SiteHeader,
  VideoCard,
} from "./components/SiteChrome";
import { getPublicManagedContent } from "../db/content-store";
import { getPublicGiveaway } from "../db/giveaway-store";
import { managedLinksToMap } from "./managed-content";
import { getCurrentYouTubeVideos } from "./youtube";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Deniz Ünlü | Metin2 Yayın ve Video Arşivi",
  description:
    "Deniz Ünlü'nün canlı yayınları, güncel Metin2 videoları, topluluk bağlantıları ve video arşivi.",
};

export default async function Home() {
  const { creator, platforms } = siteContent;
  const [managedContent, giveaway] = await Promise.all([
    getPublicManagedContent(),
    getPublicGiveaway().catch(() => null),
  ]);
  const links = managedLinksToMap(managedContent.links);
  const videos = await getCurrentYouTubeVideos(links.youtube, 4);
  const giveawayProgress = giveaway
    ? Math.min(100, (giveaway.entryCount / giveaway.targetEntries) * 100)
    : 0;

  return (
    <main>
      <BotanicalBackground />
      <div className="ambient ambient--one" aria-hidden="true" />
      <div className="ambient ambient--two" aria-hidden="true" />
      <SiteHeader />

      {links.live && (
        <section className="live-broadcast shell" aria-label="Canlı yayın">
          <span className="live-broadcast__signal" aria-hidden="true">
            <i />
            <i />
          </span>
          <div className="live-broadcast__copy">
            <span>DENİZ ÜNLÜ ŞU AN YAYINDA</span>
            <strong>Canlı yayına katıl, macerayı kaçırma.</strong>
          </div>
          <a
            className="live-broadcast__action"
            href={links.live}
            target="_blank"
            rel="noreferrer"
          >
            Yayına geç <ArrowIcon />
          </a>
        </section>
      )}

      <section className="hero shell" id="anasayfa">
        <div className="hero-copy">
          <div className="status-badge">
            <span className="status-dot" />
            <span>DENİZ ÜNLÜ RESMÎ MERKEZİ</span>
          </div>

          <p className="eyebrow">{creator.eyebrow}</p>
          <h1>
            Yayın kaçarsa,
            <span> arşiv burada.</span>
          </h1>
          <p className="hero-description">{creator.description}</p>

          <div className="hero-actions">
            <Link className="button button--primary" href="/videolar">
              Güncel videolar <ArrowIcon />
            </Link>
            <Link className="button button--ghost" href="/arsiv">
              Video arşivini keşfet
            </Link>
          </div>

          <div className="hero-trust">
            <div className="avatar-stack" aria-hidden="true">
              <span>D</span>
              <span>Ü</span>
              <span>+</span>
            </div>
            <p>
              <strong>Tek bağlantı, güncel bilgiler.</strong>
              Yayın ve kanal adreslerine kolayca ulaş.
            </p>
          </div>
        </div>

        <aside className="hero-stage" aria-label="Deniz Ünlü yayın merkezi">
          <div
            className="hero-cover-card"
            role="img"
            aria-label="Deniz Ünlü Metin2 yayın ve arşiv kapak görseli"
          >
            <span className="hero-cover-card__media" aria-hidden="true" />
            <span className="hero-cover-card__scan" aria-hidden="true" />
            <span className="hero-cover-card__line" />
            <span className="hero-cover-card__lotus" aria-hidden="true" />
            <div className="hero-cover-card__top">
              <span>RESMÎ MERKEZ</span>
              <span>METİN2 • YAYIN • ARŞİV</span>
            </div>
          </div>

          <div className="hero-live-console">
            <div>
              <span className={links.live ? "live-pill" : "offline-pill"}>
                <i /> {links.live ? "YAYINDA" : "ÇEVRİMDIŞI"}
              </span>
              <p>YAYIN RADARI</p>
            </div>
            <h2>
              {links.live
                ? "Deniz Ünlü şu an canlı yayında."
                : "Bir sonraki yayında görüşürüz."}
            </h2>
            <span>
              {links.live
                ? "Yayın başladı. Tek dokunuşla aktif yayın platformuna geçebilirsiniz."
                : "Yayın başladığında aktif platform ve duyurular burada öne çıkar."}
            </span>
            {(links.live || links.whatsapp) && (
              <a
                href={links.live || links.whatsapp}
                target="_blank"
                rel="noreferrer"
              >
                {links.live ? "Canlı yayına geç" : "WhatsApp duyuruları"}{" "}
                <ArrowIcon />
              </a>
            )}
          </div>

          <span className="hero-depth-badge hero-depth-badge--archive">
            <strong>64+</strong>
            <small>ARŞİV VİDEOSU</small>
          </span>
          <span className="hero-depth-badge hero-depth-badge--source">
            YOUTUBE + DAILYMOTION
          </span>
        </aside>
      </section>

      <section className="section shell" id="yayinlar">
        <div className="section-heading">
          <div>
            <p className="section-kicker">HIZLI ERİŞİM</p>
            <h2>Güncel yayın ve videolara buradan ulaşabilirsiniz.</h2>
          </div>
          <p>
            Yayın veya kanal adresi değiştiğinde tüm bağlantılar bu sayfadan
            güncellenir.
          </p>
        </div>

        <div className="platform-grid" id="topluluk">
          {platforms.map((platform) => (
            <PlatformCard
              key={platform.key}
              platform={platform}
              href={links[platform.key]}
            />
          ))}
        </div>
      </section>

      <section className="section shell channel-section" id="arsiv">
        <div className="channel-feature">
          <div>
            <p className="section-kicker">AKTİF YOUTUBE KANALI</p>
            <h2>Yeni videolara göz atın.</h2>
            <p>
              Güncel Metin2 içerikleri aktif kanalda; eski yayınlar ve erişime
              kapanan kendi kayıtları Deniz Ünlü Arşivi&apos;nde.
            </p>
          </div>
          <div className="feature-actions">
            <Link className="button button--light" href="/videolar">
              Tüm videolar <ArrowIcon />
            </Link>
            {links.youtube && (
              <a className="button button--ghost" href={links.youtube} target="_blank" rel="noreferrer">
                YouTube
              </a>
            )}
          </div>
        </div>

        <div className="video-grid">
          {videos.map((video) => <VideoCard video={video} key={video.id} />)}
        </div>

        <div className="archive-note">
          <span className="archive-note__icon" aria-hidden="true">⌁</span>
          <div>
            <strong>Deniz Ünlü Arşivi</strong>
            <p>
              Güncel videoları ve geçmiş yayın kayıtlarını tek yerde keşfedin.
            </p>
          </div>
          <Link className="archive-note__status" href="/arsiv">ARŞİVİ AÇ →</Link>
        </div>
      </section>

      <section className="section shell" id="sunucular">
        <div className="section-heading">
          <div>
            <p className="section-kicker">AKTİF MACERA</p>
            <h2>Oynadığım sunucular.</h2>
          </div>
          <p>
            Aktif olarak oynadığım sunucuları ve güncel bilgileri burada
            bulabilirsiniz.
          </p>
        </div>
        <ServerList servers={managedContent.servers} />
      </section>

      <section className="giveaway shell" id="cekilis">
        <div className="giveaway-copy">
          <p className="section-kicker">TOPLULUK ÇEKİLİŞİ</p>
          {giveaway?.isOpen && (
            <span className="watch-status"><i /> KATILIMA AÇIK</span>
          )}
          <h2>
            {giveaway?.title ?? "Çekilişler ve duyurular."}
          </h2>
          <p>
            {giveaway?.description ??
              "Çekiliş açıldığında katılım koşullarını ve sonuçları ayrı çekiliş sayfasından takip edebilirsiniz."}
          </p>
          {giveaway && (
            <div className="giveaway-home-progress">
              <div>
                <span>KATILIM İLERLEMESİ</span>
                <strong>
                  {giveaway.entryCount} / {giveaway.targetEntries}
                </strong>
              </div>
              <span className="giveaway-home-progress__track" aria-hidden="true">
                <i style={{ width: `${giveawayProgress}%` }} />
              </span>
              <small>
                {giveaway.status === "completed"
                  ? "Çark döndü ve kazanan belirlendi."
                  : `${Math.max(0, giveaway.targetEntries - giveaway.entryCount)} kişilik yer kaldı. Kontenjan dolunca çark otomatik döner.`}
              </small>
            </div>
          )}
        </div>

        <div className="requirements">
          {links.youtube && (
            <a href={links.youtube} target="_blank" rel="noreferrer">
              <span className="requirement-number">01</span>
              <span>
                <strong>YouTube kanalına abone ol</strong>
                <small>Aktif kanalı aç</small>
              </span>
              <ArrowIcon />
            </a>
          )}
          {links.whatsapp && (
            <a href={links.whatsapp} target="_blank" rel="noreferrer">
              <span className="requirement-number">02</span>
              <span>
                <strong>WhatsApp kanalına katıl</strong>
                <small>Duyuruları kaçırma</small>
              </span>
              <ArrowIcon />
            </a>
          )}
          <Link className="giveaway-page-link" href="/cekilis">
            {giveaway?.isOpen
              ? `${giveaway.prize} çekilişine katıl`
              : "Çekiliş sayfasını aç"}{" "}
            <ArrowIcon />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
