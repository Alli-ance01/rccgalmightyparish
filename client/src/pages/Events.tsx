import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { EmptyCard, EventMeta, PageHero, QueryError } from "@/components/PageBits";
import PublicLayout from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";

export default function Events() {
  const query = trpc.content.events.list.useQuery();
  const events = query.data ?? [];
  const isLoading = query.isLoading;
  const now = new Date();
  const upcoming = events.filter(event => new Date(event.startsAt) >= now);
  const past = events.filter(event => new Date(event.startsAt) < now);
  const EventGrid = ({ items, heading }: { items: typeof events; heading: string }) => <div className="mt-10"><p className="eyebrow text-[#0b4ab8]">{heading}</p>{items.length ? <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{items.map(event => <Link href={`/events/${event.slug}`} key={event.id} className="group rounded-[1.4rem] border border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5"><h2 className="display text-3xl leading-[0.95] text-[#10213e]">{event.title}</h2><p className="mt-4 text-sm leading-6 text-slate-600">{event.excerpt}</p><EventMeta date={new Date(event.startsAt)} location={event.location} /><span className="mt-7 inline-flex items-center gap-1 text-xs font-extrabold text-[#0b4ab8]">View details<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span></Link>)}</div> : <div className="mt-5"><EmptyCard title={isLoading ? "Loading events…" : "No events published yet."} copy="Upcoming gatherings and recent parish events will appear here once the team publishes them." /></div>}</div>;
  return <PublicLayout><PageHero eyebrow="Events" title="Make time for what matters." copy="Gatherings, prayer moments, community events, and special services happening across TAP Church." /><section className="container py-16 sm:py-24">{query.isError ? <QueryError retry={() => void query.refetch()} /> : <><EventGrid heading="Coming up" items={upcoming} /><EventGrid heading="Past events" items={past} /></>}</section></PublicLayout>;
}
