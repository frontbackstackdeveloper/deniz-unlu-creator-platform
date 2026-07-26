import { getAdminSession } from "../../../admin/admin-auth";
import {
  communityCategories,
  communityStatuses,
  type CommunityCategory,
  type CommunityStatus,
} from "../../../community";
import { containsBlockedCommunityLanguage } from "../../../community-moderation";
import {
  deleteCommunityMessage,
  getAdminCommunityMessages,
  moderateCommunityMessage,
  updateCommunityMessage,
} from "../../../../db/community-store";

export const dynamic = "force-dynamic";

function unauthorized() {
  return Response.json(
    { error: "Bu işlem için yönetici girişi gerekiyor." },
    { status: 401 },
  );
}

function validId(value: unknown) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET() {
  const { isAdmin } = await getAdminSession();
  if (!isAdmin) return unauthorized();
  return Response.json({ messages: await getAdminCommunityMessages() });
}

export async function PATCH(request: Request) {
  const { isAdmin } = await getAdminSession();
  if (!isAdmin) return unauthorized();

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Gönderilen bilgiler okunamadı." }, {
      status: 400,
    });
  }

  const id = validId(body.id);
  const action = typeof body.action === "string" ? body.action : "status";
  if (action === "edit") {
    const categoryValue =
      typeof body.category === "string" ? body.category.trim() : "";
    const category = communityCategories.includes(
      categoryValue as CommunityCategory,
    )
      ? (categoryValue as CommunityCategory)
      : "tartisma";
    const displayName =
      typeof body.displayName === "string"
        ? body.displayName.trim().slice(0, 40)
        : "";
    const title =
      typeof body.title === "string" ? body.title.trim().slice(0, 100) : "";
    const messageBody =
      typeof body.body === "string" ? body.body.trim().slice(0, 1000) : "";

    if (
      !id ||
      displayName.length < 2 ||
      messageBody.length < 10 ||
      containsBlockedCommunityLanguage(displayName, title, messageBody)
    ) {
      return Response.json(
        { error: "Mesaj bilgileri eksik veya uygun değil." },
        { status: 400 },
      );
    }

    try {
      await updateCommunityMessage({
        id,
        category,
        displayName,
        title,
        body: messageBody,
      });
      return Response.json({ messages: await getAdminCommunityMessages() });
    } catch (error) {
      return Response.json(
        {
          error:
            error instanceof Error ? error.message : "Mesaj düzenlenemedi.",
        },
        { status: 400 },
      );
    }
  }

  const status = typeof body.status === "string" ? body.status : "";
  if (
    !id ||
    !communityStatuses.includes(status as CommunityStatus)
  ) {
    return Response.json({ error: "Topluluk işlemi geçersiz." }, {
      status: 400,
    });
  }

  try {
    await moderateCommunityMessage(id, status as CommunityStatus);
    return Response.json({ messages: await getAdminCommunityMessages() });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Mesaj güncellenemedi.",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const { isAdmin } = await getAdminSession();
  if (!isAdmin) return unauthorized();

  const id = validId(new URL(request.url).searchParams.get("id"));
  if (!id) {
    return Response.json({ error: "Mesaj kimliği geçersiz." }, {
      status: 400,
    });
  }

  try {
    await deleteCommunityMessage(id);
    return Response.json({ messages: await getAdminCommunityMessages() });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Mesaj silinemedi.",
      },
      { status: 400 },
    );
  }
}
