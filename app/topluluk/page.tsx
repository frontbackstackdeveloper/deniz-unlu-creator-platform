import type { Metadata } from "next";
import {
  BotanicalBackground,
  PageHero,
  SiteFooter,
  SiteHeader,
} from "../components/SiteChrome";
import {
  communityCategories,
  type CommunityCategory,
} from "../community";
import { getPublicCommunityPage } from "../../db/community-store";
import { CommunityBoard } from "./CommunityBoard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Topluluk",
  description:
    "Deniz Ünlü topluluğunda tartışma açın, fikir paylaşın ve öneride bulunun.",
};

type CommunityPageProps = {
  searchParams: Promise<{
    sayfa?: string | string[];
    kategori?: string | string[];
  }>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CommunityPage({
  searchParams,
}: CommunityPageProps) {
  const query = await searchParams;
  const requestedPage = Number(firstValue(query.sayfa));
  const categoryValue = firstValue(query.kategori) ?? "";
  const activeCategory = communityCategories.includes(
    categoryValue as CommunityCategory,
  )
    ? (categoryValue as CommunityCategory)
    : null;
  const communityPage = await getPublicCommunityPage({
    page:
      Number.isInteger(requestedPage) && requestedPage > 0
        ? requestedPage
        : 1,
    pageSize: 10,
    category: activeCategory,
  }).catch(() => ({
    threads: [],
    page: 1,
    pageSize: 10,
    totalThreads: 0,
    totalPages: 1,
  }));
  const turnstileSiteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

  return (
    <main>
      <BotanicalBackground />
      <SiteHeader />
      <PageHero
        kicker="DENİZ ÜNLÜ TOPLULUĞU"
        title="Fikirlerin buluştuğu yer."
        description="Tartışma başlığı açın, Metin2 fikirlerinizi paylaşın veya Deniz Ünlü'ye öneride bulunun. Üyelik gerekmez."
      />
      <section className="page-content shell">
        <CommunityBoard
          communityPage={communityPage}
          activeCategory={activeCategory}
          turnstileSiteKey={turnstileSiteKey}
        />
      </section>
      <SiteFooter />
    </main>
  );
}
