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
  NewPost,
  NewPrayerRequest,
  NewSermon,
  MemberUpdate,
  MemberUpdateAudience,
  MemberProfile,
  MinistryInterest,
  JuniorAgeCategory,
  ServiceAvailability,
  Post,
  PublicUser,
  Sermon,
  PrayerRequest,
  PrayerRequestStatus,
  User,
  UserRole,
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
    db.collection("posts").createIndex({ slug: 1 }, { unique: true }),
    db.collection("ministryPages").createIndex({ slug: 1 }, { unique: true }),
    db.collection("prayerRequests").createIndex({ status: 1, createdAt: -1 }),
    db.collection("memberProfiles").createIndex({ userId: 1 }, { unique: true }),
    db.collection("memberProfiles").createIndex({ ministryInterests: 1, updatedAt: -1 }),
    db.collection("eventInterests").createIndex({ userId: 1, eventId: 1 }, { unique: true }),
    db.collection("eventInterests").createIndex({ eventId: 1, createdAt: -1 }),
    db.collection("memberUpdates").createIndex({ isPublished: 1, audience: 1, createdAt: -1 }),
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
export async function hasMasterAdmin() {
  const db = await getDb(); if (!db) return false;
  return Boolean(await collection("users").findOne({ role: "master_admin", accountStatus: "active" }));
}
export async function createAccount(input: { name: string; email: string; passwordHash: string; accountType: "member" | "staff"; requestedRole?: Exclude<UserRole, "master_admin">; requestNote?: string | null }): Promise<PublicUser> {
  await requireDb();
  const now = new Date();
  const email = normalizeEmail(input.email);
  const isStaff = input.accountType === "staff";
  const result = await collection("users").insertOne({
    openId: localOpenId(email), email, name: input.name.trim(), passwordHash: input.passwordHash,
    accountType: input.accountType, accountStatus: isStaff ? "pending" : "active", role: "member",
    requestedRole: isStaff ? input.requestedRole ?? "worker" : null, requestNote: isStaff ? input.requestNote?.trim() || null : null,
    approvalNote: null, approvedBy: null, approvedAt: isStaff ? null : now, suspendedAt: null,
    createdAt: now, updatedAt: now, lastSignedIn: now,
  });
  const created = await collection("users").findOne({ _id: result.insertedId });
  if (!created) throw new Error("Account creation failed");
  return toPublicUser(serialize<User>(created));
}
export async function createMasterAdmin(input: { name: string; email: string; passwordHash: string }): Promise<PublicUser> {
  await requireDb();
  const now = new Date();
  const email = normalizeEmail(input.email);
  const result = await collection("users").insertOne({
    openId: localOpenId(email), email, name: input.name.trim(), passwordHash: input.passwordHash,
    accountType: "staff", accountStatus: "active", role: "master_admin", requestedRole: null, requestNote: null,
    approvalNote: "Initial Master Admin account", approvedBy: "system", approvedAt: now, suspendedAt: null,
    createdAt: now, updatedAt: now, lastSignedIn: now,
  });
  const created = await collection("users").findOne({ _id: result.insertedId });
  if (!created) throw new Error("Master Admin creation failed");
  return toPublicUser(serialize<User>(created));
}
export async function touchUser(id: string) { await requireDb(); await collection("users").updateOne({ _id: asId(id) }, { $set: { lastSignedIn: new Date(), updatedAt: new Date() } }); }
export async function updateAccountName(id: string, name: string) {
  await requireDb();
  const result = await collection("users").findOneAndUpdate({ _id: asId(id) }, { $set: { name: name.trim(), updatedAt: new Date() } }, { returnDocument: "after" });
  if (!result) throw new Error("Account not found");
  return toPublicUser(serialize<User>(result));
}
export async function updateAccountPassword(id: string, passwordHash: string) {
  await requireDb();
  const result = await collection("users").findOneAndUpdate({ _id: asId(id) }, { $set: { passwordHash, updatedAt: new Date() } }, { returnDocument: "after" });
  if (!result) throw new Error("Account not found");
  return toPublicUser(serialize<User>(result));
}
export async function listAccessRequests(status: AccountStatus = "pending"): Promise<PublicUser[]> {
  const db = await getDb(); if (!db) return [];
  const records = await collection("users").find({ accountType: "staff", accountStatus: status }).sort({ createdAt: -1 }).toArray();
  return records.map(record => toPublicUser(serialize<User>(record)));
}
export async function decideStaffRequest(input: { id: string; approverId: string; decision: "approve" | "reject"; role?: Exclude<UserRole, "master_admin">; note?: string | null }) {
  await requireDb();
  const now = new Date();
  const update = input.decision === "approve"
    ? { accountStatus: "active", role: input.role ?? "worker", approvedBy: input.approverId, approvedAt: now, approvalNote: input.note?.trim() || null, updatedAt: now }
    : { accountStatus: "rejected", approvalNote: input.note?.trim() || "Request not approved", updatedAt: now };
  const result = await collection("users").findOneAndUpdate({ _id: asId(input.id), accountType: "staff", accountStatus: "pending" }, { $set: update }, { returnDocument: "after" });
  if (!result) throw new Error("Pending staff request not found");
  return toPublicUser(serialize<User>(result));
}
export async function suspendAccount(id: string, approverId: string) {
  await requireDb();
  const result = await collection("users").findOneAndUpdate({ _id: asId(id), role: { $ne: "master_admin" } }, { $set: { accountStatus: "suspended", suspendedAt: new Date(), approvedBy: approverId, updatedAt: new Date() } }, { returnDocument: "after" });
  if (!result) throw new Error("Account not found or protected");
  return toPublicUser(serialize<User>(result));
}
export function managedStaffFilter(status?: AccountStatus): Filter<Document> {
  return { accountType: "staff", role: { $ne: "master_admin" }, ...(status ? { accountStatus: status } : { accountStatus: { $in: ["active", "rejected", "suspended"] } }) };
}
export async function listManagedStaff(status?: AccountStatus): Promise<PublicUser[]> {
  const db = await getDb(); if (!db) return [];
  const query = managedStaffFilter(status);
  return (await collection("users").find(query).sort({ updatedAt: -1 }).toArray()).map(record => toPublicUser(serialize<User>(record)));
}
export async function changeStaffRole(id: string, role: Exclude<UserRole, "master_admin">, approverId: string) {
  await requireDb();
  const result = await collection("users").findOneAndUpdate({ _id: asId(id), accountType: "staff", role: { $ne: "master_admin" }, accountStatus: "active" }, { $set: { role, approvedBy: approverId, updatedAt: new Date() } }, { returnDocument: "after" });
  if (!result) throw new Error("Active staff account not found or protected");
  return toPublicUser(serialize<User>(result));
}
export async function reactivateStaff(id: string, approverId: string) {
  await requireDb();
  const result = await collection("users").findOneAndUpdate({ _id: asId(id), accountType: "staff", role: { $ne: "master_admin" }, accountStatus: "suspended" }, { $set: { accountStatus: "active", suspendedAt: null, approvedBy: approverId, updatedAt: new Date() } }, { returnDocument: "after" });
  if (!result) throw new Error("Suspended staff account not found or protected");
  return toPublicUser(serialize<User>(result));
}

