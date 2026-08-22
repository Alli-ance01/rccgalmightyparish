import { Db, MongoClient, ObjectId, type Document, type Filter, type WithId } from "mongodb";
import type {
  Announcement,
  Event,
  InsertUser,
  MediaAsset,
  MinistryPage,
  NewAnnouncement,
  NewEvent,
  NewMediaAsset,
  NewMinistryPage,
  NewPost,
  NewSermon,
  Post,
  Sermon,
  User,
} from "./models";
import { ENV } from "./_core/env";

let client: MongoClient | null = null;
let database: Db | null = null;
let connection: Promise<Db> | null = null;

function collection(name: string) {
  if (!database) throw new Error("MongoDB is unavailable");
  return database.collection<Document>(name);
}

function asId(id: string) {
  if (!ObjectId.isValid(id)) throw new Error("Invalid MongoDB record ID");
  return new ObjectId(id);
}

function serialize<T>(record: WithId<Document>): T {
  const { _id, ...value } = record;
  return { ...value, id: _id.toHexString() } as T;
}

async function ensureIndexes(db: Db) {
  await Promise.all([
    db.collection("users").createIndex({ openId: 1 }, { unique: true }),
    db.collection("sermons").createIndex({ slug: 1 }, { unique: true }),
    db.collection("events").createIndex({ slug: 1 }, { unique: true }),
    db.collection("posts").createIndex({ slug: 1 }, { unique: true }),
    db.collection("ministryPages").createIndex({ slug: 1 }, { unique: true }),
  ]);
}

export async function getDb(): Promise<Db | null> {
  if (database) return database;
  if (!ENV.mongoUrl) {
    console.warn("[MongoDB] MONGODB_URI is not configured");
    return null;
  }
  if (!connection) {
    connection = (async () => {
      client = new MongoClient(ENV.mongoUrl);
      await client.connect();
      database = client.db();
      await ensureIndexes(database);
      return database;
    })().catch(error => {
      connection = null;
      client = null;
      database = null;
      throw error;
    });
  }
  try {
    return await connection;
  } catch (error) {
    console.warn("[MongoDB] Failed to connect:", error);
    return null;
  }
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("MongoDB is unavailable");
  return db;
}

async function saveRecord<T extends Document>(name: string, values: T, id?: string) {
  await requireDb();
  const now = new Date();
  if (id) {
    await collection(name).updateOne({ _id: asId(id) }, { $set: { ...values, updatedAt: now } });
    return id;
  }
  const result = await collection(name).insertOne({ ...values, createdAt: now, updatedAt: now });
  return result.insertedId.toHexString();
}

async function deleteRecord(name: string, id: string) {
  await requireDb();
  await collection(name).deleteOne({ _id: asId(id) });
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  await requireDb();
  const now = new Date();
  const role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "member");
  await collection("users").updateOne(
    { openId: user.openId },
    {
      $set: {
        name: user.name ?? null,
        email: user.email ?? null,
        loginMethod: user.loginMethod ?? null,
        lastSignedIn: user.lastSignedIn ?? now,
        updatedAt: now,
      },
      $setOnInsert: { openId: user.openId, role, createdAt: now },
    },
    { upsert: true },
  );
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const user = await collection("users").findOne({ openId });
  return user ? serialize<User>(user) : undefined;
}

export async function listSermons(filters?: { search?: string; series?: string; speaker?: string; from?: Date; to?: Date; includeUnpublished?: boolean }): Promise<Sermon[]> {
  const db = await getDb();
  if (!db) return [];
  const query: Filter<Document> = filters?.includeUnpublished ? {} : { isPublished: true };
  if (filters?.series) query.series = filters.series;
  if (filters?.speaker) query.speaker = filters.speaker;
  if (filters?.from || filters?.to) query.publishedAt = { ...(filters.from ? { $gte: filters.from } : {}), ...(filters.to ? { $lte: filters.to } : {}) };
  if (filters?.search?.trim()) {
    const search = new RegExp(filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ title: search }, { summary: search }, { speaker: search }, { series: search }];
  }
  return (await collection("sermons").find(query).sort({ publishedAt: -1, createdAt: -1 }).toArray()).map(serialize<Sermon>);
}

export async function getSermonBySlug(slug: string, includeUnpublished = false): Promise<Sermon | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const record = await collection("sermons").findOne(includeUnpublished ? { slug } : { slug, isPublished: true });
  return record ? serialize<Sermon>(record) : undefined;
}
export const saveSermon = (values: NewSermon, id?: string) => saveRecord("sermons", values, id);
export const deleteSermon = (id: string) => deleteRecord("sermons", id);

