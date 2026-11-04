import type { Metadata } from "next";
import { getPublicManagedContent } from "../../db/content-store";
import { managedLinksToMap } from "../managed-content";
import { getChatGPTUser } from "../chatgpt-auth";
import { getAdminSession } from "../admin/admin-auth";
import { BotanicalBackground, PageHero, SiteFooter, SiteHeader } from "../components/SiteChrome";
import { LiveRoom } from "./LiveRoom";
import "./live-room.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Canlı Yayın" };

function rumbleEmbedUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !["rumble.com", "www.rumble.com"].includes(url.hostname)) return null;
    const match = url.pathname.match(/^\/embed\/(v[a-z0-9]+)\/?$/i);
    return match ? `https://rumble.com/embed/${match[1]}/` : null;
  } catch {
    return null;
  }
}

export default async function LivePage() {
  const [managed, user, admin] = await Promise.all([getPublicManagedContent(), getChatGPTUser(), getAdminSession()]);
  const liveLink = managedLinksToMap(managed.links).live;
  return (
    <main>
      <BotanicalBackground />
      <SiteHeader />
      <PageHero kicker="CANLI YAYIN" title="Deniz Ünlü yayında." description="Yayını üye olmadan izle. Sohbete katılmak istersen giriş yap." />
      <LiveRoom embedUrl={rumbleEmbedUrl(liveLink)} isLive={Boolean(liveLink)} user={user ? { displayName: user.displayName } : null} isAdmin={admin.isAdmin} />
      <SiteFooter />
    </main>
  );
}
