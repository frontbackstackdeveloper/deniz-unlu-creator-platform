"use client";

import { useCallback, useEffect, useState } from "react";

type Message = { id: number; displayName: string; body: string; createdAt: string };

export function LiveRoom({ embedUrl, isLive, user, isAdmin }: {
  embedUrl: string | null;
  isLive: boolean;
  user: { displayName: string } | null;
  isAdmin: boolean;
}) {
  const [viewers, setViewers] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const refreshMessages = useCallback(async () => {
    try {
      const response = await fetch("/api/live/messages", { cache: "no-store" });
      if (response.ok) {
        setMessages(((await response.json()) as { messages: Message[] }).messages);
        setNotice("");
      } else {
        setNotice(response.status === 429 ? "Sohbetin günlük kullanım sınırına ulaşıldı. Daha sonra tekrar deneyin." : "Sohbet şu an güncellenemiyor. Biraz sonra tekrar deneyin.");
      }
    } catch { setNotice("Bağlantı kesildi. Sohbet geçici olarak güncellenemiyor."); }
  }, []);

  useEffect(() => {
    if (!embedUrl) return;
    const heartbeat = async () => {
      try {
        const response = await fetch("/api/live/presence", {
          method: "POST",
        });
        if (response.ok) setViewers(((await response.json()) as { viewers: number }).viewers);
      } catch { /* Show the previous count during a temporary network failure. */ }
    };
    void heartbeat();
    const timer = window.setInterval(heartbeat, 60_000);
    return () => window.clearInterval(timer);
  }, [embedUrl]);

  useEffect(() => {
    if (!embedUrl) return;
    void refreshMessages();
    const timer = window.setInterval(refreshMessages, 30_000);
    return () => window.clearInterval(timer);
  }, [embedUrl, refreshMessages]);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim() || busy) return;
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/live/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Mesaj gönderilemedi.");
      setBody("");
      await refreshMessages();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Mesaj gönderilemedi.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteMessage(id: number) {
    if (!window.confirm("Bu sohbet mesajı silinsin mi?")) return;
    const response = await fetch("/api/live/messages", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (response.ok) await refreshMessages();
    else setNotice("Mesaj silinemedi.");
  }

  return (
    <section className="live-room shell" aria-label="Canlı yayın odası">
      <div className="live-room__player-card">
        <div className="live-room__topline">
          <span className={embedUrl ? "live-room__badge live-room__badge--on" : "live-room__badge"}>
            <i /> {embedUrl ? "YAYINDA" : "YAYIN BEKLENİYOR"}
          </span>
          <span className="live-room__viewers">{viewers === null ? "—" : viewers} izleyici</span>
        </div>
        {embedUrl ? (
          <iframe className="live-room__player" src={embedUrl} title="Deniz Ünlü Rumble canlı yayını" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
        ) : (
          <div className="live-room__empty">
            <span aria-hidden="true">✦</span>
            <h2>{isLive ? "Rumble oynatıcısı bekleniyor" : "Deniz şu anda yayında değil"}</h2>
            <p>{isLive ? "Yönetim paneline Rumble paylaşımındaki /embed/ bağlantısı eklenmeli." : "Yayın başladığında bu sayfadan izleyebilirsin."}</p>
          </div>
        )}
      </div>
      <aside className="live-room__chat">
        <div className="live-room__chat-head"><span>CANLI SOHBET</span><small>Deniz Ünlü topluluğu</small></div>
        <div className="live-room__messages" aria-live="polite">
          {messages.length ? messages.map((message) => (
            <p key={message.id}><strong>{message.displayName}</strong> {message.body} {isAdmin && <button type="button" onClick={() => void deleteMessage(message.id)} aria-label="Mesajı sil" className="live-room__delete">Sil</button>}</p>
          )) : <p className="live-room__muted">Henüz mesaj yok. İlk mesajı sen yaz!</p>}
        </div>
        {!embedUrl ? <p className="live-room__chat-foot">Sohbet yayın başlayınca açılır.</p> : user ? (
          <form className="live-room__form" onSubmit={sendMessage}>
            <label htmlFor="live-message">{user.displayName} olarak yaz</label>
            <div><input id="live-message" value={body} onChange={(event) => setBody(event.target.value)} maxLength={300} placeholder="Mesajın..." /><button disabled={busy || body.trim().length < 2}>Gönder</button></div>
            {notice && <small role="alert">{notice}</small>}
          </form>
        ) : <a className="live-room__chat-foot live-room__signin" href="/signin-with-chatgpt?return_to=%2Fyayin" target="_top">İzlemek ücretsiz · Mesaj yazmak için giriş yap →</a>}
      </aside>
    </section>
  );
}
