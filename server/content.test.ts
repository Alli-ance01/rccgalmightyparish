import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

const dbMock = vi.hoisted(() => ({
  listSermons: vi.fn(),
  getSermonBySlug: vi.fn(),
  saveSermon: vi.fn(),
  deleteSermon: vi.fn(),
  listEvents: vi.fn(),
  getEventBySlug: vi.fn(),
  saveEvent: vi.fn(),
  deleteEvent: vi.fn(),
  listPosts: vi.fn(),
  getPostBySlug: vi.fn(),
  savePost: vi.fn(),
  deletePost: vi.fn(),
  listAnnouncements: vi.fn(),
  getAnnouncementById: vi.fn(),
  saveAnnouncement: vi.fn(),
  deleteAnnouncement: vi.fn(),
  listMinistryPages: vi.fn(),
  getMinistryBySlug: vi.fn(),
  saveMinistryPage: vi.fn(),
  deleteMinistryPage: vi.fn(),
  listMedia: vi.fn(),
  getMediaById: vi.fn(),
  saveMedia: vi.fn(),
  deleteMedia: vi.fn(),
  getContentCounts: vi.fn(),
}));

vi.mock("./db", () => dbMock);

function contextFor(role: "member" | "worker" | "ministry_leader" | "editor" | "admin" | "master_admin"): TrpcContext {
  return {
    user: {
      id: "507f1f77bcf86cd799439011",
      openId: `tap-${role}`,
      name: "TAP Tester",
      email: "tester@tapchurch.org",
      passwordHash: "test-hash",
      accountType: role === "member" ? "member" : "staff",
      accountStatus: "active",
      role,
      requestedRole: null,
      requestNote: null,
      approvalNote: null,
      approvedBy: null,
      approvedAt: null,
      suspendedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as TrpcContext["res"],
  };
}

describe("TAP content router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.listSermons.mockResolvedValue([]);
    dbMock.saveEvent.mockResolvedValue("507f1f77bcf86cd799439012");
    dbMock.getMediaById.mockResolvedValue(undefined);
    dbMock.getContentCounts.mockResolvedValue({ sermons: 2, events: 1, posts: 3, media: 4, ministries: 5 });
  });

  it("passes sermon search and archive filters to the public query layer", async () => {
    const caller = appRouter.createCaller(contextFor("member"));
    const from = new Date("2026-01-01T00:00:00.000Z");
    const to = new Date("2026-12-31T23:59:59.000Z");

    await caller.content.sermons.list({
      search: "faith",
      series: "Growing Together",
      speaker: "Pastor T",
      from,
      to,
    });

    expect(dbMock.listSermons).toHaveBeenCalledWith({
      search: "faith",
      series: "Growing Together",
      speaker: "Pastor T",
      from,
      to,
    });
  });

  it("prevents members from creating public events", async () => {
    const caller = appRouter.createCaller(contextFor("member"));

    await expect(caller.content.events.save({
      values: {
        title: "TAP Worship Night",
        slug: "tap-worship-night",
        excerpt: "A parish night of worship and prayer.",
        description: "A parish night of worship, prayer, and ministry in the presence of God.",
        location: "Ibadan, Nigeria",
        startsAt: new Date("2026-08-30T18:00:00.000Z"),
        endsAt: null,
        registrationUrl: "",
        coverImageUrl: "",
        isPublished: false,
      },
    })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows editors to save a well-formed event", async () => {
    const caller = appRouter.createCaller(contextFor("editor"));
    const startsAt = new Date("2026-08-30T18:00:00.000Z");

    await expect(caller.content.events.save({
      values: {
        title: "TAP Worship Night",
        slug: "tap-worship-night",
        excerpt: "A parish night of worship and prayer.",
        description: "A parish night of worship, prayer, and ministry in the presence of God.",
        location: "Ibadan, Nigeria",
        startsAt,
        endsAt: null,
        registrationUrl: "",
        coverImageUrl: "",
        isPublished: true,
      },
    })).resolves.toBe("507f1f77bcf86cd799439012");

    expect(dbMock.saveEvent).toHaveBeenCalledWith(expect.objectContaining({
      title: "TAP Worship Night",
      slug: "tap-worship-night",
      startsAt,
      isPublished: true,
    }), undefined);
  });

  it("allows approved staff to retrieve content dashboard counts", async () => {
    const caller = appRouter.createCaller(contextFor("worker"));

    await expect(caller.content.admin.summary()).resolves.toEqual({
      sermons: 2,
      events: 1,
      posts: 3,
      media: 4,
      ministries: 5,
    });
    expect(dbMock.getContentCounts).toHaveBeenCalledOnce();
  });

  it("uses the public media lookup contract for individual gallery pages", async () => {
    const caller = appRouter.createCaller(contextFor("member"));
    const id = "507f1f77bcf86cd799439013";
    dbMock.getMediaById.mockResolvedValue({ id, title: "Sunday Worship", isPublished: true });

    await expect(caller.content.media.byId({ id })).resolves.toMatchObject({
      id,
      title: "Sunday Worship",
    });
    expect(dbMock.getMediaById).toHaveBeenCalledWith(id);
  });

  it("allows editors to update media labels and public visibility without changing the stored file", async () => {
    const caller = appRouter.createCaller(contextFor("editor"));
    const id = "507f1f77bcf86cd799439015";
    const media = { id, title: "Sunday Worship", altText: "Congregation in worship", mediaType: "image", storageKey: "tap/sunday", url: "https://res.cloudinary.com/example/image/upload/tap/sunday.jpg", mimeType: "image/jpeg", isPublished: false, createdBy: "507f1f77bcf86cd799439011" };
    dbMock.listMedia.mockResolvedValue([media]);
    dbMock.saveMedia.mockResolvedValue(id);

    await expect(caller.content.media.updateMetadata({ id, title: "Sunday worship gathering", altText: "The congregation during Sunday worship", isPublished: true })).resolves.toBe(id);
    expect(dbMock.saveMedia).toHaveBeenCalledWith(expect.objectContaining({
      id,
      storageKey: "tap/sunday",
      url: media.url,
      title: "Sunday worship gathering",
      altText: "The congregation during Sunday worship",
      isPublished: true,
    }), id);
  });

  it("provides active announcements through public list and detail contracts", async () => {
    const caller = appRouter.createCaller(contextFor("member"));
    const id = "507f1f77bcf86cd799439014";
    const announcement = { id, title: "Prayer meeting venue", body: "This week we meet at the church auditorium.", isActive: true };
    dbMock.listAnnouncements.mockResolvedValue([announcement]);
    dbMock.getAnnouncementById.mockResolvedValue(announcement);

    await expect(caller.content.announcements.list()).resolves.toEqual([announcement]);
    await expect(caller.content.announcements.byId({ id })).resolves.toEqual(announcement);
    expect(dbMock.listAnnouncements).toHaveBeenCalledWith();
    expect(dbMock.getAnnouncementById).toHaveBeenCalledWith(id);
  });
});
