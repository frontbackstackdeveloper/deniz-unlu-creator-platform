import { getD1 } from "./index";
import type {
  AdminGiveawayData,
  Giveaway,
  GiveawayEntry,
  GiveawayStatus,
  PublicGiveaway,
} from "../app/giveaway";
import { getCachedPublicData, invalidatePublicData } from "./public-cache";

type GiveawayRow = {
  id: number;
  title: string;
  description: string;
  prize: string;
  status: string;
  target_entries: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
};

type EntryRow = {
  id: number;
  giveaway_id: number;
  participant_name: string;
  email: string;
  youtube_confirmed: number;
  whatsapp_confirmed: number;
  terms_accepted: number;
  status: string;
  created_at: string;
  updated_at: string;
};

let initializationPromise: Promise<void> | null = null;

async function initializeGiveawayStore() {
  const d1 = getD1();

  await d1.batch([
    d1.prepare(`
      CREATE TABLE IF NOT EXISTS giveaways (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        prize TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'draft',
        target_entries INTEGER NOT NULL DEFAULT 50,
        starts_at TEXT,
        ends_at TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `),
    d1.prepare(`
      CREATE TABLE IF NOT EXISTS giveaway_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        giveaway_id INTEGER NOT NULL,
        participant_name TEXT NOT NULL,
        email TEXT NOT NULL,
        youtube_confirmed INTEGER NOT NULL DEFAULT 0,
        whatsapp_confirmed INTEGER NOT NULL DEFAULT 0,
        terms_accepted INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'eligible',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (giveaway_id) REFERENCES giveaways(id) ON DELETE CASCADE
      )
    `),
    d1.prepare(`
      CREATE UNIQUE INDEX IF NOT EXISTS giveaway_entries_giveaway_email_unique
      ON giveaway_entries (giveaway_id, email)
    `),
    d1.prepare(`
      CREATE INDEX IF NOT EXISTS giveaway_entries_giveaway_status_idx
      ON giveaway_entries (giveaway_id, status)
    `),
  ]);

  const giveawayColumns = await d1
    .prepare("PRAGMA table_info(giveaways)")
    .all<{ name: string }>();
  if (!giveawayColumns.results.some((column) => column.name === "target_entries")) {
    await d1
      .prepare(
        "ALTER TABLE giveaways ADD COLUMN target_entries INTEGER NOT NULL DEFAULT 50",
      )
      .run();
  }

  const existing = await d1
    .prepare("SELECT id FROM giveaways ORDER BY id DESC LIMIT 1")
    .first<{ id: number }>();

  if (!existing) {
    await d1
      .prepare(
        `INSERT INTO giveaways
          (title, description, prize, status, target_entries, created_at, updated_at)
         VALUES (?, ?, ?, 'active', 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      )
      .bind(
        "Deniz Ünlü 1.000 EP Çekilişi",
        "YouTube kanalına abone olan ve WhatsApp kanalına katılan 50 kişi arasından kazanan otomatik çark ile belirlenir. Katılım şartları Deniz Ünlü tarafından manuel olarak kontrol edilir.",
        "1.000 EP",
      )
      .run();
  }
}

async function ensureGiveawayStore() {
  if (!initializationPromise) {
    initializationPromise = initializeGiveawayStore().catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }

  await initializationPromise;
}

function mapGiveaway(row: GiveawayRow): Giveaway {
  const allowedStatuses = new Set(["draft", "active", "closed", "completed"]);
  const status = allowedStatuses.has(row.status)
    ? (row.status as GiveawayStatus)
    : "draft";

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    prize: row.prize,
    status,
    targetEntries: Math.max(2, Number(row.target_entries || 50)),
    startsAt: row.starts_at ?? "",
    endsAt: row.ends_at ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEntry(row: EntryRow): GiveawayEntry {
  const status =
    row.status === "winner" || row.status === "disqualified"
      ? row.status
      : "eligible";

  return {
    id: row.id,
    giveawayId: row.giveaway_id,
    participantName: row.participant_name,
    email: row.email,
    youtubeConfirmed: row.youtube_confirmed === 1,
    whatsappConfirmed: row.whatsapp_confirmed === 1,
    termsAccepted: row.terms_accepted === 1,
    status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isOpen(giveaway: Giveaway) {
  if (giveaway.status !== "active") return false;
  const now = Date.now();
  const start = giveaway.startsAt ? new Date(giveaway.startsAt).getTime() : null;
  const end = giveaway.endsAt ? new Date(giveaway.endsAt).getTime() : null;

  if (start !== null && Number.isFinite(start) && now < start) return false;
  if (end !== null && Number.isFinite(end) && now > end) return false;
  return true;
}

function publicWinnerName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return parts[0] || "Kazanan";
  return `${parts[0]} ${parts.at(-1)?.slice(0, 1).toLocaleUpperCase("tr-TR")}.`;
}

async function latestGiveaway(includeDraft: boolean, initialize = true) {
  if (initialize) {
    await ensureGiveawayStore();
  }
  const where = includeDraft ? "" : "WHERE status <> 'draft'";
  const row = await getD1()
    .prepare(
      `SELECT id, title, description, prize, status, target_entries, starts_at, ends_at,
              created_at, updated_at
       FROM giveaways
       ${where}
       ORDER BY
         CASE status WHEN 'active' THEN 0 WHEN 'closed' THEN 1 ELSE 2 END,
         id DESC
       LIMIT 1`,
    )
    .first<GiveawayRow>();

  return row ? mapGiveaway(row) : null;
}

async function entriesForGiveaway(giveawayId: number) {
  const result = await getD1()
    .prepare(
      `SELECT id, giveaway_id, participant_name, email, youtube_confirmed,
              whatsapp_confirmed, terms_accepted, status, created_at, updated_at
       FROM giveaway_entries
       WHERE giveaway_id = ?
       ORDER BY id DESC`,
    )
    .bind(giveawayId)
    .all<EntryRow>();

  return result.results.map(mapEntry);
}

export async function getAdminGiveawayData(): Promise<AdminGiveawayData> {
  const giveaway = await latestGiveaway(true);
  return {
    giveaway,
    entries: giveaway ? await entriesForGiveaway(giveaway.id) : [],
  };
}

async function loadPublicGiveaway(): Promise<PublicGiveaway | null> {
  const giveaway = await latestGiveaway(false, false);
  if (!giveaway) return null;

  const [countRow, winnerRow] = await Promise.all([
    getD1()
      .prepare(
        `SELECT COUNT(*) AS value
         FROM giveaway_entries
         WHERE giveaway_id = ? AND status <> 'disqualified'`,
      )
      .bind(giveaway.id)
      .first<{ value: number }>(),
    getD1()
      .prepare(
        `SELECT participant_name
         FROM giveaway_entries
         WHERE giveaway_id = ? AND status = 'winner'
         ORDER BY id DESC LIMIT 1`,
      )
      .bind(giveaway.id)
      .first<{ participant_name: string }>(),
  ]);

  return {
    ...giveaway,
    entryCount: Number(countRow?.value ?? 0),
    isOpen:
      isOpen(giveaway) &&
      Number(countRow?.value ?? 0) < giveaway.targetEntries,
    winnerDisplayName: winnerRow
      ? publicWinnerName(winnerRow.participant_name)
      : null,
  };
}

export function getPublicGiveaway(): Promise<PublicGiveaway | null> {
  return getCachedPublicData(
    "giveaway-public",
    10_000,
    loadPublicGiveaway,
  );
}

export async function saveGiveaway(
  input: Omit<Giveaway, "createdAt" | "updatedAt">,
) {
  await ensureGiveawayStore();
  const d1 = getD1();

  if (input.id > 0) {
    const result = await d1
      .prepare(
        `UPDATE giveaways SET
          title = ?, description = ?, prize = ?, status = ?,
          target_entries = ?, starts_at = ?, ends_at = ?,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
      )
      .bind(
        input.title,
        input.description,
        input.prize,
        input.status,
        input.targetEntries,
        input.startsAt || null,
        input.endsAt || null,
        input.id,
      )
      .run();

    if (Number(result.meta.changes ?? 0) === 0) {
      throw new Error("Çekiliş bulunamadı.");
    }
  } else {
    await d1
      .prepare(
        `INSERT INTO giveaways
          (title, description, prize, status, target_entries, starts_at, ends_at,
           created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      )
      .bind(
        input.title,
        input.description,
        input.prize,
        input.status,
        input.targetEntries,
        input.startsAt || null,
        input.endsAt || null,
      )
      .run();
  }

  invalidatePublicData("giveaway-public");
  return getAdminGiveawayData();
}

export async function createGiveawayEntry(input: {
  giveawayId: number;
  participantName: string;
  email: string;
  youtubeConfirmed: boolean;
  whatsappConfirmed: boolean;
  termsAccepted: boolean;
}) {
  await ensureGiveawayStore();
  const row = await getD1()
    .prepare(
      `SELECT id, title, description, prize, status, target_entries, starts_at, ends_at,
              created_at, updated_at
       FROM giveaways WHERE id = ?`,
    )
    .bind(input.giveawayId)
    .first<GiveawayRow>();

  const giveaway = row ? mapGiveaway(row) : null;
  if (!giveaway || !isOpen(giveaway)) {
    throw new Error("Bu çekiliş şu anda katılıma açık değil.");
  }

  try {
    const result = await getD1()
      .prepare(
        `INSERT INTO giveaway_entries
          (giveaway_id, participant_name, email, youtube_confirmed,
           whatsapp_confirmed, terms_accepted, status, created_at, updated_at)
         SELECT ?, ?, ?, ?, ?, ?, 'eligible', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
         WHERE (
           SELECT COUNT(*) FROM giveaway_entries
           WHERE giveaway_id = ? AND status <> 'disqualified'
         ) < (
           SELECT target_entries FROM giveaways WHERE id = ?
         )`,
      )
      .bind(
        input.giveawayId,
        input.participantName,
        input.email,
        input.youtubeConfirmed ? 1 : 0,
        input.whatsappConfirmed ? 1 : 0,
        input.termsAccepted ? 1 : 0,
        input.giveawayId,
        input.giveawayId,
      )
      .run();

    if (Number(result.meta.changes ?? 0) === 0) {
      throw new Error(
        `Çekiliş ${giveaway.targetEntries} katılımcıya ulaştı ve katılım kapandı.`,
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/unique|constraint/i.test(message)) {
      throw new Error("Bu e-posta adresiyle daha önce katılım yapılmış.");
    }
    throw error;
  }

  const countRow = await getD1()
    .prepare(
      `SELECT COUNT(*) AS value
       FROM giveaway_entries
       WHERE giveaway_id = ? AND status <> 'disqualified'`,
    )
    .bind(input.giveawayId)
    .first<{ value: number }>();

  if (Number(countRow?.value ?? 0) >= giveaway.targetEntries) {
    await drawWinnerForGiveaway(input.giveawayId, false);
  }
  invalidatePublicData("giveaway-public");
}

async function drawWinnerForGiveaway(giveawayId: number, redraw: boolean) {
  await ensureGiveawayStore();
  const entries = await entriesForGiveaway(giveawayId);
  const currentWinner = entries.find((entry) => entry.status === "winner");
  if (currentWinner && !redraw) {
    throw new Error("Bu çekiliş için kazanan zaten belirlendi.");
  }

  const d1 = getD1();
  if (currentWinner && redraw) {
    await d1
      .prepare(
        `UPDATE giveaway_entries
         SET status = 'disqualified', updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
      )
      .bind(currentWinner.id)
      .run();
  }

  const winner = await d1
    .prepare(
      `SELECT id
       FROM giveaway_entries
       WHERE giveaway_id = ? AND status = 'eligible'
       ORDER BY RANDOM()
       LIMIT 1`,
    )
    .bind(giveawayId)
    .first<{ id: number }>();

  if (!winner) {
    throw new Error("Kazanan seçmek için uygun katılımcı bulunmuyor.");
  }

  await d1.batch([
    d1
      .prepare(
        `UPDATE giveaway_entries
         SET status = 'winner', updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
      )
      .bind(winner.id),
    d1
      .prepare(
        `UPDATE giveaways
         SET status = 'completed', updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
      )
      .bind(giveawayId),
  ]);
  invalidatePublicData("giveaway-public");
}

