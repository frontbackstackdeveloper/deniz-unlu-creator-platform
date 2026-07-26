import { createGiveawayEntry } from "../../../../db/giveaway-store";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { normalizeGmailAddress } from "../../../gmail";
import { verifyTurnstileToken } from "../../../turnstile";

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

  const authenticatedUser = await getChatGPTUser();
  if (!authenticatedUser) {
    return Response.json(
      {
        error:
          "Katılmak için önce Gmail hesabınızla güvenli giriş yapmalısınız.",
      },
      { status: 401 },
    );
  }

  const email = normalizeGmailAddress(authenticatedUser.email);
  if (!email) {
    return Response.json(
      { error: "Yalnızca doğrulanmış bir @gmail.com hesabıyla katılabilirsiniz." },
      { status: 400 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Katılım bilgileri okunamadı." }, {
      status: 400,
    });
  }

  if (text(body.website, 200)) {
    return Response.json({ ok: true }, { status: 201 });
  }

  const giveawayId = Number(body.giveawayId);
  const participantName = text(body.participantName, 80);
  const youtubeConfirmed = body.youtubeConfirmed === true;
  const whatsappConfirmed = body.whatsappConfirmed === true;
  const privacyAcknowledged = body.privacyAcknowledged === true;
  const termsAccepted = body.termsAccepted === true;
  const turnstileToken = text(body.turnstileToken, 2048);

  if (!Number.isInteger(giveawayId) || giveawayId <= 0) {
    return Response.json({ error: "Çekiliş bilgisi geçersiz." }, { status: 400 });
  }
  if (participantName.length < 2) {
    return Response.json({ error: "Lütfen adınızı yazın." }, { status: 400 });
  }
  if (
    !youtubeConfirmed ||
    !whatsappConfirmed ||
    !privacyAcknowledged ||
    !termsAccepted
  ) {
    return Response.json(
      { error: "Katılım koşullarının tamamını onaylamalısınız." },
      { status: 400 },
    );
  }

  const turnstile = await verifyTurnstileToken(
    turnstileToken,
    request,
    "giveaway_entry",
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
    await createGiveawayEntry({
      giveawayId,
      participantName,
      email,
      youtubeConfirmed,
      whatsappConfirmed,
      termsAccepted,
    });
    return Response.json(
      {
        ok: true,
        message: "Katılımınız kaydedildi. Bol şans!",
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Katılım kaydedilemedi.";
    return Response.json(
      { error: message },
      { status: /daha önce/.test(message) ? 409 : 400 },
    );
  }
}
