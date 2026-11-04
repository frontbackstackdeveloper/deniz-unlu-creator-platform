import { getManagedServerLogoKey } from "../../../../db/content-store";
import { getServerLogoBucket } from "../../../server-logos";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ serverId: string }> },
) {
  const id = Number((await context.params).serverId);
  if (!Number.isInteger(id) || id <= 0) return new Response(null, { status: 404 });
  const key = await getManagedServerLogoKey(id);
  if (!key) return new Response(null, { status: 404 });
  const object = await getServerLogoBucket().get(key);
  if (!object) return new Response(null, { status: 404 });
  return new Response(object.body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
