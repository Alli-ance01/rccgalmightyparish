import { ArrowLeft, CalendarDays, UserRound } from "lucide-react";
import { Link, useRoute } from "wouter";
import { EmptyCard, PageHero, QueryError } from "@/components/PageBits";
import PublicLayout from "@/components/PublicLayout";
import { mainMinistries } from "@/data/site";
import { trpc } from "@/lib/trpc";

export default function MinistryDetail() {
  const [, params] = useRoute("/ministries/:slug");
  const slug = params?.slug ?? "";
  const query = trpc.content.ministries.bySlug.useQuery({ slug });
  const managed = query.data;
  const isLoading = query.isLoading;
  const fallback = mainMinistries.find(item => item.slug === slug);
  const title = managed?.title ?? fallback?.name ?? "Ministry";
  const summary = managed?.summary ?? fallback?.line ?? "A place to grow in faith and community.";
  return <PublicLayout><PageHero eyebrow="TAP ministry" title={title} copy={summary} /><section className="container py-16 sm:py-24"><Link href="/ministries" className="inline-flex items-center gap-2 text-xs font-extrabold text-[#0b4ab8]"><ArrowLeft className="h-3.5 w-3.5" />All ministries</Link>{query.isError ? <div className="mt-8"><QueryError label="We could not load this ministry page." retry={() => void query.refetch()} /></div> : isLoading ? <div className="mt-8 h-44 animate-pulse rounded-[1.4rem] bg-slate-200" /> : <div className="mt-8 grid gap-7 lg:grid-cols-[1.2fr_0.8fr]"><article className="rounded-[1.5rem] border border-slate-200 bg-white p-7 sm:p-10"><p className="text-base leading-8 text-slate-600">{managed?.description ?? "This ministry page is ready for its leadership team to add their story, meeting details, resources, and upcoming opportunities."}</p></article><aside className="space-y-4">{managed?.leaderName ? <div className="rounded-[1.2rem] bg-[#eaf2ff] p-6"><UserRound className="h-5 w-5 text-[#0b4ab8]" /><p className="mt-6 text-xs font-extrabold uppercase tracking-[0.13em] text-[#0b4ab8]">Leadership</p><p className="mt-2 font-extrabold text-[#10213e]">{managed.leaderName}</p><p className="mt-1 text-sm text-slate-600">{managed.leaderRole}</p></div> : <EmptyCard title="Leadership profile coming soon" copy="The ministry team can publish an approved leadership profile from the administration workspace." />}{managed?.meetingInfo && <div className="rounded-[1.2rem] border border-slate-200 p-6"><CalendarDays className="h-5 w-5 text-[#0b4ab8]" /><p className="mt-5 text-sm font-extrabold text-[#10213e]">Meeting information</p><p className="mt-2 text-sm leading-6 text-slate-600">{managed.meetingInfo}</p></div>}</aside></div>}</section></PublicLayout>;
}
