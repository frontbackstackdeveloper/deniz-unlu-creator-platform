"use client";

import { useState } from "react";
import type {
  ManagedServer,
  ManagedSocialLink,
} from "../managed-content";

type AdminContentManagerProps = {
  initialLinks: ManagedSocialLink[];
  initialServers: ManagedServer[];
};

type Notice = {
  tone: "success" | "error";
  text: string;
} | null;

async function readJson(response: Response) {
  const data = (await response.json()) as {
    error?: string;
    links?: ManagedSocialLink[];
    servers?: ManagedServer[];
  };

  if (!response.ok) {
    throw new Error(data.error || "İşlem tamamlanamadı.");
  }

  return data;
}

export function AdminContentManager({
  initialLinks,
  initialServers,
}: AdminContentManagerProps) {
  const [links, setLinks] = useState(initialLinks);
  const [servers, setServers] = useState(initialServers);
  const [linkNotice, setLinkNotice] = useState<Notice>(null);
  const [serverNotice, setServerNotice] = useState<Notice>(null);
  const [savingLinks, setSavingLinks] = useState(false);
  const [busyServerId, setBusyServerId] = useState<number | "new" | null>(null);
  const [newServer, setNewServer] = useState({
    name: "",
    code: "",
    status: "AKTİF",
    detail: "",
    url: "",
    isVisible: true,
  });

  function updateLink(
    key: ManagedSocialLink["key"],
    patch: Partial<ManagedSocialLink>,
  ) {
    setLinks((current) =>
      current.map((link) => (link.key === key ? { ...link, ...patch } : link)),
    );
  }

  async function saveLinks() {
    setSavingLinks(true);
    setLinkNotice(null);

    try {
      const data = await readJson(
        await fetch("/api/admin/content", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ links }),
        }),
      );
      if (data.links) setLinks(data.links);
      setLinkNotice({
        tone: "success",
        text: "Bağlantılar kaydedildi ve sitede güncellendi.",
      });
    } catch (error) {
      setLinkNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Bağlantılar kaydedilemedi.",
      });
    } finally {
      setSavingLinks(false);
    }
  }

  function updateServer(id: number, patch: Partial<ManagedServer>) {
    setServers((current) =>
      current.map((server) => (server.id === id ? { ...server, ...patch } : server)),
    );
  }

  async function saveServer(server: ManagedServer) {
    setBusyServerId(server.id);
    setServerNotice(null);

    try {
      const data = await readJson(
        await fetch("/api/admin/servers", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(server),
        }),
      );
      if (data.servers) setServers(data.servers);
      setServerNotice({
        tone: "success",
        text: `${server.name} güncellendi.`,
      });
    } catch (error) {
      setServerNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Sunucu güncellenemedi.",
      });
    } finally {
      setBusyServerId(null);
    }
  }

  async function addServer() {
    setBusyServerId("new");
    setServerNotice(null);

    try {
      const data = await readJson(
        await fetch("/api/admin/servers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newServer),
        }),
      );
      if (data.servers) setServers(data.servers);
      setNewServer({
        name: "",
        code: "",
        status: "AKTİF",
        detail: "",
        url: "",
        isVisible: true,
      });
      setServerNotice({ tone: "success", text: "Yeni sunucu eklendi." });
    } catch (error) {
      setServerNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Sunucu eklenemedi.",
      });
    } finally {
      setBusyServerId(null);
    }
  }

  async function removeServer(server: ManagedServer) {
    if (!window.confirm(`${server.name} sunucusunu silmek istiyor musunuz?`)) {
      return;
    }

    setBusyServerId(server.id);
    setServerNotice(null);

    try {
      const data = await readJson(
        await fetch(`/api/admin/servers?id=${server.id}`, {
          method: "DELETE",
        }),
      );
      if (data.servers) setServers(data.servers);
      setServerNotice({ tone: "success", text: `${server.name} silindi.` });
    } catch (error) {
      setServerNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Sunucu silinemedi.",
      });
    } finally {
      setBusyServerId(null);
    }
  }

  return (
    <div className="admin-manager">
      <section className="admin-panel admin-panel--wide">
        <div className="admin-panel__heading">
          <div>
            <p className="section-kicker">HIZLI ERİŞİM</p>
            <h2>Bağlantıları yönet</h2>
          </div>
          <span>KOD GEREKTİRMEZ</span>
        </div>

        <div className="admin-link-editor">
          {links.map((link) => (
            <div
              className={`admin-link-row${
                link.key === "live" ? " admin-link-row--live" : ""
              }`}
              key={link.key}
            >
              <span className="admin-link-row__mark">
                {link.key === "live"
                  ? "LIVE"
                  : link.label.slice(0, 2).toLocaleUpperCase("tr-TR")}
              </span>
              <label>
                <strong>{link.label}</strong>
                {link.key === "live" && (
                  <small>
                    Yayına başladığınızda doğrudan yayın bağlantısını yapıştırın.
                    Yayın bitince bu satırı kapatın.
                  </small>
                )}
                <input
                  type="url"
                  value={link.url}
                  onChange={(event) => {
                    const url = event.target.value;
                    updateLink(link.key, {
                      url,
                      ...(link.key === "live"
                        ? { isActive: url.trim().length > 0 }
                        : {}),
                    });
                  }}
                  placeholder={`${link.label} bağlantısını yazın`}
                  spellCheck={false}
                />
              </label>
              <label className="admin-switch">
                <input
                  type="checkbox"
                  checked={link.isActive}
                  disabled={!link.url.trim()}
                  onChange={(event) =>
                    updateLink(link.key, { isActive: event.target.checked })
                  }
                />
                <span aria-hidden="true" />
                <small>{link.isActive && link.url.trim() ? "Yayında" : "Kapalı"}</small>
              </label>
            </div>
          ))}
        </div>

        <div className="admin-editor-footer">
          {linkNotice ? (
            <p className={`admin-notice admin-notice--${linkNotice.tone}`}>
              {linkNotice.text}
            </p>
          ) : (
            <p>
              Canlı yayın bağlantısını eklediğinizde sitede “Yayına geç”
              duyurusu açılır. YouTube kanal bağlantısı değiştiğinde güncel
              videolar otomatik yenilenir.
            </p>
          )}
          <button
            className="button button--primary"
            type="button"
            disabled={savingLinks}
            onClick={saveLinks}
          >
            {savingLinks ? "Kaydediliyor…" : "Bağlantıları kaydet"}
          </button>
        </div>
      </section>

      <section className="admin-panel admin-panel--wide">
        <div className="admin-panel__heading">
          <div>
            <p className="section-kicker">AKTİF MACERA</p>
            <h2>Sunucuları yönet</h2>
          </div>
          <span>{servers.length} SUNUCU</span>
        </div>

        <div className="admin-server-editor">
          {servers.map((server) => (
            <article className="admin-server-row" key={server.id}>
              <div className="admin-server-row__top">
                <input
                  aria-label="Sunucu kısa kodu"
                  className="admin-server-code-input"
                  value={server.code}
                  onChange={(event) =>
                    updateServer(server.id, { code: event.target.value })
                  }
                  maxLength={8}
                />
                <label>
                  <span>Sunucu adı</span>
                  <input
                    value={server.name}
                    onChange={(event) =>
                      updateServer(server.id, { name: event.target.value })
                    }
                  />
                </label>
                <label>
                  <span>Durum</span>
                  <input
                    value={server.status}
                    onChange={(event) =>
                      updateServer(server.id, { status: event.target.value })
                    }
                  />
                </label>
                <label className="admin-switch admin-switch--server">
                  <input
                    type="checkbox"
                    checked={server.isVisible}
                    onChange={(event) =>
                      updateServer(server.id, { isVisible: event.target.checked })
                    }
                  />
                  <span aria-hidden="true" />
                  <small>{server.isVisible ? "Görünür" : "Gizli"}</small>
                </label>
              </div>
              <label>
                <span>Açıklama</span>
                <input
                  value={server.detail}
                  onChange={(event) =>
                    updateServer(server.id, { detail: event.target.value })
                  }
                />
              </label>
              <label>
                <span>Sunucu sitesi (isteğe bağlı)</span>
                <input
                  type="url"
                  value={server.url}
                  onChange={(event) =>
                    updateServer(server.id, { url: event.target.value })
                  }
                  placeholder="https://..."
                />
              </label>
              <div className="admin-server-row__actions">
                <button
                  type="button"
                  disabled={busyServerId === server.id}
                  onClick={() => saveServer(server)}
                >
                  {busyServerId === server.id ? "İşleniyor…" : "Değişiklikleri kaydet"}
                </button>
                <button
                  className="is-danger"
                  type="button"
                  disabled={busyServerId === server.id}
                  onClick={() => removeServer(server)}
                >
                  Sil
                </button>
              </div>
            </article>
          ))}

          <article className="admin-server-row admin-server-row--new">
            <p>YENİ SUNUCU EKLE</p>
            <div className="admin-server-row__top">
              <input
                aria-label="Yeni sunucu kısa kodu"
                className="admin-server-code-input"
                value={newServer.code}
                onChange={(event) =>
                  setNewServer((current) => ({
                    ...current,
                    code: event.target.value,
                  }))
                }
                placeholder="K2"
                maxLength={8}
              />
              <label>
                <span>Sunucu adı</span>
                <input
                  value={newServer.name}
                  onChange={(event) =>
                    setNewServer((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Sunucu adı"
                />
              </label>
              <label>
                <span>Durum</span>
                <input
                  value={newServer.status}
                  onChange={(event) =>
                    setNewServer((current) => ({
                      ...current,
                      status: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
            <label>
              <span>Açıklama</span>
              <input
                value={newServer.detail}
                onChange={(event) =>
                  setNewServer((current) => ({
                    ...current,
                    detail: event.target.value,
                  }))
                }
                placeholder="Sunucu hakkında kısa bilgi"
              />
            </label>
            <label>
              <span>Sunucu sitesi (isteğe bağlı)</span>
              <input
                type="url"
                value={newServer.url}
                onChange={(event) =>
                  setNewServer((current) => ({
                    ...current,
                    url: event.target.value,
                  }))
                }
                placeholder="https://..."
              />
            </label>
            <button
              className="button button--primary"
              type="button"
              disabled={busyServerId === "new" || !newServer.name.trim()}
              onClick={addServer}
            >
              {busyServerId === "new" ? "Ekleniyor…" : "Sunucuyu ekle"}
            </button>
          </article>
        </div>

        {serverNotice && (
          <p className={`admin-notice admin-notice--${serverNotice.tone}`}>
            {serverNotice.text}
          </p>
        )}
      </section>
    </div>
  );
}
