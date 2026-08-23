import { ArrowRight, Bell } from "lucide-react";
import { Link } from "wouter";
import { EmptyCard, PageHero, QueryError } from "@/components/PageBits";
import PublicLayout from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";

export default function Announcements() {
  const query = trpc.content.announcements.list.useQuery();
  const notices = query.data ?? [];
  return <PublicLayout><PageHero eyebrow="Church updates" title="Stay informed." copy="Timely notices, service guidance, and important updates from TAP Church." /><section className="container py-16 sm:py-24">{query.isError ? <QueryError label="We could not load announcements." retry={() => void query.refetch()} /> : notices.length ? <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{notices.map(notice => <Link href={`/announcements/${notice.id}`} key={notice.id} className="group rounded-[1.4rem] border border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5"><Bell className="h-5 w-5 text-[#0b4ab8]" /><h2 className="display mt-7 text-3xl leading-[0.95] text-[#10213e]">{notice.title}</h2><p className="mt-4 line-clamp-4 text-sm leading-6 text-slate-600">{notice.body}</p><span className="mt-7 inline-flex items-center gap-1 text-xs font-extrabold text-[#0b4ab8]">Read update<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span></Link>)}</div> : <EmptyCard title={query.isLoading ? "Loading announcements…" : "No active announcements."} copy="Important updates from the church office will appear here when they are published." />}</section></PublicLayout>;
}
