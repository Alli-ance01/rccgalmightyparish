import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  announcements,
  events,
  InsertUser,
  mediaAssets,
  ministryPages,
  posts,
  sermons,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach(field => {
    if (user[field] !== undefined) {
      const normalized = user[field] ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    }
  });

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  } else {
    values.lastSignedIn = new Date();
    updateSet.lastSignedIn = values.lastSignedIn;
  }

  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listSermons(filters?: {
  search?: string;
  series?: string;
  speaker?: string;
  from?: Date;
  to?: Date;
  includeUnpublished?: boolean;
}) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(sermons)
    .orderBy(desc(sermons.publishedAt), desc(sermons.createdAt));
  const term = filters?.search?.trim().toLowerCase();
  return rows.filter(row => {
    if (!filters?.includeUnpublished && !row.isPublished) return false;
    if (filters?.series && row.series !== filters.series) return false;
    if (filters?.speaker && row.speaker !== filters.speaker) return false;
    if (filters?.from && (!row.publishedAt || row.publishedAt < filters.from)) return false;
    if (filters?.to && (!row.publishedAt || row.publishedAt > filters.to)) return false;
    if (!term) return true;
    return [row.title, row.summary, row.speaker, row.series]
      .join(" ")
      .toLowerCase()
      .includes(term);
  });
}

export async function getSermonBySlug(slug: string, includeUnpublished = false) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(sermons).where(eq(sermons.slug, slug)).limit(1);
  const row = rows[0];
  return row && (includeUnpublished || row.isPublished) ? row : undefined;
}

export async function saveSermon(values: typeof sermons.$inferInsert, id?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  if (id) {
    await db.update(sermons).set({ ...values, updatedAt: new Date() }).where(eq(sermons.id, id));
    return id;
  }
  const result = await db.insert(sermons).values(values);
  return result[0].insertId;
}

export async function deleteSermon(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.delete(sermons).where(eq(sermons.id, id));
}

export async function listEvents(includeUnpublished = false) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(events).orderBy(desc(events.startsAt));
  return includeUnpublished ? rows : rows.filter(row => row.isPublished);
}

export async function getEventBySlug(slug: string, includeUnpublished = false) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  const row = rows[0];
  return row && (includeUnpublished || row.isPublished) ? row : undefined;
}

export async function saveEvent(values: typeof events.$inferInsert, id?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  if (id) {
    await db.update(events).set({ ...values, updatedAt: new Date() }).where(eq(events.id, id));
    return id;
  }
  const result = await db.insert(events).values(values);
  return result[0].insertId;
}

export async function deleteEvent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.delete(events).where(eq(events.id, id));
}

export async function listPosts(category?: string, includeUnpublished = false) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(posts).orderBy(desc(posts.publishedAt), desc(posts.createdAt));
  return rows.filter(row =>
    (includeUnpublished || row.isPublished) && (!category || row.category === category),
  );
}

export async function getPostBySlug(slug: string, includeUnpublished = false) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1);
  const row = rows[0];
  return row && (includeUnpublished || row.isPublished) ? row : undefined;
}

export async function savePost(values: typeof posts.$inferInsert, id?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  if (id) {
    await db.update(posts).set({ ...values, updatedAt: new Date() }).where(eq(posts.id, id));
    return id;
  }
  const result = await db.insert(posts).values(values);
  return result[0].insertId;
}

export async function deletePost(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.delete(posts).where(eq(posts.id, id));
}

export async function listAnnouncements(includeInactive = false) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(announcements).orderBy(desc(announcements.createdAt));
  return includeInactive ? rows : rows.filter(row => row.isActive);
}

export async function saveAnnouncement(values: typeof announcements.$inferInsert, id?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  if (id) {
    await db.update(announcements).set({ ...values, updatedAt: new Date() }).where(eq(announcements.id, id));
    return id;
  }
  const result = await db.insert(announcements).values(values);
  return result[0].insertId;
}

export async function deleteAnnouncement(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.delete(announcements).where(eq(announcements.id, id));
}

export async function listMinistryPages(audience?: "main" | "junior", includeUnpublished = false) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(ministryPages).orderBy(desc(ministryPages.createdAt));
  return rows.filter(row =>
    (includeUnpublished || row.isPublished) && (!audience || row.audience === audience),
  );
}

export async function getMinistryBySlug(slug: string, includeUnpublished = false) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(ministryPages).where(eq(ministryPages.slug, slug)).limit(1);
  const row = rows[0];
  return row && (includeUnpublished || row.isPublished) ? row : undefined;
}

export async function saveMinistryPage(values: typeof ministryPages.$inferInsert, id?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  if (id) {
    await db.update(ministryPages).set({ ...values, updatedAt: new Date() }).where(eq(ministryPages.id, id));
    return id;
  }
  const result = await db.insert(ministryPages).values(values);
  return result[0].insertId;
}

export async function deleteMinistryPage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.delete(ministryPages).where(eq(ministryPages.id, id));
}

export async function listMedia(includeUnpublished = false) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt));
  return includeUnpublished ? rows : rows.filter(row => row.isPublished);
}

export async function getMediaById(id: number, includeUnpublished = false) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1);
  const row = rows[0];
  return row && (includeUnpublished || row.isPublished) ? row : undefined;
}

export async function saveMedia(values: typeof mediaAssets.$inferInsert, id?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  if (id) {
    await db.update(mediaAssets).set({ ...values, updatedAt: new Date() }).where(eq(mediaAssets.id, id));
    return id;
  }
  const result = await db.insert(mediaAssets).values(values);
  return result[0].insertId;
}

export async function deleteMedia(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
}

export async function getContentCounts() {
  const [sermonRows, eventRows, postRows, mediaRows, ministryRows] = await Promise.all([
    listSermons({ includeUnpublished: true }),
    listEvents(true),
    listPosts(undefined, true),
    listMedia(true),
    listMinistryPages(undefined, true),
  ]);
  return {
    sermons: sermonRows.length,
    events: eventRows.length,
    posts: postRows.length,
    media: mediaRows.length,
    ministries: ministryRows.length,
  };
}
