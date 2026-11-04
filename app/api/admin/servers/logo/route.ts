import { getAdminSession } from "../../../../admin/admin-auth";
import {
  getManagedContent,
  getManagedServerLogoKey,
  setManagedServerLogoKey,
} from "../../../../../db/content-store";
import { getServerLogoBucket, MAX_SERVER_LOGO_BYTES, validateServerLogo } from "../../../../server-logos";

export const dynamic = "force-dynamic";

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

function serverId(value: unknown) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new Error("Sunucu kimliği geçersiz.");
  return id;
}

async function authorize(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Geçersiz istek kaynağı." }, { status: 403 });
  if (!(await getAdminSession()).isAdmin) {
    return Response.json({ error: "Yönetici girişi gerekiyor." }, { status: 401 });
  }
  return null;
}

export async function POST(request: Request) {
  const rejection = await authorize(request);
  if (rejection) return rejection;

  try {
    const form = await request.formData();
    const id = serverId(form.get("serverId"));
    const file = form.get("logo");
    if (!(file instanceof File)) throw new Error("PNG dosyası seçin.");
    if (file.size > MAX_SERVER_LOGO_BYTES) throw new Error("PNG görseli 2 MB veya daha küçük olmalı.");
    const previousKey = await getManagedServerLogoKey(id);
    if (previousKey === null) throw new Error("Sunucu bulunamadı.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    validateServerLogo(bytes);

    const bucket = getServerLogoBucket();
    const key = `server-logos/${id}/${crypto.randomUUID()}.png`;
    await bucket.put(key, bytes, { httpMetadata: { contentType: "image/png" } });
    try {
      await setManagedServerLogoKey(id, key);
    } catch (error) {
      await bucket.delete(key);
      throw error;
    }
    if (previousKey) await bucket.delete(previousKey).catch(() => undefined);
    return Response.json(await getManagedContent());
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Logo yüklenemedi." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const rejection = await authorize(request);
  if (rejection) return rejection;

  try {
    const id = serverId(new URL(request.url).searchParams.get("serverId"));
    const previousKey = await getManagedServerLogoKey(id);
    if (previousKey === null) throw new Error("Sunucu bulunamadı.");
    await setManagedServerLogoKey(id, "");
    if (previousKey) await getServerLogoBucket().delete(previousKey).catch(() => undefined);
    return Response.json(await getManagedContent());
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Logo kaldırılamadı." }, { status: 400 });
  }
}
