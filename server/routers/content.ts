import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "../db";
import { cloudinaryConfigurationStatus, uploadToCloudinary, verifyCloudinaryConfiguration } from "../cloudinary";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

const staffProcedure = protectedProcedure.use(({ ctx, next }) => {
  const role = ctx.user.role;
  if (!["worker", "ministry_leader", "editor", "admin", "master_admin"].includes(role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Staff access is required." });
  }
  return next({ ctx });
});

const editorProcedure = protectedProcedure.use(({ ctx, next }) => {
  const role = ctx.user.role;
  if (!["editor", "admin", "master_admin"].includes(role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Editor or administrator access is required." });
  }
  return next({ ctx });
});

const optionalString = z.string().trim().max(1024).optional().nullable();
const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase hyphenated words for a URL slug.");
const mongoId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid content identifier.");

const sermonInput = z.object({
  title: z.string().trim().min(3).max(255),
  slug,
  summary: z.string().trim().min(10),
  speaker: z.string().trim().min(2).max(160),
  series: z.string().trim().min(2).max(160),
  videoProvider: z.enum(["youtube", "vimeo", "none"]),
  videoId: optionalString,
  sermonNotesTitle: optionalString,
  sermonNotesUrl: optionalString,
  coverImageUrl: optionalString,
  publishedAt: z.date().optional().nullable(),
  isPublished: z.boolean(),
});

const eventInput = z.object({
  title: z.string().trim().min(3).max(255),
  slug,
  excerpt: z.string().trim().min(10),
  description: z.string().trim().min(20),
  location: z.string().trim().min(2).max(255),
  startsAt: z.date(),
  endsAt: z.date().optional().nullable(),
  registrationUrl: optionalString,
  coverImageUrl: optionalString,
  isPublished: z.boolean(),
});

const postInput = z.object({
  title: z.string().trim().min(3).max(255),
  slug,
  excerpt: z.string().trim().min(10),
  body: z.string().trim().min(20),
  category: z.string().trim().min(2).max(64),
  coverImageUrl: optionalString,
  authorName: z.string().trim().min(2).max(160),
  publishedAt: z.date().optional().nullable(),
  isPublished: z.boolean(),
});

const announcementInput = z.object({
  title: z.string().trim().min(3).max(255),
  body: z.string().trim().min(5),
  actionLabel: z.string().trim().max(80).optional().nullable(),
  actionUrl: optionalString,
  isActive: z.boolean(),
  startsAt: z.date().optional().nullable(),
  endsAt: z.date().optional().nullable(),
});

const ministryInput = z.object({
  title: z.string().trim().min(3).max(255),
  slug,
  audience: z.enum(["main", "junior"]),
  summary: z.string().trim().min(10),
  description: z.string().trim().min(20),
  leaderName: z.string().trim().max(160).optional().nullable(),
  leaderRole: z.string().trim().max(160).optional().nullable(),
  meetingInfo: z.string().trim().max(255).optional().nullable(),
  heroImageUrl: optionalString,
  isPublished: z.boolean(),
});

function blankToNull(value: string | null | undefined) {
  return value?.trim() || null;
}

function sanitizeFilename(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9._-]/g, "-").replace(/-+/g, "-");
}

