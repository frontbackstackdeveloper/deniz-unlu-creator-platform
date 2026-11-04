import type { Metadata } from "next";
import { getPublicManagedContent } from "../../db/content-store";
import { managedLinksToMap } from "../managed-content";
import { getChatGPTUser } from "../chatgpt-auth";
import { getAdminSession } from "../admin/admin-auth";
import { BotanicalBackground, PageHero, SiteFooter, SiteHeader } from "../components/SiteChrome";
import { LiveRoom } from "./LiveRoom";
import "./live-room.css";
import { rumbleEmbedUrl } from "../rumble";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Canlı Yayın" };

export default async function LivePage() {
  const [managed, user, admin] = await Promise.all([getPublicManagedContent(), getChatGPTUser(), getAdminSession()]);
  const liveLink = managedLinksToMap(managed.links).live;
  const embedUrl = rumbleEmbedUrl(liveLink);
  return (
    <main>
      <BotanicalBackground />
      <SiteHeader />
      <PageHero kicker="CANLI YAYIN" title={embedUrl ? "Deniz Ünlü yayında." : "Bir sonraki yayında görüşürüz."} description="Yayını üye olmadan izle. Sohbete katılmak istersen giriş yap." />
      <LiveRoom embedUrl={embedUrl} isLive={Boolean(embedUrl)} user={user ? { displayName: user.displayName } : null} isAdmin={admin.isAdmin} />
      <SiteFooter />
    </main>
  );
}
