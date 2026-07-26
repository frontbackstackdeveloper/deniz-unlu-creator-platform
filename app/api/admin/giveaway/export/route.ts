import { getAdminSession } from "../../../../admin/admin-auth";
import { getAdminGiveawayData } from "../../../../../db/giveaway-store";

export const dynamic = "force-dynamic";

function csvCell(value: string | number) {
  const safe = String(value).replaceAll('"', '""');
  return `"${safe}"`;
}

export async function GET() {
  const { isAdmin } = await getAdminSession();
  if (!isAdmin) {
    return Response.json({ error: "Bu işlem için yönetici girişi gerekiyor." }, {
      status: 401,
    });
  }

  const data = await getAdminGiveawayData();
  const rows = [
    [
      "Sıra",
      "Ad soyad",
      "E-posta",
      "YouTube onayı",
      "WhatsApp onayı",
      "Durum",
      "Katılım tarihi",
    ],
    ...data.entries.map((entry, index) => [
      index + 1,
      entry.participantName,
      entry.email,
      entry.youtubeConfirmed ? "Evet" : "Hayır",
      entry.whatsappConfirmed ? "Evet" : "Hayır",
      entry.status,
      entry.createdAt,
    ]),
  ];

  const csv = `\uFEFF${rows
    .map((row) => row.map((cell) => csvCell(cell)).join(";"))
    .join("\r\n")}`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="deniz-unlu-cekilis-katilimcilari.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
