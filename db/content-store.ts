import { getD1 } from "./index";
import {
  defaultManagedLinks,
  defaultManagedServers,
  managedLinkKeys,
  type ManagedLinkKey,
  type ManagedServer,
  type ManagedSocialLink,
} from "../app/managed-content";
import { getCachedPublicData, invalidatePublicData } from "./public-cache";

type SocialLinkRow = {
  key: string;
  label: string;
  url: string;
  is_active: number;
  sort_order: number;
};

type ServerRow = {
  id: number;
  name: string;
  code: string;
  status: string;
  detail: string;
  url: string | null;
  sort_order: number;
  is_visible: number;
};

let initializationPromise: Promise<void> | null = null;

async function initializeContentStore() {
  const d1 = getD1();

  await d1.batch([
    d1.prepare(`
      CREATE TABLE IF NOT EXISTS site_meta (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL DEFAULT '',
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `),
    d1.prepare(`
      CREATE TABLE IF NOT EXISTS social_links (
        key TEXT PRIMARY KEY NOT NULL,
        label TEXT NOT NULL,
        url TEXT NOT NULL DEFAULT '',
        is_active INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `),
    d1.prepare(`
      CREATE TABLE IF NOT EXISTS servers (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        name TEXT NOT NULL,
        code TEXT NOT NULL DEFAULT '—',
        status TEXT NOT NULL DEFAULT 'inactive',
        detail TEXT NOT NULL DEFAULT '',
        url TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_visible INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `),
  ]);

  await d1.batch(
    defaultManagedLinks.map((link) =>
      d1
        .prepare(
          `INSERT OR IGNORE INTO social_links
            (key, label, url, is_active, sort_order, updated_at)
           VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        )
        .bind(
          link.key,
          link.label,
          link.url,
          link.isActive ? 1 : 0,
          link.sortOrder,
        ),
    ),
  );

  const seedMarker = await d1
    .prepare("SELECT value FROM site_meta WHERE key = ?")
    .bind("managed_content_seeded")
    .first<{ value: string }>();

  if (seedMarker) return;

  const seedStatements = [
    ...defaultManagedServers.map((server) =>
      d1
        .prepare(
          `INSERT INTO servers
            (name, code, status, detail, url, sort_order, is_visible, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        )
        .bind(
          server.name,
          server.code,
          server.status,
          server.detail,
          server.url,
          server.sortOrder,
          server.isVisible ? 1 : 0,
        ),
    ),
    d1
      .prepare(
        `INSERT INTO site_meta (key, value, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)`,
      )
      .bind("managed_content_seeded", "1"),
  ];

  await d1.batch(seedStatements);
}

async function ensureContentStore() {
  if (!initializationPromise) {
    initializationPromise = initializeContentStore().catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }

  await initializationPromise;
}

function isManagedLinkKey(value: string): value is ManagedLinkKey {
  return managedLinkKeys.includes(value as ManagedLinkKey);
}

function mapSocialLink(row: SocialLinkRow): ManagedSocialLink | null {
  if (!isManagedLinkKey(row.key)) return null;

  return {
    key: row.key,
    label: row.label,
    url: row.url,
    isActive: row.is_active === 1,
    sortOrder: row.sort_order,
  };
}

function mapServer(row: ServerRow): ManagedServer {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    status: row.status,
    detail: row.detail,
    url: row.url ?? "",
    sortOrder: row.sort_order,
    isVisible: row.is_visible === 1,
  };
}

async function readManagedContent() {
  const d1 = getD1();

  const [linkResult, serverResult] = await Promise.all([
    d1
      .prepare(
        `SELECT key, label, url, is_active, sort_order
         FROM social_links
         ORDER BY sort_order ASC, key ASC`,
      )
      .all<SocialLinkRow>(),
    d1
      .prepare(
        `SELECT id, name, code, status, detail, url, sort_order, is_visible
         FROM servers
         ORDER BY sort_order ASC, id ASC`,
      )
      .all<ServerRow>(),
  ]);

  return {
    links: linkResult.results
      .map(mapSocialLink)
      .filter((link): link is ManagedSocialLink => Boolean(link)),
    servers: serverResult.results.map(mapServer),
  };
}

export async function getManagedContent() {
  await ensureContentStore();
  return readManagedContent();
}

export async function getPublicManagedContent() {
  try {
    return await getCachedPublicData("managed-content", 30_000, async () => {
      const content = await readManagedContent();
      return {
        links: content.links,
        servers: content.servers.filter((server) => server.isVisible),
      };
    });
  } catch {
    return {
      links: defaultManagedLinks,
      servers: defaultManagedServers.filter((server) => server.isVisible),
    };
  }
}

export async function saveManagedLinks(links: ManagedSocialLink[]) {
  await ensureContentStore();
  const d1 = getD1();
  const submitted = new Map(links.map((link) => [link.key, link]));

  const statements = defaultManagedLinks.map((fallback) => {
    const link = submitted.get(fallback.key) ?? fallback;
    return d1
      .prepare(
        `INSERT INTO social_links
          (key, label, url, is_active, sort_order, updated_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET
           label = excluded.label,
           url = excluded.url,
           is_active = excluded.is_active,
           sort_order = excluded.sort_order,
           updated_at = CURRENT_TIMESTAMP`,
      )
      .bind(
        fallback.key,
        fallback.label,
        link.url,
        link.isActive && link.url.length > 0 ? 1 : 0,
        fallback.sortOrder,
      );
  });

  await d1.batch(statements);
  invalidatePublicData("managed-content");
  return getManagedContent();
}

export async function createManagedServer(
  input: Omit<ManagedServer, "id" | "sortOrder">,
) {
  await ensureContentStore();
  const d1 = getD1();
  const last = await d1
    .prepare("SELECT COALESCE(MAX(sort_order), -1) AS value FROM servers")
    .first<{ value: number }>();
  const nextSortOrder = Number(last?.value ?? -1) + 1;

  const result = await d1
    .prepare(
      `INSERT INTO servers
        (name, code, status, detail, url, sort_order, is_visible, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    )
    .bind(
      input.name,
      input.code,
      input.status,
      input.detail,
      input.url,
      nextSortOrder,
      input.isVisible ? 1 : 0,
    )
    .run();

  invalidatePublicData("managed-content");
  return Number(result.meta.last_row_id);
}

export async function updateManagedServer(server: ManagedServer) {
  await ensureContentStore();
  const d1 = getD1();

  await d1
    .prepare(
      `UPDATE servers SET
        name = ?,
        code = ?,
        status = ?,
        detail = ?,
        url = ?,
        sort_order = ?,
        is_visible = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    )
    .bind(
      server.name,
      server.code,
      server.status,
      server.detail,
      server.url,
      server.sortOrder,
      server.isVisible ? 1 : 0,
      server.id,
    )
    .run();
  invalidatePublicData("managed-content");
}

export async function deleteManagedServer(id: number) {
  await ensureContentStore();
  await getD1().prepare("DELETE FROM servers WHERE id = ?").bind(id).run();
  invalidatePublicData("managed-content");
}
