import { sql } from "drizzle-orm";
import {
  type AnySQLiteColumn,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const siteMeta = sqliteTable("site_meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const videos = sqliteTable(
  "videos",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    publicId: text("public_id").notNull(),
    youtubeVideoId: text("youtube_video_id"),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    description: text("description").notNull().default(""),
    category: text("category").notNull().default("arsiv"),
    source: text("source").notNull().default("youtube"),
    sourceUrl: text("source_url"),
    storageKey: text("storage_key"),
    thumbnailUrl: text("thumbnail_url"),
    durationSeconds: integer("duration_seconds"),
    status: text("status").notNull().default("draft"),
    sortOrder: integer("sort_order").notNull().default(0),
    publishedAt: text("published_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("videos_public_id_unique").on(table.publicId),
    uniqueIndex("videos_slug_unique").on(table.slug),
    index("videos_status_sort_idx").on(table.status, table.sortOrder),
  ],
);

export const socialLinks = sqliteTable("social_links", {
  key: text("key").primaryKey(),
  label: text("label").notNull(),
  url: text("url").notNull().default(""),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const servers = sqliteTable("servers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  code: text("code").notNull().default("—"),
  status: text("status").notNull().default("inactive"),
  detail: text("detail").notNull().default(""),
  url: text("url"),
  sortOrder: integer("sort_order").notNull().default(0),
  isVisible: integer("is_visible", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const giveaways = sqliteTable("giveaways", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  prize: text("prize").notNull().default(""),
  status: text("status").notNull().default("draft"),
  targetEntries: integer("target_entries").notNull().default(50),
  startsAt: text("starts_at"),
  endsAt: text("ends_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const giveawayEntries = sqliteTable(
  "giveaway_entries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    giveawayId: integer("giveaway_id")
      .notNull()
      .references(() => giveaways.id, { onDelete: "cascade" }),
    participantName: text("participant_name").notNull(),
    email: text("email").notNull(),
    youtubeConfirmed: integer("youtube_confirmed", { mode: "boolean" })
      .notNull()
      .default(false),
    whatsappConfirmed: integer("whatsapp_confirmed", { mode: "boolean" })
      .notNull()
      .default(false),
    termsAccepted: integer("terms_accepted", { mode: "boolean" })
      .notNull()
      .default(false),
    status: text("status").notNull().default("eligible"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("giveaway_entries_giveaway_email_unique").on(
      table.giveawayId,
      table.email,
    ),
    index("giveaway_entries_giveaway_status_idx").on(
      table.giveawayId,
      table.status,
    ),
  ],
);

export const communityMessages = sqliteTable(
  "community_messages",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    parentId: integer("parent_id").references(
      (): AnySQLiteColumn => communityMessages.id,
      { onDelete: "cascade" },
    ),
    category: text("category").notNull().default("tartisma"),
    displayName: text("display_name").notNull(),
    title: text("title").notNull().default(""),
    body: text("body").notNull(),
    status: text("status").notNull().default("pending"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    reviewedAt: text("reviewed_at"),
  },
  (table) => [
    index("community_messages_status_created_idx").on(
      table.status,
      table.createdAt,
    ),
    index("community_messages_parent_status_idx").on(
      table.parentId,
      table.status,
    ),
  ],
);
