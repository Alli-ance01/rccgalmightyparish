import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is required to run the production database cleanup.");

const client = new MongoClient(uri);
await client.connect();
const db = client.db();
const users = db.collection("users");
const posts = db.collection("posts");
const announcements = db.collection("announcements");

try {
  const legacyPosts = await posts.find({}).toArray();
  let migratedPosts = 0;
  for (const post of legacyPosts) {
    const legacyPostId = post._id instanceof ObjectId ? post._id.toHexString() : String(post._id);
    const alreadyMigrated = await announcements.findOne({ legacyPostId });
    if (alreadyMigrated) continue;
    const excerpt = typeof post.excerpt === "string" && post.excerpt.trim() ? `${post.excerpt.trim()}\n\n` : "";
    const body = typeof post.body === "string" ? post.body.trim() : "";
    await announcements.insertOne({
      title: String(post.title ?? "Untitled announcement").trim(),
      body: `${excerpt}${body}`.trim() || "Announcement details will be added soon.",
      actionLabel: null,
      actionUrl: null,
      isActive: post.isPublished !== false,
      startsAt: post.publishedAt ?? null,
      endsAt: null,
      legacyPostId,
      createdAt: post.createdAt ?? new Date(),
      updatedAt: new Date(),
    });
    migratedPosts += 1;
  }

  const nonAdminUsers = await users.deleteMany({ role: { $ne: "admin" } });
  const legacyFields = ["requestedRole", "requestNote", "approvalNote", "approvedBy", "approvedAt", "suspendedAt"];
  const unset: Record<string, ""> = Object.fromEntries(legacyFields.map(field => [field, ""]));
  const normalizedAdmins = await users.updateMany({ role: "admin" }, { $set: { accountType: "admin", accountStatus: "active", updatedAt: new Date() }, $unset: unset });

  const droppedCollections: string[] = [];
  for (const name of ["memberProfiles", "eventInterests", "memberUpdates", "posts"]) {
    const exists = (await db.listCollections({ name }).toArray()).length > 0;
    if (exists) { await db.collection(name).drop(); droppedCollections.push(name); }
  }

  console.log(JSON.stringify({ migratedPosts, deletedNonAdminUsers: nonAdminUsers.deletedCount, normalizedAdmins: normalizedAdmins.modifiedCount, droppedCollections }, null, 2));
} finally {
  await client.close();
}
