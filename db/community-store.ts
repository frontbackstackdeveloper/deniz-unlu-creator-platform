import {
  communityCategories,
  communityStatuses,
  type CommunityCategory,
  type CommunityMessage,
  type CommunityPageData,
  type CommunityStatus,
  type CommunityThread,
} from "../app/community";
import { getD1 } from "./index";

type CommunityRow = {
  id: number;
  parent_id: number | null;
  category: string;
  display_name: string;
  title: string;
  body: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
};

let initializationPromise: Promise<void> | null = null;

async function initializeCommunityStore() {
  const d1 = getD1();
  await d1.batch([
    d1.prepare(`
      CREATE TABLE IF NOT EXISTS community_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        parent_id INTEGER,
        category TEXT NOT NULL DEFAULT 'tartisma',
        display_name TEXT NOT NULL,
        title TEXT NOT NULL DEFAULT '',
        body TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TEXT,
        FOREIGN KEY (parent_id) REFERENCES community_messages(id) ON DELETE CASCADE
      )
    `),
    d1.prepare(`
      CREATE INDEX IF NOT EXISTS community_messages_status_created_idx
      ON community_messages(status, created_at)
    `),
    d1.prepare(`
      CREATE INDEX IF NOT EXISTS community_messages_parent_status_idx
      ON community_messages(parent_id, status)
    `),
  ]);
}

async function ensureCommunityStore() {
  if (!initializationPromise) {
    initializationPromise = initializeCommunityStore().catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }
  await initializationPromise;
}

function isCategory(value: string): value is CommunityCategory {
  return communityCategories.includes(value as CommunityCategory);
}

function isStatus(value: string): value is CommunityStatus {
  return communityStatuses.includes(value as CommunityStatus);
}

function mapMessage(row: CommunityRow): CommunityMessage {
  return {
    id: row.id,
    parentId: row.parent_id,
    category: isCategory(row.category) ? row.category : "tartisma",
    displayName: row.display_name,
    title: row.title,
    body: row.body,
    status: isStatus(row.status) ? row.status : "pending",
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  };
}

const communitySelect = `
  SELECT id, parent_id, category, display_name, title, body, status,
         created_at, reviewed_at
  FROM community_messages
`;

