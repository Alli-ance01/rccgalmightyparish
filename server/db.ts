import { Db, MongoClient, ObjectId, type Document, type Filter, type WithId } from "mongodb";
import type {
  AccountStatus,
  Announcement,
  Event,
  MediaAsset,
  MinistryPage,
  NewAnnouncement,
  NewEvent,
  NewMediaAsset,
  NewMinistryPage,
  NewPrayerRequest,
  NewSermon,
  PublicUser,
  Sermon,
  PrayerRequest,
  PrayerRequestStatus,
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

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

async function ensureIndexes(db: Db) {
  await Promise.all([
    db.collection("users").createIndex({ openId: 1 }, { unique: true }),
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("users").createIndex({ accountStatus: 1, accountType: 1 }),
    db.collection("sermons").createIndex({ slug: 1 }, { unique: true }),
    db.collection("events").createIndex({ slug: 1 }, { unique: true }),
    db.collection("ministryPages").createIndex({ slug: 1 }, { unique: true }),
    db.collection("prayerRequests").createIndex({ status: 1, createdAt: -1 }),
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
  try { return await connection; } catch (error) { console.warn("[MongoDB] Failed to connect:", error); return null; }
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
async function deleteRecord(name: string, id: string) { await requireDb(); await collection(name).deleteOne({ _id: asId(id) }); }

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const localOpenId = (email: string) => `local:${normalizeEmail(email)}`;

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = await getDb(); if (!db) return undefined;
  const user = await collection("users").findOne({ openId });
  return user ? serialize<User>(user) : undefined;
}
export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = await getDb(); if (!db) return undefined;
  const user = await collection("users").findOne({ email: normalizeEmail(email) });
  return user ? serialize<User>(user) : undefined;
}
export async function hasAdmin() {
  const db = await getDb(); if (!db) return false;
  return Boolean(await collection("users").findOne({ role: "admin", accountStatus: "active" }));
}
export async function createAdmin(input: { name: string; email: string; passwordHash: string }): Promise<PublicUser> {
  await requireDb(); const now = new Date(); const email = normalizeEmail(input.email);
  const result = await collection("users").insertOne({ openId: localOpenId(email), email, name: input.name.trim(), passwordHash: input.passwordHash, accountType: "admin", accountStatus: "active", role: "admin", createdAt: now, updatedAt: now, lastSignedIn: now });
  const created = await collection("users").findOne({ _id: result.insertedId });
  if (!created) throw new Error("Administrator creation failed"); return toPublicUser(serialize<User>(created));
}
export async function touchUser(id: string) { await requireDb(); await collection("users").updateOne({ _id: asId(id) }, { $set: { lastSignedIn: new Date(), updatedAt: new Date() } }); }
export async function updateAccountName(id: string, name: string) {
  await requireDb(); const result = await collection("users").findOneAndUpdate({ _id: asId(id), role: "admin" }, { $set: { name: name.trim(), updatedAt: new Date() } }, { returnDocument: "after" });
  if (!result) throw new Error("Account not found"); return toPublicUser(serialize<User>(result));
}
export async function updateAccountPassword(id: string, passwordHash: string) {
  await requireDb(); const result = await collection("users").findOneAndUpdate({ _id: asId(id), role: "admin" }, { $set: { passwordHash, updatedAt: new Date() } }, { returnDocument: "after" });
  if (!result) throw new Error("Account not found"); return toPublicUser(serialize<User>(result));
}

export async function listSermons(filters?: { search?: string; series?: string; speaker?: string; from?: Date; to?: Date; includeUnpublished?: boolean }): Promise<Sermon[]> {
  const db = await getDb(); if (!db) return [];
  const query: Filter<Document> = filters?.includeUnpublished ? {} : { isPublished: true };
  if (filters?.series) query.series = filters.series; if (filters?.speaker) query.speaker = filters.speaker;
  if (filters?.from || filters?.to) query.publishedAt = { ...(filters.from ? { $gte: filters.from } : {}), ...(filters.to ? { $lte: filters.to } : {}) };
  if (filters?.search?.trim()) { const search = new RegExp(filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"); query.$or = [{ title: search }, { summary: search }, { speaker: search }, { series: search }]; }
  return (await collection("sermons").find(query).sort({ publishedAt: -1, createdAt: -1 }).toArray()).map(serialize<Sermon>);
}
export async function getSermonBySlug(slug: string, includeUnpublished = false): Promise<Sermon | undefined> { const db = await getDb(); if (!db) return undefined; const record = await collection("sermons").findOne(includeUnpublished ? { slug } : { slug, isPublished: true }); return record ? serialize<Sermon>(record) : undefined; }
export const saveSermon = (values: NewSermon, id?: string) => saveRecord("sermons", values, id);
export const deleteSermon = (id: string) => deleteRecord("sermons", id);

export async function listEvents(includeUnpublished = false): Promise<Event[]> { const db = await getDb(); if (!db) return []; return (await collection("events").find(includeUnpublished ? {} : { isPublished: true }).sort({ startsAt: -1 }).toArray()).map(serialize<Event>); }
export async function getEventBySlug(slug: string, includeUnpublished = false): Promise<Event | undefined> { const db = await getDb(); if (!db) return undefined; const record = await collection("events").findOne(includeUnpublished ? { slug } : { slug, isPublished: true }); return record ? serialize<Event>(record) : undefined; }
export const saveEvent = (values: NewEvent, id?: string) => saveRecord("events", values, id);
export const deleteEvent = (id: string) => deleteRecord("events", id);

export function activeAnnouncementFilter(now = new Date()): Filter<Document> {
  return {
    isActive: true,
    $and: [
      { $or: [{ startsAt: null }, { startsAt: { $exists: false } }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: null }, { endsAt: { $exists: false } }, { endsAt: { $gte: now } }] },
    ],
  };
}
export async function listAnnouncements(includeInactive = false): Promise<Announcement[]> {
  const db = await getDb(); if (!db) return [];
  const query: Filter<Document> = includeInactive ? {} : activeAnnouncementFilter();
  return (await collection("announcements").find(query).sort({ createdAt: -1 }).toArray()).map(serialize<Announcement>);
}
export async function getAnnouncementById(id: string, includeInactive = false): Promise<Announcement | undefined> {
  const db = await getDb(); if (!db || !ObjectId.isValid(id)) return undefined;
  const record = await collection("announcements").findOne(includeInactive ? { _id: asId(id) } : { _id: asId(id), ...activeAnnouncementFilter() });
  return record ? serialize<Announcement>(record) : undefined;
}
export const saveAnnouncement = (values: NewAnnouncement, id?: string) => saveRecord("announcements", values, id);
export const deleteAnnouncement = (id: string) => deleteRecord("announcements", id);

export async function listMinistryPages(audience?: "main" | "junior", includeUnpublished = false): Promise<MinistryPage[]> { const db = await getDb(); if (!db) return []; const query: Filter<Document> = { ...(includeUnpublished ? {} : { isPublished: true }), ...(audience ? { audience } : {}) }; return (await collection("ministryPages").find(query).sort({ createdAt: -1 }).toArray()).map(serialize<MinistryPage>); }
export async function getMinistryBySlug(slug: string, includeUnpublished = false): Promise<MinistryPage | undefined> { const db = await getDb(); if (!db) return undefined; const record = await collection("ministryPages").findOne(includeUnpublished ? { slug } : { slug, isPublished: true }); return record ? serialize<MinistryPage>(record) : undefined; }
export const saveMinistryPage = (values: NewMinistryPage, id?: string) => saveRecord("ministryPages", values, id);
export const deleteMinistryPage = (id: string) => deleteRecord("ministryPages", id);

export async function listMedia(includeUnpublished = false): Promise<MediaAsset[]> { const db = await getDb(); if (!db) return []; return (await collection("mediaAssets").find(includeUnpublished ? {} : { isPublished: true }).sort({ createdAt: -1 }).toArray()).map(serialize<MediaAsset>); }
export async function getMediaById(id: string, includeUnpublished = false): Promise<MediaAsset | undefined> { const db = await getDb(); if (!db || !ObjectId.isValid(id)) return undefined; const record = await collection("mediaAssets").findOne(includeUnpublished ? { _id: new ObjectId(id) } : { _id: new ObjectId(id), isPublished: true }); return record ? serialize<MediaAsset>(record) : undefined; }
export const saveMedia = (values: NewMediaAsset, id?: string) => saveRecord("mediaAssets", values, id);
export const deleteMedia = (id: string) => deleteRecord("mediaAssets", id);

export async function createPrayerRequest(values: NewPrayerRequest) { return saveRecord("prayerRequests", values); }
export async function listPrayerRequests(status?: PrayerRequestStatus): Promise<PrayerRequest[]> {
  const db = await getDb(); if (!db) return [];
  return (await collection("prayerRequests").find(status ? { status } : {}).sort({ createdAt: -1 }).toArray()).map(serialize<PrayerRequest>);
}
export async function updatePrayerRequestStatus(id: string, status: PrayerRequestStatus, reviewerId: string) {
  await requireDb();
  const result = await collection("prayerRequests").findOneAndUpdate({ _id: asId(id) }, { $set: { status, reviewedBy: reviewerId, reviewedAt: new Date(), updatedAt: new Date() } }, { returnDocument: "after" });
  if (!result) throw new Error("Prayer request not found");
  return serialize<PrayerRequest>(result);
}

export async function getContentCounts() { const db = await getDb(); if (!db) return { sermons: 0, events: 0, announcements: 0, media: 0 }; const [sermons, events, announcements, media] = await Promise.all(["sermons", "events", "announcements", "mediaAssets"].map(name => collection(name).countDocuments())); return { sermons, events, announcements, media }; }
