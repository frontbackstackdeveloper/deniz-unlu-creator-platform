import Link from "next/link";
import { siteContent } from "../content";
import {
  formatYouTubePublishedDate,
  type CurrentVideo,
} from "../youtube";

type DisplayServer = {
  id?: number;
  name: string;
  code: string;
  status: string;
  detail: string;
  url?: string;
};

const officialServerLogos = {
  kuzey2: "https://kuzey2.com/server/fetih.png",
  rohan2: "https://rohan2.global/assets/images/logo.png",
} as const;

function getOfficialServerLogo(name: string) {
  const normalizedName = name.toLocaleLowerCase("tr-TR");
  if (normalizedName.includes("kuzey2")) return officialServerLogos.kuzey2;
  if (normalizedName.includes("rohan2")) return officialServerLogos.rohan2;
  return "";
}

export function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}

export function BotanicalBackground() {
  return (
    <div className="botanical-bg" aria-hidden="true">
      <span className="depth-grid" />
      <span className="depth-orb depth-orb--one" />
      <span className="depth-orb depth-orb--two" />
      <span className="water-ripple water-ripple--one" />
      <span className="water-ripple water-ripple--two" />
      <span className="water-glow water-glow--one" />
      <span className="water-glow water-glow--two" />
      <span className="lily-pad lily-pad--one" />
      <span className="lily-pad lily-pad--two" />
      <span className="lily-pad lily-pad--three" />
      <span className="lotus lotus--one">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="lotus lotus--two">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}

export function SiteHeader() {
  return (
    <>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Deniz Ünlü ana sayfa">
          <span
            className="brand-monogram brand-monogram--lily brand-monogram--lotus-image"
            aria-hidden="true"
          />
          <span className="brand-copy">
            <strong>DENİZ ÜNLÜ</strong>
            <small>METİN2 YOLCULUĞU</small>
          </span>
        </Link>

        <nav aria-label="Ana menü">
          <Link href="/videolar">Videolar</Link>
          <Link href="/arsiv">Arşiv</Link>
          <Link href="/sunucular">Sunucular</Link>
          <Link href="/cekilis">Çekiliş</Link>
          <Link href="/topluluk">Topluluk</Link>
        </nav>

        <Link className="header-cta" href="/#topluluk">
          Bağlantılar <ArrowIcon />
        </Link>
      </header>
      <nav className="mobile-nav" aria-label="Mobil menü">
        <Link href="/videolar">Videolar</Link>
        <Link href="/arsiv">Arşiv</Link>
        <Link href="/sunucular">Sunucular</Link>
        <Link href="/cekilis">Çekiliş</Link>
        <Link href="/topluluk">Topluluk</Link>
      </nav>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer shell">
      <Link className="brand" href="/">
        <span
          className="brand-monogram brand-monogram--lily brand-monogram--lotus-image brand-monogram--footer"
          aria-hidden="true"
        />
        <span className="brand-copy">
          <strong>DENİZ ÜNLÜ</strong>
          <small>METİN2 • YAYIN • ARŞİV</small>
        </span>
      </Link>
      <p>© 2026 Deniz Ünlü. Tüm hakları saklıdır.</p>
      <div className="site-footer__links">
        <Link href="/gizlilik">Gizlilik ve KVKK</Link>
        <Link href="/">Ana sayfa →</Link>
      </div>
    </footer>
  );
}

export function PageHero({
  kicker,
  title,
  description,
}: {
  kicker: string;
  title: string;
  description: string;
}) {
  return (
    <section className="page-hero shell">
      <Link className="page-back" href="/">← Ana sayfa</Link>
      <p className="section-kicker">{kicker}</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  );
}

export function PlatformCard({
  platform,
  href,
}: {
  platform: (typeof siteContent.platforms)[number];
  href?: string;
}) {
  const resolvedHref = href ?? siteContent.links[platform.key];

  if (!resolvedHref) {
    return (
      <div
        className="platform-card platform-card--disabled"
        aria-label={`${platform.name} bağlantısı yakında`}
      >
        <span className={`platform-mark platform-mark--${platform.tone}`}>
          {platform.short}
        </span>
        <span className="platform-copy">
          <strong>{platform.name}</strong>
          <small>Bağlantı güncellenecek</small>
        </span>
        <span className="soon-pill">YAKINDA</span>
      </div>
    );
  }

  return (
    <a className="platform-card" href={resolvedHref} target="_blank" rel="noreferrer">
      <span className={`platform-mark platform-mark--${platform.tone}`}>
        {platform.short}
      </span>
      <span className="platform-copy">
        <strong>{platform.name}</strong>
        <small>{platform.description}</small>
      </span>
      <ArrowIcon />
    </a>
  );
}

export function VideoCard({
  video,
}: {
  video: CurrentVideo;
}) {
  return (
    <Link
      className={`video-card video-card--${video.accent}`}
      href={video.href}
    >
      <div
        className={`video-art${video.thumbnailUrl ? " video-art--thumbnail" : ""}`}
        style={
          video.thumbnailUrl
            ? { backgroundImage: `url("${video.thumbnailUrl}")` }
            : undefined
        }
      >
        <span className="video-index">{video.index}</span>
        <span className="video-play" aria-hidden="true">▶</span>
        <span className="video-duration">
          {video.duration ?? formatYouTubePublishedDate(video.publishedAt)}
        </span>
      </div>
      <div className="video-meta">
        <span>{video.tag}</span>
        <h3>{video.title}</h3>
        <p>İzlemek için aç <ArrowIcon /></p>
      </div>
    </Link>
  );
}

export function ServerList({
  servers = siteContent.servers,
}: {
  servers?: readonly DisplayServer[];
}) {
  return (
    <div className="server-list">
      {servers.map((server) => {
        const logoUrl = getOfficialServerLogo(server.name);
        const normalizedStatus = server.status.toLocaleLowerCase("tr-TR");
        const isActive = ["aktif", "yayında", "canlı"].some((status) =>
          normalizedStatus.includes(status),
        );
        const cardContent = (
          <>
            <span
              className={`server-code${logoUrl ? " server-code--logo" : ""}`}
              style={
                logoUrl ? { backgroundImage: `url("${logoUrl}")` } : undefined
              }
              aria-label={logoUrl ? `${server.name} logosu` : undefined}
            >
              <span>{server.code}</span>
            </span>
            <div>
              <span className={`server-status${isActive ? " is-active" : ""}`}>
                <i /> {server.status}
              </span>
              <h3>{server.name}</h3>
              <p>{server.detail}</p>
            </div>
            <span className="server-arrow" aria-hidden="true">
              {server.url ? "↗" : "→"}
            </span>
          </>
        );

        return server.url ? (
          <a
            className="server-card"
            href={server.url}
            target="_blank"
            rel="noreferrer"
            key={server.id ?? server.name}
          >
            {cardContent}
          </a>
        ) : (
          <article className="server-card" key={server.id ?? server.name}>
            {cardContent}
          </article>
        );
      })}
    </div>
  );
}
