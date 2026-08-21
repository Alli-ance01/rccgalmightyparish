import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const userRole = mysqlEnum("role", [
  "user",
  "member",
  "worker",
  "ministry_leader",
  "editor",
  "admin",
]);

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRole.default("member").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const sermons = mysqlTable("sermons", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  summary: text("summary").notNull(),
  speaker: varchar("speaker", { length: 160 }).notNull(),
  series: varchar("series", { length: 160 }).notNull(),
  videoProvider: mysqlEnum("videoProvider", ["youtube", "vimeo", "none"])
    .default("none")
    .notNull(),
  videoId: varchar("videoId", { length: 255 }),
  sermonNotesTitle: varchar("sermonNotesTitle", { length: 255 }),
  sermonNotesUrl: varchar("sermonNotesUrl", { length: 1024 }),
  coverImageUrl: varchar("coverImageUrl", { length: 1024 }),
  publishedAt: timestamp("publishedAt"),
  isPublished: boolean("isPublished").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  excerpt: text("excerpt").notNull(),
  description: text("description").notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  startsAt: timestamp("startsAt").notNull(),
  endsAt: timestamp("endsAt"),
  registrationUrl: varchar("registrationUrl", { length: 1024 }),
  coverImageUrl: varchar("coverImageUrl", { length: 1024 }),
  isPublished: boolean("isPublished").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const posts = mysqlTable("posts", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  excerpt: text("excerpt").notNull(),
  body: text("body").notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  coverImageUrl: varchar("coverImageUrl", { length: 1024 }),
  authorName: varchar("authorName", { length: 160 }).notNull(),
  publishedAt: timestamp("publishedAt"),
  isPublished: boolean("isPublished").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const announcements = mysqlTable("announcements", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  actionLabel: varchar("actionLabel", { length: 80 }),
  actionUrl: varchar("actionUrl", { length: 1024 }),
  isActive: boolean("isActive").default(true).notNull(),
  startsAt: timestamp("startsAt"),
  endsAt: timestamp("endsAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const ministryPages = mysqlTable("ministryPages", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  audience: mysqlEnum("audience", ["main", "junior"]).notNull(),
  summary: text("summary").notNull(),
  description: text("description").notNull(),
  leaderName: varchar("leaderName", { length: 160 }),
  leaderRole: varchar("leaderRole", { length: 160 }),
  meetingInfo: varchar("meetingInfo", { length: 255 }),
  heroImageUrl: varchar("heroImageUrl", { length: 1024 }),
  isPublished: boolean("isPublished").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const mediaAssets = mysqlTable("mediaAssets", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  altText: varchar("altText", { length: 255 }),
  mediaType: mysqlEnum("mediaType", ["image", "video", "document"])
    .notNull(),
  storageKey: varchar("storageKey", { length: 1024 }).notNull(),
  url: varchar("url", { length: 1024 }).notNull(),
  mimeType: varchar("mimeType", { length: 160 }).notNull(),
  isPublished: boolean("isPublished").default(false).notNull(),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Sermon = typeof sermons.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type MinistryPage = typeof ministryPages.$inferSelect;
export type MediaAsset = typeof mediaAssets.$inferSelect;
