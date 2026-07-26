"use client";

import { useState } from "react";
import {
  fromDateTimeLocal,
  giveawayStatuses,
  statusLabel,
  toDateTimeLocal,
  type AdminGiveawayData,
  type Giveaway,
  type GiveawayStatus,
} from "../giveaway";

type Notice = {
  tone: "success" | "error";
  text: string;
} | null;

type EditableGiveaway = Omit<Giveaway, "createdAt" | "updatedAt">;

function emptyGiveaway(): EditableGiveaway {
  return {
    id: 0,
    title: "Deniz Ünlü Topluluk Çekilişi",
    description: "",
    prize: "",
    status: "draft",
    targetEntries: 50,
    startsAt: "",
    endsAt: "",
  };
}

async function readData(response: Response) {
  const data = (await response.json()) as AdminGiveawayData & {
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error || "İşlem tamamlanamadı.");
  }
  return data;
}

export function AdminGiveawayManager({
  initialData,
}: {
  initialData: AdminGiveawayData;
}) {
  const [giveaway, setGiveaway] = useState<EditableGiveaway>(
    initialData.giveaway ?? emptyGiveaway(),
  );
  const [entries, setEntries] = useState(initialData.entries);
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const winner = entries.find((entry) => entry.status === "winner");
  const eligibleCount = entries.filter(
    (entry) => entry.status === "eligible" || entry.status === "winner",
  ).length;

  function update(patch: Partial<EditableGiveaway>) {
    setGiveaway((current) => ({ ...current, ...patch }));
  }

  function applyData(data: AdminGiveawayData) {
    setGiveaway(data.giveaway ?? emptyGiveaway());
    setEntries(data.entries);
  }

  async function save() {
    setBusy("save");
    setNotice(null);

    try {
      const data = await readData(
        await fetch("/api/admin/giveaway", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...giveaway,
            startsAt: fromDateTimeLocal(giveaway.startsAt),
            endsAt: fromDateTimeLocal(giveaway.endsAt),
          }),
        }),
      );
      applyData(data);
      setNotice({
        tone: "success",
        text:
          data.giveaway?.status === "active"
            ? "Çekiliş kaydedildi ve katılıma açıldı."
            : "Çekiliş ayarları kaydedildi.",
      });
    } catch (error) {
      setNotice({
        tone: "error",
        text:
          error instanceof Error ? error.message : "Çekiliş kaydedilemedi.",
      });
    } finally {
      setBusy(null);
    }
  }

  async function draw(redraw: boolean) {
    const question = redraw
      ? "Mevcut kazananı geçersiz sayıp yeniden seçim yapmak istiyor musunuz?"
      : "Katılımcılar arasından rastgele kazanan seçilsin mi?";
    if (!window.confirm(question)) return;

    setBusy(redraw ? "redraw" : "draw");
    setNotice(null);

    try {
      const data = await readData(
        await fetch("/api/admin/giveaway", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: redraw ? "redraw" : "draw" }),
        }),
      );
      applyData(data);
      const selected = data.entries.find((entry) => entry.status === "winner");
      setNotice({
        tone: "success",
        text: selected
          ? `Kazanan seçildi: ${selected.participantName}`
          : "Kazanan seçildi.",
      });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Kazanan seçilemedi.",
      });
    } finally {
      setBusy(null);
    }
  }

  function startNew() {
    if (
      !window.confirm(
        "Yeni bir çekiliş taslağı oluşturulsun mu? Eski çekiliş kayıtları silinmez.",
      )
    ) {
      return;
    }
    setGiveaway(emptyGiveaway());
    setEntries([]);
    setNotice({
      tone: "success",
      text: "Yeni taslak hazır. Bilgileri doldurup kaydedin.",
    });
  }

  async function purgeEntries() {
    if (
      !window.confirm(
        "Bu çekilişteki tüm katılımcı adları ve e-posta adresleri kalıcı olarak silinecek. Önce CSV dosyasını indirdiğinizden emin misiniz?",
      )
    ) {
      return;
    }

    setBusy("purge");
    setNotice(null);
    try {
      const data = await readData(
        await fetch("/api/admin/giveaway", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "purge" }),
        }),
      );
      applyData(data);
      setNotice({
        tone: "success",
        text: "Katılımcı kişisel verileri kalıcı olarak silindi.",
      });
    } catch (error) {
      setNotice({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "Katılımcı verileri silinemedi.",
      });
    } finally {
      setBusy(null);
    }
  }

  async function deleteEntry(entryId: number, participantName: string) {
    if (
      !window.confirm(
        `${participantName} adlı katılımcının kaydı kalıcı olarak silinsin mi?`,
      )
    ) {
      return;
    }

    const action = `delete:${entryId}`;
    setBusy(action);
    setNotice(null);

    try {
      const data = await readData(
        await fetch(`/api/admin/giveaway?entryId=${entryId}`, {
          method: "DELETE",
        }),
      );
      applyData(data);
      setNotice({
        tone: "success",
        text: "Katılımcı kaydı kalıcı olarak silindi.",
      });
    } catch (error) {
      setNotice({
        tone: "error",
        text:
          error instanceof Error ? error.message : "Katılımcı silinemedi.",
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="admin-panel admin-panel--wide admin-giveaway-panel">
      <div className="admin-panel__heading">
        <div>
          <p className="section-kicker">ÇEKİLİŞ MERKEZİ</p>
          <h2>Çekilişi yönet</h2>
        </div>
        <span>{statusLabel(giveaway.status).toLocaleUpperCase("tr-TR")}</span>
      </div>

      <div className="admin-giveaway-layout">
        <div className="admin-giveaway-form">
          <label>
            <span>Çekiliş başlığı</span>
            <input
              value={giveaway.title}
              onChange={(event) => update({ title: event.target.value })}
              maxLength={120}
            />
          </label>
          <label>
            <span>Ödül</span>
            <input
              value={giveaway.prize}
              onChange={(event) => update({ prize: event.target.value })}
              placeholder="Örn. 5 Lusifer Sandığı"
              maxLength={240}
            />
          </label>
          <label className="admin-giveaway-form__wide">
            <span>Açıklama ve ek koşullar</span>
            <textarea
              value={giveaway.description}
              onChange={(event) => update({ description: event.target.value })}
              rows={5}
              maxLength={1200}
            />
          </label>
          <label>
            <span>Başlangıç tarihi</span>
            <input
              type="datetime-local"
              value={toDateTimeLocal(giveaway.startsAt)}
              onChange={(event) => update({ startsAt: event.target.value })}
            />
          </label>
          <label>
            <span>Bitiş tarihi</span>
            <input
              type="datetime-local"
              value={toDateTimeLocal(giveaway.endsAt)}
              onChange={(event) => update({ endsAt: event.target.value })}
            />
          </label>
          <label>
            <span>Durum</span>
            <select
              value={giveaway.status}
              onChange={(event) =>
                update({ status: event.target.value as GiveawayStatus })
              }
            >
              {giveawayStatuses.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Katılımcı hedefi</span>
            <input
              type="number"
              min={2}
              max={10000}
              value={giveaway.targetEntries}
              onChange={(event) =>
                update({
                  targetEntries: Math.max(2, Number(event.target.value) || 2),
                })
              }
            />
          </label>
        </div>

        <aside className="admin-giveaway-summary">
          <span className="watch-status">
            <i /> {statusLabel(giveaway.status).toLocaleUpperCase("tr-TR")}
          </span>
          <div>
            <small>KATILIMCI</small>
            <strong>
              {eligibleCount} / {giveaway.targetEntries}
            </strong>
          </div>
          <div>
            <small>KAZANAN</small>
            <strong className="admin-giveaway-winner">
              {winner ? winner.participantName : "Henüz seçilmedi"}
            </strong>
          </div>
          <p>
            Kazanan seçildikten sonra YouTube aboneliğini ve WhatsApp kanal
            üyeliğini kontrol edin.
          </p>
        </aside>
      </div>

      <div className="admin-giveaway-actions">
        <button
          className="button button--primary"
          type="button"
          disabled={busy !== null}
          onClick={save}
        >
          {busy === "save" ? "Kaydediliyor…" : "Çekilişi kaydet"}
        </button>
        <button
          type="button"
          disabled={
            busy !== null ||
            eligibleCount < giveaway.targetEntries ||
            Boolean(winner)
          }
          onClick={() => draw(false)}
        >
          {busy === "draw" ? "Çark dönüyor…" : "Çarkı çevir"}
        </button>
        <button
          type="button"
          disabled={busy !== null || !winner}
          onClick={() => draw(true)}
        >
          {busy === "redraw" ? "Yeniden seçiliyor…" : "Kazananı geçersiz say ve yenile"}
        </button>
        <a href="/api/admin/giveaway/export">CSV / Excel indir</a>
        <button type="button" disabled={busy !== null} onClick={startNew}>
          Yeni çekiliş taslağı
        </button>
        <button
          className="is-danger"
          type="button"
          disabled={
            busy !== null ||
            entries.length === 0 ||
            (giveaway.status !== "completed" && giveaway.status !== "closed")
          }
          title={
            giveaway.status === "completed" || giveaway.status === "closed"
              ? "Bu çekilişteki tüm katılımcı kayıtlarını sil"
              : "Toplu silme için önce çekiliş durumunu Katılım kapalı yapıp kaydedin"
          }
          onClick={purgeEntries}
        >
          {busy === "purge" ? "Siliniyor…" : "Katılımcı verilerini sil"}
        </button>
      </div>

      {notice && (
        <p className={`admin-notice admin-notice--${notice.tone}`} role="status">
          {notice.text}
        </p>
      )}

      <div className="admin-participants">
        <div className="admin-participants__heading">
          <h3>Katılımcılar</h3>
          <span>{entries.length} kayıt</span>
        </div>
        {entries.length === 0 ? (
          <p className="admin-participants__empty">
            Bu çekiliş için henüz katılım bulunmuyor.
          </p>
        ) : (
          <div className="admin-participants__table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ad soyad</th>
                  <th>E-posta</th>
                  <th>Katılım tarihi</th>
                  <th>Durum</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.participantName}</td>
                    <td>{entry.email}</td>
                    <td>
                      {new Intl.DateTimeFormat("tr-TR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(new Date(entry.createdAt))}
                    </td>
                    <td>
                      <span
                        className={`participant-status participant-status--${entry.status}`}
                      >
                        {entry.status === "winner"
                          ? "Kazanan"
                          : entry.status === "disqualified"
                            ? "Geçersiz"
                            : "Uygun"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="participant-delete"
                        type="button"
                        disabled={busy !== null || entry.status === "winner"}
                        title={
                          entry.status === "winner"
                            ? "Kazananı silmek için önce geçersiz sayıp yeniden seçim yapın"
                            : "Bu katılımcıyı kalıcı olarak sil"
                        }
                        onClick={() =>
                          deleteEntry(entry.id, entry.participantName)
                        }
                      >
                        {busy === `delete:${entry.id}` ? "Siliniyor…" : "Sil"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
