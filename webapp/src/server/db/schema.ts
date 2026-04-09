import { relations } from "drizzle-orm";
import {
  boolean,
  pgEnum,
  pgTable,
  pgTableCreator,
  text,
  timestamp,
  integer,
  doublePrecision,
} from "drizzle-orm/pg-core";
import { languageCodes } from "@/lib/languages";

export const createTable = pgTableCreator((name) => `pg-drizzle_${name}`);

const legacyLanguageNames = [
  "Chinese",
  "English",
  "Japanese",
  "Korean",
  "German",
  "French",
  "Russian",
  "Portuguese",
  "Spanish",
  "Italian",
] as const;

export const languageEnum = pgEnum("language_code", [
  ...legacyLanguageNames,
  ...languageCodes,
]);

export const videoStatusEnum = pgEnum("video_status", [
  "queued",
  "processing",
  "done",
  "failed",
]);

export const videos = createTable("videos", (d) => ({
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id),
  createdAt: timestamp("created_at")
    .$default(() => new Date())
    .notNull(),
  sourceBlob: text("blob").notNull(),
  completedBlob: text("completed_blob"),
  status: videoStatusEnum("status").default("queued").notNull(),
  sourceLanguage: languageEnum("source_language").notNull(),
  destLanguage: languageEnum("dest_language").notNull(),

  diarizationCompletedTasks: integer("diarization_completed_tasks"),
  diarizationTotalTasks: integer("diarization_total_tasks"),
  translationCompletedTasks: integer("translation_completed_tasks"),
  translationTotalTasks: integer("translation_total_tasks"),
  ttsCompletedTasks: integer("tts_completed_tasks"),
  ttsTotalTasks: integer("tts_total_tasks"),
  reconstructionCompletedTasks: integer("reconstruction_completed_tasks"),
  reconstructionTotalTasks: integer("reconstruction_total_tasks"),
}));

export const tts = createTable("tts", (d) => ({
  src_blob: text("src_blob"),
  gen_blob: text("gen_blob"),
  segment_id: integer("segment_id"),
  speaker_id: text("speaker_id"),
  start: doublePrecision("start"),
  end: doublePrecision("end"),
}));

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
});

export const userRelations = relations(user, ({ many }) => ({
  account: many(account),
  session: many(session),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));
