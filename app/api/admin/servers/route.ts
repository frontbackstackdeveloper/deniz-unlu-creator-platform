import { getAdminSession } from "../../../admin/admin-auth";
import {
  createManagedServer,
  deleteManagedServer,
  getManagedContent,
  updateManagedServer,
} from "../../../../db/content-store";
import type { ManagedServer } from "../../../managed-content";

export const dynamic = "force-dynamic";

function unauthorized() {
  return Response.json({ error: "Bu işlem için yönetici girişi gerekiyor." }, {
    status: 401,
  });
}

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeUrl(value: unknown) {
  const raw = text(value, 500);
  if (!raw) return "";
  const parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Sunucu bağlantısı geçerli değil.");
  }

  return parsed.toString();
}

function readServer(value: unknown, requireId: boolean): ManagedServer {
  if (!value || typeof value !== "object") {
    throw new Error("Sunucu bilgileri geçersiz.");
  }

  const input = value as Record<string, unknown>;
  const id = Number(input.id);
  const name = text(input.name, 80);

  if (requireId && (!Number.isInteger(id) || id <= 0)) {
    throw new Error("Sunucu kimliği geçersiz.");
  }
  if (!name) throw new Error("Sunucu adı boş bırakılamaz.");

  return {
    id: requireId ? id : 0,
    name,
    code: text(input.code, 8).toLocaleUpperCase("tr-TR") || "—",
    status: text(input.status, 40).toLocaleUpperCase("tr-TR") || "AKTİF",
    detail: text(input.detail, 240),
    url: normalizeUrl(input.url),
    sortOrder: Number.isFinite(Number(input.sortOrder))
      ? Math.max(0, Math.floor(Number(input.sortOrder)))
      : 0,
    isVisible: input.isVisible !== false,
  };
}

export async function POST(request: Request) {
  const { isAdmin } = await getAdminSession();
  if (!isAdmin) return unauthorized();

  try {
    const server = readServer(await request.json(), false);
    const id = await createManagedServer({
      name: server.name,
      code: server.code,
      status: server.status,
      detail: server.detail,
      url: server.url,
      isVisible: server.isVisible,
    });

    return Response.json({ id, ...(await getManagedContent()) }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Sunucu eklenemedi.",
      },
      { status: 400 },
    );
  }
}

export async function PUT(request: Request) {
  const { isAdmin } = await getAdminSession();
  if (!isAdmin) return unauthorized();

  try {
    const server = readServer(await request.json(), true);
    await updateManagedServer(server);
    return Response.json(await getManagedContent());
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Sunucu güncellenemedi.",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const { isAdmin } = await getAdminSession();
  if (!isAdmin) return unauthorized();

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "Sunucu kimliği geçersiz." }, {
      status: 400,
    });
  }

  await deleteManagedServer(id);
  return Response.json(await getManagedContent());
}
