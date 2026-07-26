"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";

type GiveawayEntryFormProps = {
  giveawayId: number;
  turnstileSiteKey: string;
};

type FormState = {
  participantName: string;
  email: string;
  youtubeConfirmed: boolean;
  whatsappConfirmed: boolean;
  privacyAcknowledged: boolean;
  termsAccepted: boolean;
  website: string;
};

const initialForm: FormState = {
  participantName: "",
  email: "",
  youtubeConfirmed: false,
  whatsappConfirmed: false,
  privacyAcknowledged: false,
  termsAccepted: false,
  website: "",
};

export function GiveawayEntryForm({
  giveawayId,
  turnstileSiteKey,
}: GiveawayEntryFormProps) {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

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
      const response = await fetch("/api/giveaway/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giveawayId, ...form, turnstileToken }),
      });
      const data = (await response.json()) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Katılım kaydedilemedi.");
      }

      setForm(initialForm);
      setNotice({
        tone: "success",
        text: data.message || "Katılımınız kaydedildi. Bol şans!",
      });
      router.refresh();
    } catch (error) {
      setNotice({
        tone: "error",
        text:
          error instanceof Error ? error.message : "Katılım kaydedilemedi.",
      });
    } finally {
      window.turnstile?.reset();
      setSubmitting(false);
    }
  }

  return (
    <form className="giveaway-entry-form" onSubmit={submit}>
      <div className="giveaway-entry-form__heading">
        <p className="section-kicker">ÇEKİLİŞE KATIL</p>
        <h3>Bilgilerini gönder</h3>
        <p>Her e-posta adresi bu çekilişe yalnızca bir kez katılabilir.</p>
      </div>

      <div className="giveaway-form-fields">
        <label>
          <span>Ad soyad</span>
          <input
            type="text"
            value={form.participantName}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                participantName: event.target.value,
              }))
            }
            autoComplete="name"
            maxLength={80}
            required
          />
        </label>
        <label>
          <span>E-posta adresi</span>
          <input
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
            autoComplete="email"
            maxLength={160}
            required
          />
        </label>
        <label className="giveaway-honeypot" aria-hidden="true">
          <span>Web sitesi</span>
          <input
            type="text"
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
      </div>

      <div className="giveaway-consents">
        <label>
          <input
            type="checkbox"
            checked={form.youtubeConfirmed}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                youtubeConfirmed: event.target.checked,
              }))
            }
            required
          />
          <span>YouTube kanalına abone olduğumu onaylıyorum.</span>
        </label>
        <label>
          <input
            type="checkbox"
            checked={form.whatsappConfirmed}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                whatsappConfirmed: event.target.checked,
              }))
            }
            required
          />
          <span>WhatsApp kanalına katıldığımı onaylıyorum.</span>
        </label>
        <label>
          <input
            type="checkbox"
            checked={form.privacyAcknowledged}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                privacyAcknowledged: event.target.checked,
              }))
            }
            required
          />
          <span>
            <Link href="/gizlilik#cekilis-aydinlatma">
              Çekiliş Aydınlatma Metni
            </Link>
            &apos;ni okudum ve bilgilendirildim.
          </span>
        </label>
        <label>
          <input
            type="checkbox"
            checked={form.termsAccepted}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                termsAccepted: event.target.checked,
              }))
            }
            required
          />
          <span>
            Ad, soyad ve e-posta bilgilerimin çekilişe katılım ve kazanan
            doğrulaması amacıyla işlenmesine açık rıza veriyorum.
          </span>
        </label>
      </div>

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
            data-action="giveaway_entry"
          />
        </div>
      ) : (
        <p className="giveaway-form-notice giveaway-form-notice--error">
          Güvenlik doğrulaması henüz yapılandırılmadı.
        </p>
      )}

      {notice && (
        <p
          className={`giveaway-form-notice giveaway-form-notice--${notice.tone}`}
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
        {submitting ? "Katılım kaydediliyor…" : "Çekilişe katıl →"}
      </button>
      <small className="giveaway-manual-check">
        Kazananın YouTube ve WhatsApp üyeliği sonuç açıklanmadan önce manuel
        olarak kontrol edilir.
      </small>
    </form>
  );
}

declare global {
  interface Window {
    turnstile?: {
      reset: () => void;
    };
  }
}
