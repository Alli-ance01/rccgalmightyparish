import { ArrowLeft, CalendarDays, ExternalLink, MapPin } from "lucide-react";
import { Link, useRoute } from "wouter";
import { QueryError } from "@/components/PageBits";
import PublicLayout from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";

export default function EventDetail() {
  const [, params] = useRoute("/events/:slug");
  const slug = params?.slug ?? "";
  const query = trpc.content.events.bySlug.useQuery({ slug });
  const event = query.data;
  const isLoading = query.isLoading;
  if (query.isError) return <PublicLayout><section className="container py-24"><QueryError label="We could not load this event." retry={() => void query.refetch()} /></section></PublicLayout>;
  if (!isLoading && !event) return <PublicLayout><section className="container py-24"><Link href="/events" className="inline-flex items-center gap-2 text-xs font-extrabold text-[#0b4ab8]"><ArrowLeft className="h-3.5 w-3.5" />All events</Link><h1 className="display mt-8 text-5xl text-[#10213e]">This event is not available.</h1></section></PublicLayout>;
  if (!event) return <PublicLayout><div className="container py-24"><div className="h-72 animate-pulse rounded-[1.5rem] bg-slate-200" /></div></PublicLayout>;
  return <PublicLayout><section className="container py-12 sm:py-20"><Link href="/events" className="inline-flex items-center gap-2 text-xs font-extrabold text-[#0b4ab8]"><ArrowLeft className="h-3.5 w-3.5" />All events</Link><div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]"><div><p className="eyebrow text-[#0b4ab8]">TAP gathering</p><h1 className="display mt-5 text-6xl leading-[0.9] text-[#10213e]">{event.title}</h1><p className="mt-6 text-base leading-8 text-slate-600">{event.description}</p></div><aside className="rounded-[1.4rem] bg-[#eaf2ff] p-7"><p className="eyebrow text-[#0b4ab8]">Event details</p><p className="mt-7 flex gap-3 text-sm font-bold text-slate-700"><CalendarDays className="h-4 w-4 shrink-0 text-[#0b4ab8]" />{new Date(event.startsAt).toLocaleString("en-NG", { dateStyle: "full", timeStyle: "short" })}</p><p className="mt-5 flex gap-3 text-sm font-bold text-slate-700"><MapPin className="h-4 w-4 shrink-0 text-[#0b4ab8]" />{event.location}</p>{event.registrationUrl && <a href={event.registrationUrl} target="_blank" rel="noreferrer" className="tap-button mt-8 inline-flex items-center gap-2 rounded-full bg-[#0b4ab8] px-4 py-2.5 text-xs font-extrabold text-white">Register now<ExternalLink className="h-3.5 w-3.5" /></a>}</aside></div></section></PublicLayout>;
}
