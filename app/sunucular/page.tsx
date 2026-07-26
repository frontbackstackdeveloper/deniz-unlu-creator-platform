import type { Metadata } from "next";
import {
  BotanicalBackground,
  PageHero,
  ServerList,
  SiteFooter,
  SiteHeader,
} from "../components/SiteChrome";
import { getPublicManagedContent } from "../../db/content-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Aktif Sunucular",
  description: "Deniz Ünlü'nün aktif olarak oynadığı Metin2 PvP sunucuları.",
};

export default async function ServersPage() {
  const { servers } = await getPublicManagedContent();

  return (
    <main>
      <BotanicalBackground />
      <SiteHeader />
      <PageHero
        kicker="AKTİF SUNUCULAR"
        title="Şu anda oynadığım sunucular."
        description="Deniz'in aktif olduğu Metin2 PvP sunucuları, yayın durumu ve ilgili duyurular bu sayfada güncel tutulacak."
      />
      <section className="page-content shell">
        <ServerList servers={servers} />
        <div className="subtle-note">
          <span aria-hidden="true">i</span>
          <p>
            Sunucu bilgileri zamanla değişebilir. En güncel duyurular bu sayfada
            paylaşılır.
          </p>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