export const contentRouter = router({
  sermons: router({
    list: publicProcedure
      .input(z.object({ search: z.string().optional(), series: z.string().optional(), speaker: z.string().optional(), from: z.date().optional(), to: z.date().optional() }).optional())
      .query(({ input }) => db.listSermons(input)),
    bySlug: publicProcedure.input(z.object({ slug })).query(({ input }) => db.getSermonBySlug(input.slug)),
    save: editorProcedure.input(z.object({ id: mongoId.optional(), values: sermonInput })).mutation(({ input }) =>
      db.saveSermon({
        ...input.values,
        videoId: blankToNull(input.values.videoId),
        sermonNotesTitle: blankToNull(input.values.sermonNotesTitle),
        sermonNotesUrl: blankToNull(input.values.sermonNotesUrl),
        coverImageUrl: blankToNull(input.values.coverImageUrl),
        publishedAt: input.values.publishedAt ?? null,
      }, input.id),
    ),
    delete: editorProcedure.input(z.object({ id: mongoId })).mutation(({ input }) => db.deleteSermon(input.id)),
  }),
  events: router({
    list: publicProcedure.query(() => db.listEvents()),
    bySlug: publicProcedure.input(z.object({ slug })).query(({ input }) => db.getEventBySlug(input.slug)),
    save: editorProcedure.input(z.object({ id: mongoId.optional(), values: eventInput })).mutation(({ input }) =>
      db.saveEvent({
        ...input.values,
        registrationUrl: blankToNull(input.values.registrationUrl),
        coverImageUrl: blankToNull(input.values.coverImageUrl),
        endsAt: input.values.endsAt ?? null,
      }, input.id),
    ),
    delete: editorProcedure.input(z.object({ id: mongoId })).mutation(({ input }) => db.deleteEvent(input.id)),
    uploadCover: editorProcedure.input(z.object({ filename: z.string().trim().min(1).max(255), mimeType: z.string().trim().regex(/^image\//, "Choose an image file."), dataUrl: z.string().min(20).max(25 * 1024 * 1024, "Choose an image smaller than 18 MB.") })).mutation(async ({ ctx, input }) => {
      if (!input.dataUrl.includes(",")) throw new TRPCError({ code: "BAD_REQUEST", message: "The selected cover could not be read." });
      try {
        const uploaded = await uploadToCloudinary({ dataUrl: input.dataUrl, mediaType: "image", filename: `event-cover-${sanitizeFilename(input.filename)}`, contentType: input.mimeType, uploaderId: ctx.user.id });
        return { url: uploaded.secureUrl, storageKey: uploaded.publicId };
      } catch (error) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: error instanceof Error ? error.message : "Event cover upload failed." });
      }
    }),
  }),
  posts: router({
    list: publicProcedure.input(z.object({ category: z.string().optional() }).optional()).query(({ input }) => db.listPosts(input?.category)),
    bySlug: publicProcedure.input(z.object({ slug })).query(({ input }) => db.getPostBySlug(input.slug)),
    save: editorProcedure.input(z.object({ id: mongoId.optional(), values: postInput })).mutation(({ input }) =>
      db.savePost({ ...input.values, coverImageUrl: blankToNull(input.values.coverImageUrl), publishedAt: input.values.publishedAt ?? null }, input.id),
    ),
    delete: editorProcedure.input(z.object({ id: mongoId })).mutation(({ input }) => db.deletePost(input.id)),
  }),
  announcements: router({
    list: publicProcedure.query(() => db.listAnnouncements()),
    byId: publicProcedure.input(z.object({ id: mongoId })).query(({ input }) => db.getAnnouncementById(input.id)),
    save: editorProcedure.input(z.object({ id: mongoId.optional(), values: announcementInput })).mutation(({ input }) =>
      db.saveAnnouncement({
        ...input.values,
        actionLabel: blankToNull(input.values.actionLabel),
        actionUrl: blankToNull(input.values.actionUrl),
        startsAt: input.values.startsAt ?? null,
        endsAt: input.values.endsAt ?? null,
      }, input.id),
    ),
    delete: editorProcedure.input(z.object({ id: mongoId })).mutation(({ input }) => db.deleteAnnouncement(input.id)),
  }),
  ministries: router({
    list: publicProcedure.input(z.object({ audience: z.enum(["main", "junior"]).optional() }).optional()).query(({ input }) => db.listMinistryPages(input?.audience)),
    bySlug: publicProcedure.input(z.object({ slug })).query(({ input }) => db.getMinistryBySlug(input.slug)),
    save: staffProcedure.input(z.object({ id: mongoId.optional(), values: ministryInput })).mutation(({ input }) =>
      db.saveMinistryPage({
        ...input.values,
        leaderName: blankToNull(input.values.leaderName),
        leaderRole: blankToNull(input.values.leaderRole),
        meetingInfo: blankToNull(input.values.meetingInfo),
        heroImageUrl: blankToNull(input.values.heroImageUrl),
      }, input.id),
    ),
    delete: staffProcedure.input(z.object({ id: mongoId })).mutation(({ input }) => db.deleteMinistryPage(input.id)),
  }),
  media: router({
    list: publicProcedure.query(() => db.listMedia()),
    byId: publicProcedure.input(z.object({ id: mongoId })).query(({ input }) => db.getMediaById(input.id)),
    cloudinaryStatus: editorProcedure.query(() => cloudinaryConfigurationStatus()),
    verifyCloudinary: editorProcedure.mutation(async () => {
      const result = await verifyCloudinaryConfiguration();
      if (!result.verified) throw new TRPCError({ code: "PRECONDITION_FAILED", message: result.message });
      return result;
    }),
    upload: editorProcedure.input(z.object({
      title: z.string().trim().min(3).max(255),
      altText: z.string().trim().max(255).optional().nullable(),
      mediaType: z.enum(["image", "video", "document"]),
      filename: z.string().trim().min(1).max(255),
      mimeType: z.string().trim().min(3).max(160),
      dataUrl: z.string().min(20).max(25 * 1024 * 1024, "Choose a file smaller than 18 MB for this initial upload flow."),
      isPublished: z.boolean(),
    })).mutation(async ({ ctx, input }) => {
      if (!input.dataUrl.includes(",")) throw new TRPCError({ code: "BAD_REQUEST", message: "The selected file could not be read." });
      let uploaded: Awaited<ReturnType<typeof uploadToCloudinary>>;
      try {
        uploaded = await uploadToCloudinary({ dataUrl: input.dataUrl, mediaType: input.mediaType, filename: sanitizeFilename(input.filename), contentType: input.mimeType, uploaderId: ctx.user.id });
      } catch (error) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: error instanceof Error ? error.message : "Cloudinary upload failed." });
      }
      return db.saveMedia({
        title: input.title,
        altText: blankToNull(input.altText),
        mediaType: input.mediaType,
        storageKey: uploaded.publicId,
        url: uploaded.secureUrl,
        mimeType: uploaded.mimeType,
        isPublished: input.isPublished,
        createdBy: ctx.user.id,
      });
    }),
    setPublished: editorProcedure.input(z.object({ id: mongoId, isPublished: z.boolean() })).mutation(async ({ input }) => {
      const current = (await db.listMedia(true)).find(media => media.id === input.id);
      if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Media item not found." });
      return db.saveMedia({ ...current, isPublished: input.isPublished }, input.id);
    }),
    updateMetadata: editorProcedure.input(z.object({ id: mongoId, title: z.string().trim().min(3).max(255), altText: z.string().trim().max(255).optional().nullable(), isPublished: z.boolean() })).mutation(async ({ input }) => {
      const current = (await db.listMedia(true)).find(media => media.id === input.id);
      if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Media item not found." });
      return db.saveMedia({ ...current, title: input.title, altText: blankToNull(input.altText), isPublished: input.isPublished }, input.id);
    }),
    delete: editorProcedure.input(z.object({ id: mongoId })).mutation(({ input }) => db.deleteMedia(input.id)),
  }),
  admin: router({
    summary: staffProcedure.query(() => db.getContentCounts()),
    all: staffProcedure.query(async () => {
      const [sermonRows, eventRows, postRows, announcementRows, ministryRows, mediaRows] = await Promise.all([
        db.listSermons({ includeUnpublished: true }),
        db.listEvents(true),
        db.listPosts(undefined, true),
        db.listAnnouncements(true),
        db.listMinistryPages(undefined, true),
        db.listMedia(true),
      ]);
      return { sermons: sermonRows, events: eventRows, posts: postRows, announcements: announcementRows, ministries: ministryRows, media: mediaRows };
    }),
  }),
});
