export const USER_ROLES = ["member", "worker", "ministry_leader", "editor", "admin", "master_admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];
export const ACCOUNT_TYPES = ["member", "staff"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];
export const ACCOUNT_STATUSES = ["active", "pending", "rejected", "suspended"] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export type User = {
  id: string;
  openId: string;
  name: string;
  email: string;
  passwordHash: string;
  accountType: AccountType;
  accountStatus: AccountStatus;
  role: UserRole;
  requestedRole: Exclude<UserRole, "master_admin"> | null;
  requestNote: string | null;
  approvalNote: string | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  suspendedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
};

export type PublicUser = Omit<User, "passwordHash">;

type Entity = { id: string; createdAt: Date; updatedAt: Date };

export const MINISTRY_INTERESTS = ["almighty-elders", "almighty-excellent-men", "almighty-good-women", "almighty-yaya", "junior-church-family"] as const;
export type MinistryInterest = (typeof MINISTRY_INTERESTS)[number];

export const SERVICE_AVAILABILITY = ["sunday", "weekday", "flexible"] as const;
export type ServiceAvailability = (typeof SERVICE_AVAILABILITY)[number];

export const JUNIOR_AGE_CATEGORIES = ["super-teens", "junior-teens", "preteens-9-12", "ages-6-8", "ages-0-5"] as const;
export type JuniorAgeCategory = (typeof JUNIOR_AGE_CATEGORIES)[number];

export type MemberProfile = Entity & {
  userId: string;
  ministryInterests: MinistryInterest[];
  serviceAvailability: ServiceAvailability | null;
  wantsParishUpdates: boolean;
  isGuardian: boolean;
  juniorAgeCategories: JuniorAgeCategory[];
  onboardingCompletedAt: Date | null;
};

export type EventInterest = Entity & {
  userId: string;
  eventId: string;
};

export const MEMBER_UPDATE_AUDIENCES = ["all", "ministry", "junior-category"] as const;
export type MemberUpdateAudience = (typeof MEMBER_UPDATE_AUDIENCES)[number];

export type MemberUpdate = Entity & {
  title: string;
  body: string;
  audience: MemberUpdateAudience;
  audienceValues: string[];
  createdBy: string;
  isPublished: boolean;
};

export type NewMemberProfile = Omit<MemberProfile, keyof Entity>;
export type NewEventInterest = Omit<EventInterest, keyof Entity>;
export type NewMemberUpdate = Omit<MemberUpdate, keyof Entity>;

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

export const PRAYER_REQUEST_STATUSES = ["new", "prayed", "closed"] as const;
export type PrayerRequestStatus = (typeof PRAYER_REQUEST_STATUSES)[number];

export type PrayerRequest = Entity & {
  name: string | null;
  email: string | null;
  request: string;
  wantsFollowUp: boolean;
  status: PrayerRequestStatus;
  reviewedBy: string | null;
  reviewedAt: Date | null;
};

export type NewSermon = Omit<Sermon, keyof Entity>;
export type NewEvent = Omit<Event, keyof Entity>;
export type NewPost = Omit<Post, keyof Entity>;
export type NewAnnouncement = Omit<Announcement, keyof Entity>;
export type NewMinistryPage = Omit<MinistryPage, keyof Entity>;
export type NewMediaAsset = Omit<MediaAsset, keyof Entity>;
export type NewPrayerRequest = Omit<PrayerRequest, keyof Entity>;
