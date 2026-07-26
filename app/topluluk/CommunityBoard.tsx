"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import {
  communityCategories,
  communityCategoryLabel,
  type CommunityCategory,
  type CommunityPageData,
  type CommunityThread,
} from "../community";

type FormState = {
  displayName: string;
  category: CommunityCategory;
  title: string;
  body: string;
  website: string;
};

const initialForm: FormState = {
  displayName: "",
  category: "tartisma",
  title: "",
  body: "",
  website: "",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

function resetTurnstile() {
  (
    window as Window & {
      turnstile?: { reset: () => void };
    }
  ).turnstile?.reset();
}

export function CommunityBoard({
  communityPage,
  activeCategory,
  turnstileSiteKey,
}: {
  communityPage: CommunityPageData;
  activeCategory: CommunityCategory | null;
  turnstileSiteKey: string;
}) {
  const router = useRouter();
  const [replyTo, setReplyTo] = useState<CommunityThread | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  const visibleThreads = communityPage.threads;

  function categoryHref(category: CommunityCategory | null) {
    return category ? `/topluluk?kategori=${category}` : "/topluluk";
  }

  function pageHref(page: number) {
    const params = new URLSearchParams();
    if (activeCategory) params.set("kategori", activeCategory);
    if (page > 1) params.set("sayfa", String(page));
    const query = params.toString();
    return query ? `/topluluk?${query}` : "/topluluk";
  }

  function paginationPages() {
    const pages = new Set([
      1,
      communityPage.totalPages,
      communityPage.page - 1,
      communityPage.page,
      communityPage.page + 1,
    ]);
    return [...pages]
      .filter((page) => page > 0 && page <= communityPage.totalPages)
      .sort((left, right) => left - right);
  }

  function beginReply(thread: CommunityThread) {
    setReplyTo(thread);
    setForm((current) => ({
      ...initialForm,
      displayName: current.displayName,
      category: thread.category,
    }));
    setNotice(null);
    resetTurnstile();
    window.setTimeout(() => {
      document
        .getElementById("community-form")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  }

  function cancelReply() {
    setReplyTo(null);
    setForm((current) => ({
      ...initialForm,
      displayName: current.displayName,
    }));
    setNotice(null);
    resetTurnstile();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const turnstileToken =
      new FormData(event.currentTarget)
        .get("cf-turnstile-response")
        ?.toString() ?? "";

    if (!turnstileToken) {
      setNotice({
        tone: "error",
        text: "Lütfen güvenlik doğrulamasının tamamlanmasını bekleyin.",
      });
      return;
    }

    setSubmitting(true);
    setNotice(null);
    try {
      const response = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          parentId: replyTo?.id ?? null,
          turnstileToken,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        message?: string;
      };
      if (!response.ok) {
        throw new Error(data.error || "Mesaj gönderilemedi.");
      }

      setForm(initialForm);
      setReplyTo(null);
      setNotice({
        tone: "success",
        text:
          data.message ||
          "Mesajınız yayınlandı ve toplulukta görünmeye başladı.",
      });
      if (replyTo) {
        router.refresh();
      } else {
        router.push(categoryHref(form.category));
        router.refresh();
      }
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Mesaj gönderilemedi.",
      });
    } finally {
      resetTurnstile();
      setSubmitting(false);
    }
  }

  return (
    <div className="community-layout">
      <section className="community-feed">
        <div className="community-filter-row">
          <Link
            className={activeCategory === null ? "is-active" : ""}
            href={categoryHref(null)}
          >
            Tümü
          </Link>
          {communityCategories.map((category) => (
            <Link
              className={activeCategory === category ? "is-active" : ""}
              href={categoryHref(category)}
              key={category}
            >
              {communityCategoryLabel(category)}
            </Link>
          ))}
        </div>

        <div className="community-feed__heading">
          <div>
            <p className="section-kicker">TOPLULUK PANOSU</p>
            <h2>Paylaşılan konular</h2>
          </div>
          <span>{communityPage.totalThreads} KONU</span>
        </div>

        {visibleThreads.length === 0 ? (
          <div className="community-empty">
            <span aria-hidden="true">✦</span>
            <h3>İlk konuyu sen aç.</h3>
            <p>Bir fikir, öneri veya sohbet başlığı paylaşabilirsin.</p>
          </div>
        ) : (
          <div className="community-threads">
            {visibleThreads.map((thread) => (
              <article className="community-thread" key={thread.id}>
                <div className="community-thread__meta">
                  <span
                    className={`community-category community-category--${thread.category}`}
                  >
                    {communityCategoryLabel(thread.category)}
                  </span>
                  <span>{formatDate(thread.createdAt)}</span>
                </div>
                <h3>{thread.title}</h3>
                <p>{thread.body}</p>
                <div className="community-thread__footer">
                  <strong>{thread.displayName}</strong>
                  <button type="button" onClick={() => beginReply(thread)}>
                    Yanıtla ↗
                  </button>
                </div>

                {thread.replies.length > 0 && (
                  <div className="community-replies">
                    {thread.replies.map((reply) => (
                      <article key={reply.id}>
                        <div>
                          <strong>{reply.displayName}</strong>
                          <span>{formatDate(reply.createdAt)}</span>
                        </div>
                        <p>{reply.body}</p>
                      </article>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        {communityPage.totalPages > 1 && (
          <nav className="community-pagination" aria-label="Topluluk sayfaları">
            <Link
              className={communityPage.page === 1 ? "is-disabled" : ""}
              href={pageHref(Math.max(1, communityPage.page - 1))}
              aria-disabled={communityPage.page === 1}
            >
              ← Önceki
            </Link>
            <div>
              {paginationPages().map((page, index, pages) => (
                <span key={page}>
                  {index > 0 && page - pages[index - 1] > 1 && (
                    <i aria-hidden="true">…</i>
                  )}
                  <Link
                    className={page === communityPage.page ? "is-active" : ""}
                    href={pageHref(page)}
                    aria-current={
                      page === communityPage.page ? "page" : undefined
                    }
                  >
                    {page}
                  </Link>
                </span>
              ))}
            </div>
            <Link
              className={
                communityPage.page === communityPage.totalPages
                  ? "is-disabled"
                  : ""
              }
              href={pageHref(
                Math.min(communityPage.totalPages, communityPage.page + 1),
              )}
              aria-disabled={
                communityPage.page === communityPage.totalPages
              }
            >
              Sonraki →
            </Link>
          </nav>
        )}
      </section>

      <aside className="community-compose" id="community-form">
        <div className="community-compose__heading">
          <p className="section-kicker">
            {replyTo ? "YANIT YAZ" : "YENİ KONU"}
          </p>
          <h2>{replyTo ? replyTo.title : "Topluluğa katıl."}</h2>
          <p>
            Üyelik gerekmez. Uygun ifadelerle yazılan mesajlar doğrudan
            yayınlanır.
          </p>
        </div>

        {replyTo && (
          <div className="community-reply-target">
            <span>{communityCategoryLabel(replyTo.category)}</span>
            <strong>{replyTo.displayName} kullanıcısına yanıt</strong>
            <button type="button" onClick={cancelReply}>
              Vazgeç
            </button>
          </div>
        )}

        <form className="community-form" onSubmit={submit}>
          <label>
            <span>Görünen ad veya takma ad</span>
            <input
              value={form.displayName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  displayName: event.target.value,
                }))
              }
              maxLength={40}
              autoComplete="nickname"
              required
            />
          </label>

          {!replyTo && (
            <>
              <label>
                <span>Kategori</span>
                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      category: event.target.value as CommunityCategory,
                    }))
                  }
                >
                  {communityCategories.map((category) => (
                    <option value={category} key={category}>
                      {communityCategoryLabel(category)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Başlık</span>
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  maxLength={100}
                  required
                />
              </label>
            </>
          )}

          <label>
            <span>{replyTo ? "Yanıtın" : "Mesajın"}</span>
            <textarea
              value={form.body}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  body: event.target.value,
                }))
              }
              rows={7}
              minLength={10}
              maxLength={1000}
              required
            />
          </label>

          <label className="giveaway-honeypot" aria-hidden="true">
            <span>Web sitesi</span>
            <input
              value={form.website}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  website: event.target.value,
                }))
              }
              tabIndex={-1}
              autoComplete="off"
            />
          </label>

          {turnstileSiteKey ? (
            <div className="turnstile-shell">
              <Script
                src="https://challenges.cloudflare.com/turnstile/v0/api.js"
                strategy="afterInteractive"
              />
              <div
                className="cf-turnstile"
                data-sitekey={turnstileSiteKey}
                data-theme="dark"
                data-size="flexible"
                data-action="community_post"
              />
            </div>
          ) : (
            <p className="community-notice community-notice--error">
              Güvenlik doğrulaması henüz yapılandırılmadı.
            </p>
          )}

          {notice && (
            <p
              className={`community-notice community-notice--${notice.tone}`}
              role="status"
            >
              {notice.text}
            </p>
          )}

          <button
            className="button button--primary"
            type="submit"
            disabled={submitting || !turnstileSiteKey}
          >
            {submitting
              ? "Gönderiliyor…"
              : replyTo
                ? "Yanıtı gönder →"
                : "Konuyu gönder →"}
          </button>
        </form>
      </aside>
    </div>
  );
}
