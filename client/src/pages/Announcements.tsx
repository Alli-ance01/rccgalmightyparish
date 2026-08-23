import { ArrowRight, Bell } from "lucide-react";
import { Link } from "wouter";
import { EmptyCard, PageHero, QueryError } from "@/components/PageBits";
import PublicLayout from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";
import { useMemo, useState } from "react";
import { filterArchiveItems } from "@/lib/archiveSearch";

export default function Announcements() {
  const query = trpc.content.announcements.list.useQuery();
  const notices = query.data ?? [];
  const [search, setSearch] = useState("");
  const matching = useMemo(() => filterArchiveItems(notices, search), [notices, search]);
  return <PublicLayout><PageHero eyebrow="Church updates" title="Stay informed." copy="Timely notices, service guidance, and important updates from TAP Church." /><section className="container py-16 sm:py-24">{query.isError ? <QueryError label="We could not load announcements." retry={() => void query.refetch()} /> : notices.length ? <><label className="mx-auto block max-w-xl text-xs font-extrabold uppercase tracking-[0.11em] text-slate-500">Search announcements<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Try service, prayer, youth…" className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm normal-case tracking-normal text-[#10213e] outline-none focus:border-[#0b4ab8]" /></label>{matching.length ? <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{matching.map(notice => <Link href={`/announcements/${notice.id}`} key={notice.id} className="group rounded-[1.4rem] border border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5"><Bell className="h-5 w-5 text-[#0b4ab8]" /><h2 className="display mt-7 text-3xl leading-[0.95] text-[#10213e]">{notice.title}</h2><p className="mt-4 line-clamp-4 text-sm leading-6 text-slate-600">{notice.body}</p><span className="mt-7 inline-flex items-center gap-1 text-xs font-extrabold text-[#0b4ab8]">Read update<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span></Link>)}</div> : <div className="mt-8"><EmptyCard title="No matching announcements." copy="Try another word or clear the search to see all active updates." /></div>}</> : <EmptyCard title={query.isLoading ? "Loading announcements…" : "No active announcements."} copy="Important updates from the church office will appear here when they are published." />}</section></PublicLayout>;
}