export async function getMemberProfile(userId: string): Promise<MemberProfile | undefined> {
  const db = await getDb(); if (!db) return undefined;
  const record = await collection("memberProfiles").findOne({ userId });
  return record ? serialize<MemberProfile>(record) : undefined;
}

export async function saveMemberProfile(input: { userId: string; ministryInterests: MinistryInterest[]; serviceAvailability: ServiceAvailability | null; wantsParishUpdates: boolean; isGuardian: boolean; juniorAgeCategories: JuniorAgeCategory[]; onboardingCompleted?: boolean }): Promise<MemberProfile> {
  await requireDb();
  const now = new Date();
  const result = await collection("memberProfiles").findOneAndUpdate(
    { userId: input.userId },
    {
      $set: {
        ministryInterests: Array.from(new Set(input.ministryInterests)),
        serviceAvailability: input.serviceAvailability,
        wantsParishUpdates: input.wantsParishUpdates,
        isGuardian: input.isGuardian,
        juniorAgeCategories: input.isGuardian ? Array.from(new Set(input.juniorAgeCategories)) : [],
        onboardingCompletedAt: input.onboardingCompleted ? now : null,
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true, returnDocument: "after" },
  );
  if (!result) throw new Error("Member profile could not be saved");
  return serialize<MemberProfile>(result);
}

export async function setEventInterest(input: { userId: string; eventId: string; interested: boolean }) {
  await requireDb();
  if (input.interested) {
    await collection("eventInterests").updateOne({ userId: input.userId, eventId: input.eventId }, { $setOnInsert: { userId: input.userId, eventId: input.eventId, createdAt: new Date(), updatedAt: new Date() } }, { upsert: true });
  } else {
    await collection("eventInterests").deleteOne({ userId: input.userId, eventId: input.eventId });
  }
  return { eventId: input.eventId, interested: input.interested };
}

export async function listEventInterestIds(userId: string): Promise<string[]> {
  const db = await getDb(); if (!db) return [];
  return (await collection("eventInterests").find({ userId }).toArray()).map(record => String(record.eventId));
}

export async function listMemberProfilesForStaff() {
  const db = await getDb(); if (!db) return [];
  const profiles = (await collection("memberProfiles").find({}).sort({ updatedAt: -1 }).toArray()).map(serialize<MemberProfile>);
  const users = await collection("users").find({ _id: { $in: profiles.map(profile => asId(profile.userId)) }, accountType: "member", accountStatus: "active" }).toArray();
  const members = new Map(users.map(user => { const member = toPublicUser(serialize<User>(user)); return [member.id, member] as const; }));
  return profiles.flatMap(profile => { const member = members.get(profile.userId); return member ? [{ profile, member }] : []; });
}

export async function createMemberUpdate(input: { title: string; body: string; audience: MemberUpdateAudience; audienceValues: string[]; createdBy: string; isPublished: boolean }) {
  const id = await saveRecord("memberUpdates", { ...input, audienceValues: Array.from(new Set(input.audienceValues)) });
  const record = await collection("memberUpdates").findOne({ _id: asId(id) });
  if (!record) throw new Error("Member update could not be created");
  return serialize<MemberUpdate>(record);
}

export async function listMemberUpdatesForStaff(): Promise<MemberUpdate[]> {
  const db = await getDb(); if (!db) return [];
  return (await collection("memberUpdates").find({}).sort({ createdAt: -1 }).toArray()).map(serialize<MemberUpdate>);
}

export async function listMemberUpdatesForUser(userId: string): Promise<MemberUpdate[]> {
  const db = await getDb(); if (!db) return [];
  const profile = await getMemberProfile(userId);
  if (profile && !profile.wantsParishUpdates) return [];
  const ministryInterests = profile?.ministryInterests ?? [];
  const juniorAgeCategories = profile?.isGuardian ? profile.juniorAgeCategories : [];
  const query: Filter<Document> = { isPublished: true, $or: [{ audience: "all" }, { audience: "ministry", audienceValues: { $in: ministryInterests } }, { audience: "junior-category", audienceValues: { $in: juniorAgeCategories } }] };
  return (await collection("memberUpdates").find(query).sort({ createdAt: -1 }).toArray()).map(serialize<MemberUpdate>);
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

export async function listPosts(category?: string, includeUnpublished = false): Promise<Post[]> { const db = await getDb(); if (!db) return []; const query: Filter<Document> = { ...(includeUnpublished ? {} : { isPublished: true }), ...(category ? { category } : {}) }; return (await collection("posts").find(query).sort({ publishedAt: -1, createdAt: -1 }).toArray()).map(serialize<Post>); }
export async function getPostBySlug(slug: string, includeUnpublished = false): Promise<Post | undefined> { const db = await getDb(); if (!db) return undefined; const record = await collection("posts").findOne(includeUnpublished ? { slug } : { slug, isPublished: true }); return record ? serialize<Post>(record) : undefined; }
export const savePost = (values: NewPost, id?: string) => saveRecord("posts", values, id);
export const deletePost = (id: string) => deleteRecord("posts", id);

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

export async function getContentCounts() { const db = await getDb(); if (!db) return { sermons: 0, events: 0, posts: 0, media: 0, ministries: 0 }; const [sermons, events, posts, media, ministries] = await Promise.all(["sermons", "events", "posts", "mediaAssets", "ministryPages"].map(name => collection(name).countDocuments())); return { sermons, events, posts, media, ministries }; }
