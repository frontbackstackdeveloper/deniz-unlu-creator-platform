"use client";

import { useState } from "react";
import {
  communityCategories,
  communityCategoryLabel,
  type CommunityCategory,
  type CommunityMessage,
} from "../community";

type EditDraft = {
  displayName: string;
  category: CommunityCategory;
  title: string;
  body: string;
};

async function readData(response: Response) {
  const data = (await response.json()) as {
    messages?: CommunityMessage[];
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error || "Topluluk işlemi tamamlanamadı.");
  }
  return data.messages ?? [];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

export function AdminCommunityManager({
  initialMessages,
}: {
  initialMessages: CommunityMessage[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [notice, setNotice] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  function startEdit(message: CommunityMessage) {
    setEditingId(message.id);
    setDraft({
      displayName: message.displayName,
      category: message.category,
      title: message.title,
      body: message.body,
    });
    setNotice(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  async function saveEdit(message: CommunityMessage) {
    if (!draft) return;
    setBusyId(message.id);
    setNotice(null);
    try {
      const updated = await readData(
        await fetch("/api/admin/community", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "edit",
            id: message.id,
            ...draft,
          }),
        }),
      );
      setMessages(updated);
      cancelEdit();
      setNotice({
        tone: "success",
        text: "Mesaj düzenlendi ve topluluk sayfası güncellendi.",
      });
    } catch (error) {
      setNotice({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "Topluluk mesajı düzenlenemedi.",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function remove(message: CommunityMessage) {
    const warning = message.parentId
      ? "Bu yanıt kalıcı olarak silinsin mi?"
      : "Bu konu ve konuya verilen tüm yanıtlar kalıcı olarak silinsin mi?";
    if (!window.confirm(warning)) return;

    setBusyId(message.id);
    setNotice(null);
    try {
      const updated = await readData(
        await fetch(`/api/admin/community?id=${message.id}`, {
          method: "DELETE",
        }),
      );
      setMessages(updated);
      if (editingId === message.id) cancelEdit();
      setNotice({ tone: "success", text: "Topluluk mesajı silindi." });
    } catch (error) {
      setNotice({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "Topluluk mesajı silinemedi.",
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="admin-panel admin-panel--wide admin-community-panel">
      <div className="admin-panel__heading">
        <div>
          <p className="section-kicker">TOPLULUK YÖNETİMİ</p>
          <h2>Mesajları düzenle veya sil</h2>
        </div>
        <span>{messages.length} MESAJ</span>
      </div>

      <p className="admin-community-intro">
        Ziyaretçi mesajları uygun dil kontrolünden sonra doğrudan yayınlanır.
        Buradan konu ve yanıtları düzenleyebilir veya kaldırabilirsiniz.
      </p>

      {notice && (
        <p
          className={`admin-notice admin-notice--${notice.tone}`}
          role="status"
        >
          {notice.text}
        </p>
      )}

      {messages.length === 0 ? (
        <p className="admin-community-empty">
          Henüz gönderilmiş bir topluluk mesajı bulunmuyor.
        </p>
      ) : (
        <div className="admin-community-list">
          {messages.map((message) => {
            const isEditing = editingId === message.id && draft;
            return (
              <article className="admin-community-item" key={message.id}>
                <div className="admin-community-item__meta">
                  <span className="participant-status participant-status--approved">
                    YAYINDA
                  </span>
                  <span>{message.parentId ? "YANIT" : "KONU"}</span>
                  <span>{communityCategoryLabel(message.category)}</span>
                  <span>{formatDate(message.createdAt)}</span>
                </div>

                {isEditing ? (
                  <div className="admin-community-edit">
                    <label>
                      <span>Görünen ad</span>
                      <input
                        value={draft.displayName}
                        maxLength={40}
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            displayName: event.target.value,
                          })
                        }
                      />
                    </label>
                    {!message.parentId && (
                      <>
                        <label>
                          <span>Kategori</span>
                          <select
                            value={draft.category}
                            onChange={(event) =>
                              setDraft({
                                ...draft,
                                category: event.target
                                  .value as CommunityCategory,
                              })
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
                            value={draft.title}
                            maxLength={100}
                            onChange={(event) =>
                              setDraft({
                                ...draft,
                                title: event.target.value,
                              })
                            }
                          />
                        </label>
                      </>
                    )}
                    <label>
                      <span>{message.parentId ? "Yanıt" : "Mesaj"}</span>
                      <textarea
                        value={draft.body}
                        minLength={10}
                        maxLength={1000}
                        rows={5}
                        onChange={(event) =>
                          setDraft({ ...draft, body: event.target.value })
                        }
                      />
                    </label>
                    <div className="admin-community-edit__actions">
                      <button
                        type="button"
                        disabled={busyId === message.id}
                        onClick={() => saveEdit(message)}
                      >
                        {busyId === message.id
                          ? "Kaydediliyor…"
                          : "Değişiklikleri kaydet"}
                      </button>
                      <button type="button" onClick={cancelEdit}>
                        Vazgeç
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3>{message.title || "Konuya verilen yanıt"}</h3>
                    <p>{message.body}</p>
                    <div className="admin-community-item__footer">
                      <strong>{message.displayName}</strong>
                      <div>
                        <button
                          type="button"
                          disabled={busyId === message.id}
                          onClick={() => startEdit(message)}
                        >
                          Düzenle
                        </button>
                        <button
                          className="is-danger"
                          type="button"
                          disabled={busyId === message.id}
                          onClick={() => remove(message)}
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