export async function listEvents(includeUnpublished = false): Promise<Event[]> {
  const db = await getDb(); if (!db) return [];
  return (await collection("events").find(includeUnpublished ? {} : { isPublished: true }).sort({ startsAt: -1 }).toArray()).map(serialize<Event>);
}
export async function getEventBySlug(slug: string, includeUnpublished = false): Promise<Event | undefined> {
  const db = await getDb(); if (!db) return undefined;
  const record = await collection("events").findOne(includeUnpublished ? { slug } : { slug, isPublished: true });
  return record ? serialize<Event>(record) : undefined;
}
export const saveEvent = (values: NewEvent, id?: string) => saveRecord("events", values, id);
export const deleteEvent = (id: string) => deleteRecord("events", id);

export async function listPosts(category?: string, includeUnpublished = false): Promise<Post[]> {
  const db = await getDb(); if (!db) return [];
  const query: Filter<Document> = { ...(includeUnpublished ? {} : { isPublished: true }), ...(category ? { category } : {}) };
  return (await collection("posts").find(query).sort({ publishedAt: -1, createdAt: -1 }).toArray()).map(serialize<Post>);
}
export async function getPostBySlug(slug: string, includeUnpublished = false): Promise<Post | undefined> {
  const db = await getDb(); if (!db) return undefined;
  const record = await collection("posts").findOne(includeUnpublished ? { slug } : { slug, isPublished: true });
  return record ? serialize<Post>(record) : undefined;
}
export const savePost = (values: NewPost, id?: string) => saveRecord("posts", values, id);
export const deletePost = (id: string) => deleteRecord("posts", id);

export async function listAnnouncements(includeInactive = false): Promise<Announcement[]> {
  const db = await getDb(); if (!db) return [];
  return (await collection("announcements").find(includeInactive ? {} : { isActive: true }).sort({ createdAt: -1 }).toArray()).map(serialize<Announcement>);
}
export const saveAnnouncement = (values: NewAnnouncement, id?: string) => saveRecord("announcements", values, id);
export const deleteAnnouncement = (id: string) => deleteRecord("announcements", id);

export async function listMinistryPages(audience?: "main" | "junior", includeUnpublished = false): Promise<MinistryPage[]> {
  const db = await getDb(); if (!db) return [];
  const query: Filter<Document> = { ...(includeUnpublished ? {} : { isPublished: true }), ...(audience ? { audience } : {}) };
  return (await collection("ministryPages").find(query).sort({ createdAt: -1 }).toArray()).map(serialize<MinistryPage>);
}
export async function getMinistryBySlug(slug: string, includeUnpublished = false): Promise<MinistryPage | undefined> {
  const db = await getDb(); if (!db) return undefined;
  const record = await collection("ministryPages").findOne(includeUnpublished ? { slug } : { slug, isPublished: true });
  return record ? serialize<MinistryPage>(record) : undefined;
}
export const saveMinistryPage = (values: NewMinistryPage, id?: string) => saveRecord("ministryPages", values, id);
export const deleteMinistryPage = (id: string) => deleteRecord("ministryPages", id);

export async function listMedia(includeUnpublished = false): Promise<MediaAsset[]> {
  const db = await getDb(); if (!db) return [];
  return (await collection("mediaAssets").find(includeUnpublished ? {} : { isPublished: true }).sort({ createdAt: -1 }).toArray()).map(serialize<MediaAsset>);
}
export async function getMediaById(id: string, includeUnpublished = false): Promise<MediaAsset | undefined> {
  const db = await getDb(); if (!db || !ObjectId.isValid(id)) return undefined;
  const record = await collection("mediaAssets").findOne(includeUnpublished ? { _id: new ObjectId(id) } : { _id: new ObjectId(id), isPublished: true });
  return record ? serialize<MediaAsset>(record) : undefined;
}
export const saveMedia = (values: NewMediaAsset, id?: string) => saveRecord("mediaAssets", values, id);
export const deleteMedia = (id: string) => deleteRecord("mediaAssets", id);

export async function getContentCounts() {
  const db = await getDb();
  if (!db) return { sermons: 0, events: 0, posts: 0, media: 0, ministries: 0 };
  const [sermons, events, posts, media, ministries] = await Promise.all(["sermons", "events", "posts", "mediaAssets", "ministryPages"].map(name => collection(name).countDocuments()));
  return { sermons, events, posts, media, ministries };
}
