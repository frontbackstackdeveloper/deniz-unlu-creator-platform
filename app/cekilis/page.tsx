import type { Metadata } from "next";
import {
  ArrowIcon,
  BotanicalBackground,
  PageHero,
  SiteFooter,
  SiteHeader,
} from "../components/SiteChrome";
import { getPublicManagedContent } from "../../db/content-store";
import { getPublicGiveaway } from "../../db/giveaway-store";
import { managedLinksToMap } from "../managed-content";
import { statusLabel } from "../giveaway";
import { GiveawayEntryForm } from "./GiveawayEntryForm";
import { GiveawayWheel } from "./GiveawayWheel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Çekiliş",
  description: "Deniz Ünlü topluluk çekilişleri, katılım koşulları ve sonuçlar.",
};

export default async function GiveawayPage() {
  const [managedContent, giveaway] = await Promise.all([
    getPublicManagedContent(),
    getPublicGiveaway().catch(() => null),
  ]);
  const links = managedLinksToMap(managedContent.links);
  const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  });
  const status = giveaway?.isOpen
    ? "Katılıma açık"
    : giveaway
      ? statusLabel(giveaway.status)
      : "Henüz aktif değil";
  const turnstileSiteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

  return (
    <main>
      <BotanicalBackground />
      <SiteHeader />
      <PageHero
        kicker="TOPLULUK ÇEKİLİŞİ"
        title="Çekilişler ve sonuçlar."
        description="Katılım koşulları, çekiliş formu ve sonuçlar tek sayfada şeffaf biçimde yayınlanır."
      />

      <section className="page-content shell">
        <div className="giveaway-detail">
          <div className="giveaway-detail__status">
            <span className={giveaway?.isOpen ? "watch-status" : "offline-pill"}>
              <i /> {status.toLocaleUpperCase("tr-TR")}
            </span>
            <h2>{giveaway?.title ?? "Yeni çekiliş duyurusu bekleniyor."}</h2>
            <p>
              {giveaway?.description ||
                "Çekiliş açıldığında katılım tarihleri, ödül bilgisi ve kazananlar burada paylaşılacak."}
            </p>
            {giveaway && (
              <GiveawayWheel
                current={giveaway.entryCount}
                target={giveaway.targetEntries}
                completed={giveaway.status === "completed"}
              />
            )}
            {giveaway && (
              <div className="giveaway-facts">
                <article>
                  <small>ÖDÜL</small>
                  <strong>{giveaway.prize}</strong>
                </article>
                <article>
                  <small>KATILIMCI</small>
                  <strong>
                    {giveaway.entryCount} / {giveaway.targetEntries}
                  </strong>
                </article>
                {giveaway.endsAt && (
                  <article>
                    <small>BİTİŞ</small>
                    <strong>{dateFormatter.format(new Date(giveaway.endsAt))}</strong>
                  </article>
                )}
              </div>
            )}
            {giveaway?.winnerDisplayName && (
              <div className="giveaway-result">
                <span>KAZANAN</span>
                <strong>{giveaway.winnerDisplayName}</strong>
                <small>Üyelik kontrollerinin ardından sonuç kesinleşir.</small>
              </div>
            )}
          </div>

          <div className="requirements">
            <p className="section-kicker">KATILIM KOŞULLARI</p>
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
                  <small>Duyuruları takip et</small>
                </span>
                <ArrowIcon />
              </a>
            )}
            {!giveaway?.isOpen && (
              <>
                <button type="button" disabled>
                  {giveaway?.status === "completed"
                    ? "Bu çekiliş sonuçlandı"
                    : "Katılım formu şu anda kapalı"}
                </button>
                <p className="verification-note">
                  Yeni çekiliş açıldığında katılım formu otomatik olarak burada
                  görünecek.
                </p>
              </>
            )}
          </div>
        </div>

        {giveaway?.isOpen && (
          <GiveawayEntryForm
            giveawayId={giveaway.id}
            turnstileSiteKey={turnstileSiteKey}
          />
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
