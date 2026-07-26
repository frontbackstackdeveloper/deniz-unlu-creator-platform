import {
  communityCategories,
  type CommunityCategory,
} from "../../community";
import { containsBlockedCommunityLanguage } from "../../community-moderation";
import { verifyTurnstileToken } from "../../turnstile";
import { createCommunityMessage } from "../../../db/community-store";

export const dynamic = "force-dynamic";

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return Response.json({ error: "Geçersiz istek kaynağı." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Gönderilen bilgiler okunamadı." }, {
      status: 400,
    });
  }

  if (text(body.website, 200)) {
    return Response.json({ ok: true }, { status: 201 });
  }

  const parentIdValue = Number(body.parentId);
  const parentId =
    Number.isInteger(parentIdValue) && parentIdValue > 0
      ? parentIdValue
      : null;
  const categoryValue = text(body.category, 20);
  const category = communityCategories.includes(
    categoryValue as CommunityCategory,
  )
    ? (categoryValue as CommunityCategory)
    : "tartisma";
  const displayName = text(body.displayName, 40);
  const title = text(body.title, 100);
  const messageBody = text(body.body, 1000);
  const turnstileToken = text(body.turnstileToken, 2048);

  if (displayName.length < 2) {
    return Response.json({ error: "Lütfen görünen adınızı yazın." }, {
      status: 400,
    });
  }
  if (!parentId && title.length < 4) {
    return Response.json({ error: "Başlık en az 4 karakter olmalıdır." }, {
      status: 400,
    });
  }
  if (messageBody.length < 10) {
    return Response.json({ error: "Mesaj en az 10 karakter olmalıdır." }, {
      status: 400,
    });
  }
  if (containsBlockedCommunityLanguage(displayName, title, messageBody)) {
    return Response.json(
      {
        error:
          "Mesajınız uygun olmayan bir ifade içeriyor. Lütfen düzenleyip tekrar gönderin.",
      },
      { status: 400 },
    );
  }

  const turnstile = await verifyTurnstileToken(
    turnstileToken,
    request,
    "community_post",
  );
  if (!turnstile.success) {
    return Response.json(
      {
        error: turnstile.configurationMissing
          ? "Güvenlik doğrulaması henüz yapılandırılmadı."
          : "Güvenlik doğrulaması başarısız oldu. Lütfen tekrar deneyin.",
      },
      { status: turnstile.configurationMissing ? 503 : 400 },
    );
  }

  try {
    const id = await createCommunityMessage({
      parentId,
      category,
      displayName,
      title,
      body: messageBody,
    });
    return Response.json(
      {
        ok: true,
        id,
        message: "Mesajınız yayınlandı ve toplulukta görünmeye başladı.",
      },
      { status: 201 },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Mesaj kaydedilemedi.",
      },
      { status: 400 },
    );
  }
}
