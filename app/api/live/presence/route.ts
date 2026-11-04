import { getD1 } from "../../../../db/index";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: "Geçersiz kaynak." }, { status: 403 });
  }

  const cookieValue = request.headers.get("cookie")?.match(/(?:^|;\s*)du_live_presence=([a-f0-9-]{36})(?:;|$)/)?.[1];
  const sessionId = cookieValue ?? crypto.randomUUID();

  const now = Math.floor(Date.now() / 1000);
  const db = getD1();
  await db.prepare(
    `INSERT INTO live_presence (session_id, last_seen_at) VALUES (?, ?)
     ON CONFLICT(session_id) DO UPDATE SET last_seen_at = excluded.last_seen_at`,
  ).bind(sessionId, now).run();
  if (Math.random() < 0.01) {
    await db.prepare("DELETE FROM live_presence WHERE last_seen_at < ?")
      .bind(now - 86_400).run();
  }
  const row = await db.prepare(
    "SELECT COUNT(*) AS active FROM live_presence WHERE last_seen_at >= ?",
  ).bind(now - 130).first<{ active: number }>();

  return Response.json({ viewers: (row?.active ?? 0) * 2 }, {
    headers: {
      "Cache-Control": "no-store",
      ...(!cookieValue ? { "Set-Cookie": `du_live_presence=${sessionId}; Path=/; Max-Age=86400; HttpOnly; SameSite=Lax${new URL(request.url).protocol === "https:" ? "; Secure" : ""}` } : {}),
    },
  });
}
