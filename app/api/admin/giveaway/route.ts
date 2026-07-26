import { getAdminSession } from "../../../admin/admin-auth";
import {
  drawGiveawayWinner,
  getAdminGiveawayData,
  purgeGiveawayEntries,
  saveGiveaway,
} from "../../../../db/giveaway-store";
import {
  giveawayStatuses,
  type Giveaway,
  type GiveawayStatus,
} from "../../../giveaway";

export const dynamic = "force-dynamic";

function unauthorized() {
  return Response.json({ error: "Bu işlem için yönetici girişi gerekiyor." }, {
    status: 401,
  });
}

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function date(value: unknown) {
  const raw = text(value, 40);
  if (!raw) return "";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Tarih bilgisi geçersiz.");
  }
  return parsed.toISOString();
}

function readGiveaway(value: unknown): Omit<Giveaway, "createdAt" | "updatedAt"> {
  if (!value || typeof value !== "object") {
    throw new Error("Çekiliş bilgileri geçersiz.");
  }

  const input = value as Record<string, unknown>;
  const title = text(input.title, 120);
  const description = text(input.description, 1200);
  const prize = text(input.prize, 240);
  const status = text(input.status, 20) as GiveawayStatus;
  const targetEntries = Math.floor(Number(input.targetEntries));
  const startsAt = date(input.startsAt);
  const endsAt = date(input.endsAt);

  if (!title) throw new Error("Çekiliş başlığı boş bırakılamaz.");
  if (!prize) throw new Error("Ödül bilgisi boş bırakılamaz.");
  if (!giveawayStatuses.includes(status)) {
    throw new Error("Çekiliş durumu geçersiz.");
  }
  if (
    !Number.isInteger(targetEntries) ||
    targetEntries < 2 ||
    targetEntries > 10_000
  ) {
    throw new Error("Katılımcı hedefi 2 ile 10.000 arasında olmalı.");
  }
  if (startsAt && endsAt && new Date(startsAt) >= new Date(endsAt)) {
    throw new Error("Bitiş tarihi başlangıç tarihinden sonra olmalı.");
  }

  const id = Number(input.id);
  return {
    id: Number.isInteger(id) && id > 0 ? id : 0,
    title,
    description,
    prize,
    status,
    targetEntries,
    startsAt,
    endsAt,
  };
}

export async function GET() {
  const { isAdmin } = await getAdminSession();
  if (!isAdmin) return unauthorized();
  return Response.json(await getAdminGiveawayData());
}

export async function PUT(request: Request) {
  const { isAdmin } = await getAdminSession();
  if (!isAdmin) return unauthorized();

  try {
    return Response.json(await saveGiveaway(readGiveaway(await request.json())));
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Çekiliş kaydedilemedi.",
      },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  const { isAdmin } = await getAdminSession();
  if (!isAdmin) return unauthorized();

  try {
    const body = (await request.json()) as { action?: unknown };
    const action = text(body.action, 20);
    if (action === "purge") {
      return Response.json(await purgeGiveawayEntries());
    }
    if (action !== "draw" && action !== "redraw") {
      return Response.json({ error: "İşlem geçersiz." }, { status: 400 });
    }

    return Response.json(await drawGiveawayWinner(action === "redraw"));
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Kazanan seçilemedi.",
      },
      { status: 400 },
    );
  }
}
