import { getAdminSession } from "../../../admin/admin-auth";
import {
  defaultManagedLinks,
  managedLinkKeys,
  type ManagedSocialLink,
} from "../../../managed-content";
import {
  getManagedContent,
  saveManagedLinks,
} from "../../../../db/content-store";
import { isYouTubeChannelUrl } from "../../../youtube";

export const dynamic = "force-dynamic";

function unauthorized() {
  return Response.json({ error: "Bu işlem için yönetici girişi gerekiyor." }, {
    status: 401,
  });
}

function normalizeUrl(value: unknown) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "";
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const parsed = new URL(withProtocol);

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Bağlantı http veya https ile başlamalıdır.");
  }

  return parsed.toString();
}

export async function GET() {
  const { isAdmin } = await getAdminSession();
  if (!isAdmin) return unauthorized();

  return Response.json(await getManagedContent());
}

export async function PUT(request: Request) {
  const { isAdmin } = await getAdminSession();
  if (!isAdmin) return unauthorized();

  let body: { links?: unknown };
  try {
    body = (await request.json()) as { links?: unknown };
  } catch {
    return Response.json({ error: "Gönderilen bilgiler okunamadı." }, {
      status: 400,
    });
  }

  if (!Array.isArray(body.links)) {
    return Response.json({ error: "Bağlantı listesi geçersiz." }, {
      status: 400,
    });
  }

  try {
    const submitted = new Map<string, Record<string, unknown>>();
    for (const item of body.links) {
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        if (typeof record.key === "string") submitted.set(record.key, record);
      }
    }

    const links: ManagedSocialLink[] = defaultManagedLinks.map((fallback) => {
      const item = submitted.get(fallback.key);
      const url = normalizeUrl(item?.url);
      if (fallback.key === "youtube" && url && !isYouTubeChannelUrl(url)) {
        throw new Error(
          "YouTube alanına kanal ana sayfasının bağlantısını yazın.",
        );
      }

      return {
        ...fallback,
        url,
        isActive: Boolean(item?.isActive) && url.length > 0,
      };
    });

    const hasUnknownKey = [...submitted.keys()].some(
      (key) => !managedLinkKeys.includes(key as (typeof managedLinkKeys)[number]),
    );
    if (hasUnknownKey) {
      return Response.json({ error: "Desteklenmeyen bir bağlantı türü gönderildi." }, {
        status: 400,
      });
    }

    return Response.json(await saveManagedLinks(links));
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Bağlantılar kaydedilemedi.",
      },
      { status: 400 },
    );
  }
}
