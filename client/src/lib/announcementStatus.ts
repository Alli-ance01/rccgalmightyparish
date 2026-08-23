export type AnnouncementSchedule = { isActive?: unknown; startsAt?: unknown; endsAt?: unknown };

export function getAnnouncementStatus(item: AnnouncementSchedule, now = new Date()): "Draft" | "Scheduled" | "Active" | "Expired" {
  if (item.isActive !== true) return "Draft";
  const startsAt = item.startsAt ? new Date(item.startsAt as string | Date) : null;
  const endsAt = item.endsAt ? new Date(item.endsAt as string | Date) : null;
  if (startsAt && startsAt > now) return "Scheduled";
  if (endsAt && endsAt < now) return "Expired";
  return "Active";
}
