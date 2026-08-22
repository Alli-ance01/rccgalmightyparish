export const USER_ROLES = ["user", "member", "worker", "ministry_leader", "editor", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export type User = {
  id: string;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
};

export type InsertUser = Pick<User, "openId"> & Partial<Pick<User, "name" | "email" | "loginMethod" | "role" | "lastSignedIn">>;

type Entity = { id: string; createdAt: Date; updatedAt: Date };

export type Sermon = Entity & {
  title: string;
  slug: string;
  summary: string;
  speaker: string;
  series: string;
  videoProvider: "youtube" | "vimeo" | "none";
  videoId: string | null;
  sermonNotesTitle: string | null;
  sermonNotesUrl: string | null;
  coverImageUrl: string | null;
  publishedAt: Date | null;
  isPublished: boolean;
};

export type Event = Entity & {
  title: string;
  slug: string;
  excerpt: string;
  description: string;
  location: string;
  startsAt: Date;
  endsAt: Date | null;
  registrationUrl: string | null;
  coverImageUrl: string | null;
  isPublished: boolean;
};

export type Post = Entity & {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  category: string;
  coverImageUrl: string | null;
  authorName: string;
  publishedAt: Date | null;
  isPublished: boolean;
};

export type Announcement = Entity & {
  title: string;
  body: string;
  actionLabel: string | null;
  actionUrl: string | null;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
};

export type MinistryPage = Entity & {
  title: string;
  slug: string;
  audience: "main" | "junior";
  summary: string;
  description: string;
  leaderName: string | null;
  leaderRole: string | null;
  meetingInfo: string | null;
  heroImageUrl: string | null;
  isPublished: boolean;
};

export type MediaAsset = Entity & {
  title: string;
  altText: string | null;
  mediaType: "image" | "video" | "document";
  storageKey: string;
  url: string;
  mimeType: string;
  isPublished: boolean;
  createdBy: string | null;
};

export type NewSermon = Omit<Sermon, keyof Entity>;
export type NewEvent = Omit<Event, keyof Entity>;
export type NewPost = Omit<Post, keyof Entity>;
export type NewAnnouncement = Omit<Announcement, keyof Entity>;
export type NewMinistryPage = Omit<MinistryPage, keyof Entity>;
export type NewMediaAsset = Omit<MediaAsset, keyof Entity>;