export async function drawGiveawayWinner(redraw: boolean) {
  const data = await getAdminGiveawayData();
  if (!data.giveaway) throw new Error("Önce bir çekiliş oluşturun.");
  if (!redraw && data.entries.length < data.giveaway.targetEntries) {
    throw new Error(
      `Çark ${data.giveaway.targetEntries} katılımcıya ulaştığında çevrilebilir.`,
    );
  }

  await drawWinnerForGiveaway(data.giveaway.id, redraw);
  return getAdminGiveawayData();
}

export async function deleteGiveawayEntry(entryId: number) {
  const data = await getAdminGiveawayData();
  if (!data.giveaway) throw new Error("Katılımcı kaydı bulunamadı.");

  const entry = data.entries.find((candidate) => candidate.id === entryId);
  if (!entry) throw new Error("Katılımcı kaydı bulunamadı.");
  if (entry.status === "winner") {
    throw new Error(
      "Kazanan kaydı doğrudan silinemez. Önce kazananı geçersiz sayıp yeniden seçim yapın.",
    );
  }

  const result = await getD1()
    .prepare(
      "DELETE FROM giveaway_entries WHERE id = ? AND giveaway_id = ?",
    )
    .bind(entryId, data.giveaway.id)
    .run();

  if (Number(result.meta.changes ?? 0) === 0) {
    throw new Error("Katılımcı kaydı silinemedi.");
  }

  invalidatePublicData("giveaway-public");
  return getAdminGiveawayData();
}

export async function purgeGiveawayEntries() {
  const data = await getAdminGiveawayData();
  if (!data.giveaway) throw new Error("Silinecek çekiliş bulunamadı.");
  if (
    data.giveaway.status !== "completed" &&
    data.giveaway.status !== "closed"
  ) {
    throw new Error(
      "Katılımcı verileri yalnızca kapanmış veya sonuçlanmış çekilişlerde silinebilir.",
    );
  }

  await getD1()
    .prepare("DELETE FROM giveaway_entries WHERE giveaway_id = ?")
    .bind(data.giveaway.id)
    .run();

  invalidatePublicData("giveaway-public");
  return getAdminGiveawayData();
}