export async function getPublicCommunityPage(input: {
  page?: number;
  pageSize?: number;
  category?: CommunityCategory | null;
} = {}): Promise<CommunityPageData> {
  await ensureCommunityStore();
  const d1 = getD1();
  const pageSize = Math.min(Math.max(Math.trunc(input.pageSize ?? 10), 1), 30);
  const requestedPage = Math.max(Math.trunc(input.page ?? 1), 1);
  const categoryClause = input.category ? " AND category = ?" : "";
  const countStatement = d1.prepare(
    `SELECT COUNT(*) AS value
     FROM community_messages
     WHERE parent_id IS NULL AND status = 'approved'${categoryClause}`,
  );
  const countRow = await (input.category
    ? countStatement.bind(input.category)
    : countStatement
  ).first<{ value: number }>();
  const totalThreads = Number(countRow?.value ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalThreads / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const offset = (page - 1) * pageSize;
  const threadStatement = d1.prepare(
    `${communitySelect}
     WHERE parent_id IS NULL AND status = 'approved'${categoryClause}
     ORDER BY created_at DESC, id DESC
     LIMIT ? OFFSET ?`,
  );
  const threadResult = await (input.category
    ? threadStatement.bind(input.category, pageSize, offset)
    : threadStatement.bind(pageSize, offset)
  ).all<CommunityRow>();

  const threadIds = threadResult.results.map((row) => row.id);
  let replies: CommunityMessage[] = [];
  if (threadIds.length > 0) {
    const placeholders = threadIds.map(() => "?").join(", ");
    const replyResult = await d1
      .prepare(
        `${communitySelect}
         WHERE parent_id IN (${placeholders}) AND status = 'approved'
         ORDER BY created_at ASC, id ASC`,
      )
      .bind(...threadIds)
      .all<CommunityRow>();
    replies = replyResult.results.map(mapMessage);
  }

  const threads: CommunityThread[] = threadResult.results.map((row) => {
    const thread = mapMessage(row);
    return {
      ...thread,
      replies: replies.filter((reply) => reply.parentId === thread.id),
    };
  });

  return {
    threads,
    page,
    pageSize,
    totalThreads,
    totalPages,
  };
}

export async function getAdminCommunityMessages(): Promise<CommunityMessage[]> {
  await ensureCommunityStore();
  const result = await getD1()
    .prepare(
      `${communitySelect}
       ORDER BY
         CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
         created_at DESC,
         id DESC
       LIMIT 300`,
    )
    .all<CommunityRow>();
  return result.results.map(mapMessage);
}

export async function createCommunityMessage(input: {
  parentId: number | null;
  category: CommunityCategory;
  displayName: string;
  title: string;
  body: string;
}) {
  await ensureCommunityStore();
  let category = input.category;
  let title = input.title;

  if (input.parentId) {
    const parent = await getD1()
      .prepare(
        `SELECT id, category
         FROM community_messages
         WHERE id = ? AND parent_id IS NULL AND status = 'approved'`,
      )
      .bind(input.parentId)
      .first<{ id: number; category: string }>();
    if (!parent) {
      throw new Error("Yanıtlamak istediğiniz tartışma artık kullanılamıyor.");
    }
    category = isCategory(parent.category) ? parent.category : "tartisma";
    title = "";
  }

  const result = await getD1()
    .prepare(
      `INSERT INTO community_messages
        (parent_id, category, display_name, title, body, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'approved', CURRENT_TIMESTAMP)`,
    )
    .bind(
      input.parentId,
      category,
      input.displayName,
      title,
      input.body,
    )
    .run();

  return Number(result.meta.last_row_id);
}

export async function updateCommunityMessage(input: {
  id: number;
  category: CommunityCategory;
  displayName: string;
  title: string;
  body: string;
}) {
  await ensureCommunityStore();
  const current = await getD1()
    .prepare(
      `SELECT id, parent_id
       FROM community_messages
       WHERE id = ?`,
    )
    .bind(input.id)
    .first<{ id: number; parent_id: number | null }>();
  if (!current) {
    throw new Error("Topluluk mesajı bulunamadı.");
  }

  let category = input.category;
  let title = input.title;
  if (current.parent_id) {
    const parent = await getD1()
      .prepare(
        `SELECT category
         FROM community_messages
         WHERE id = ? AND parent_id IS NULL`,
      )
      .bind(current.parent_id)
      .first<{ category: string }>();
    category =
      parent && isCategory(parent.category) ? parent.category : "tartisma";
    title = "";
  } else if (title.length < 4) {
    throw new Error("Başlık en az 4 karakter olmalıdır.");
  }

  const result = await getD1()
    .prepare(
      `UPDATE community_messages
       SET category = ?, display_name = ?, title = ?, body = ?,
           status = 'approved', reviewed_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    )
    .bind(
      category,
      input.displayName,
      title,
      input.body,
      input.id,
    )
    .run();
  if (Number(result.meta.changes ?? 0) === 0) {
    throw new Error("Topluluk mesajı güncellenemedi.");
  }
}

export async function moderateCommunityMessage(
  id: number,
  status: CommunityStatus,
) {
  await ensureCommunityStore();
  if (!communityStatuses.includes(status)) {
    throw new Error("Geçersiz topluluk durumu.");
  }

  const result = await getD1()
    .prepare(
      `UPDATE community_messages
       SET status = ?, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    )
    .bind(status, id)
    .run();
  if (Number(result.meta.changes ?? 0) === 0) {
    throw new Error("Topluluk mesajı bulunamadı.");
  }
}

export async function deleteCommunityMessage(id: number) {
  await ensureCommunityStore();
  const result = await getD1()
    .prepare("DELETE FROM community_messages WHERE id = ?")
    .bind(id)
    .run();
  if (Number(result.meta.changes ?? 0) === 0) {
    throw new Error("Topluluk mesajı bulunamadı.");
  }
}
