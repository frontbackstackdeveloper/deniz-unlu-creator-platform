import { getD1 } from "../../../../db/index";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { containsBlockedCommunityLanguage } from "../../../community-moderation";
import { getAdminSession } from "../../../admin/admin-auth";
import { getPublicManagedContent } from "../../../../db/content-store";
import { managedLinksToMap } from "../../../managed-content";
import { rumbleEmbedUrl } from "../../../rumble";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await getD1().prepare(
    "SELECT id, display_name AS displayName, body, created_at AS createdAt FROM live_messages ORDER BY id DESC LIMIT 40",
  ).all();
  return Response.json({ messages: result.results.reverse() }, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Mesaj yazmak için giriş yapın." }, { status: 401 });
  const links = managedLinksToMap((await getPublicManagedContent()).links);
  if (!rumbleEmbedUrl(links.live)) {
    return Response.json({ error: "Sohbet yalnızca yayın sırasında açıktır." }, { status: 403 });
  }
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: "Geçersiz kaynak." }, { status: 403 });
  }
  let body: unknown;
  try {
    ({ body } = await request.json());
  } catch {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }
  if (typeof body !== "string" || body.trim().length < 2 || body.length > 300 ||
      containsBlockedCommunityLanguage(user.displayName, "", body)) {
    return Response.json({ error: "Mesaj 2-300 karakter olmalı ve uygun dil içermelidir." }, { status: 400 });
  }
  const db = getD1();
  const recent = await db.prepare(
    "SELECT COUNT(*) AS n FROM live_messages WHERE user_email = ? AND created_at > datetime('now', '-10 seconds')",
  ).bind(user.email).first<{ n: number }>();
  if ((recent?.n ?? 0) > 0) {
    return Response.json({ error: "Yeni mesaj için 10 saniye bekleyin." }, { status: 429 });
  }
  await db.prepare(
    "INSERT INTO live_messages (user_email, display_name, body) VALUES (?, ?, ?)",
  ).bind(user.email, user.displayName.slice(0, 40), body.trim()).run();
  return Response.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const { isAdmin } = await getAdminSession();
  if (!isAdmin) return Response.json({ error: "Yetkisiz işlem." }, { status: 401 });
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: "Geçersiz kaynak." }, { status: 403 });
  }
  const { id } = await request.json() as { id?: number };
  if (!Number.isInteger(id) || !id || id < 1) {
    return Response.json({ error: "Geçersiz mesaj." }, { status: 400 });
  }
  await getD1().prepare("DELETE FROM live_messages WHERE id = ?").bind(id).run();
  return Response.json({ ok: true });
}
