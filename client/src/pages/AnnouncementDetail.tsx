import { ArrowLeft, Bell } from "lucide-react";
import { Link, useRoute } from "wouter";
import { EmptyCard, PageHero, QueryError } from "@/components/PageBits";
import PublicLayout from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";

export default function AnnouncementDetail() {
  const [, params] = useRoute("/announcements/:id");
  const query = trpc.content.announcements.byId.useQuery({ id: params?.id ?? "" }, { enabled: Boolean(params?.id) });
  const notice = query.data;
  return <PublicLayout>{query.isError ? <section className="container py-16"><QueryError label="We could not load this announcement." retry={() => void query.refetch()} /></section> : !notice && !query.isLoading ? <section className="container py-16"><EmptyCard title="Announcement not found." copy="It may have expired or been removed by the church office." /></section> : <><PageHero eyebrow="Church update" title={notice?.title ?? "Loading announcement…"} copy="Important information from TAP Church." /><article className="container max-w-4xl py-16 sm:py-24"><Link href="/announcements" className="inline-flex items-center gap-2 text-xs font-extrabold text-[#0b4ab8]"><ArrowLeft className="h-3.5 w-3.5" />All announcements</Link><div className="mt-8 rounded-[1.6rem] border border-slate-200 bg-white p-7 sm:p-10"><Bell className="h-6 w-6 text-[#0b4ab8]" /><div className="mt-7 whitespace-pre-line text-base leading-8 text-slate-700">{notice?.body}</div>{notice?.actionLabel && notice.actionUrl && <a href={notice.actionUrl} className="tap-button mt-8 inline-flex rounded-full bg-[#0b4ab8] px-5 py-3 text-sm font-extrabold text-white">{notice.actionLabel}</a>}</div></article></>}</PublicLayout>;
}
