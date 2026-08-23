import { ArrowLeft, CalendarDays, Download, UserRound } from "lucide-react";
import { Link, useRoute } from "wouter";
import { QueryError, VideoEmbed } from "@/components/PageBits";
import PublicLayout from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";

export default function SermonDetail() {
  const [, params] = useRoute("/sermons/:slug");
  const slug = params?.slug ?? "";
  const query = trpc.content.sermons.bySlug.useQuery({ slug });
  const sermon = query.data;
  const isLoading = query.isLoading;
  if (query.isError) return <PublicLayout><section className="container py-24"><QueryError label="We could not load this sermon." retry={() => void query.refetch()} /></section></PublicLayout>;
  if (!isLoading && !sermon) return <PublicLayout><section className="container py-24"><Link href="/sermons" className="inline-flex items-center gap-2 text-xs font-extrabold text-[#0b4ab8]"><ArrowLeft className="h-3.5 w-3.5" />Sermon archive</Link><h1 className="display mt-8 text-5xl text-[#10213e]">This message is not available.</h1></section></PublicLayout>;
  if (!sermon) return <PublicLayout><div className="container py-24"><div className="h-72 animate-pulse rounded-[1.5rem] bg-slate-200" /></div></PublicLayout>;
  return <PublicLayout><section className="container py-12 sm:py-18"><Link href="/sermons" className="inline-flex items-center gap-2 text-xs font-extrabold text-[#0b4ab8]"><ArrowLeft className="h-3.5 w-3.5" />Sermon archive</Link>{sermon.coverImageUrl && <img src={sermon.coverImageUrl} alt="" className="mt-8 aspect-[2.2/1] w-full rounded-[1.5rem] object-cover" />}<div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]"><div><p className="eyebrow text-[#0b4ab8]">{sermon.series}</p><h1 className="display mt-5 text-5xl leading-[0.92] text-[#10213e] sm:text-6xl">{sermon.title}</h1><p className="mt-6 text-base leading-8 text-slate-600">{sermon.summary}</p><div className="mt-7 flex flex-wrap gap-5 text-sm font-bold text-slate-600"><span className="inline-flex items-center gap-2"><UserRound className="h-4 w-4 text-[#0b4ab8]" />{sermon.speaker}</span>{sermon.publishedAt && <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#0b4ab8]" />{new Date(sermon.publishedAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}</span>}</div></div><div className="rounded-[1.4rem] bg-[#eaf2ff] p-6"><p className="eyebrow text-[#0b4ab8]">Sermon notes</p><p className="mt-5 text-sm leading-7 text-slate-600">{sermon.sermonNotesTitle ?? "Download the message notes when the ministry team makes them available."}</p>{sermon.sermonNotesUrl && <a href={sermon.sermonNotesUrl} target="_blank" rel="noreferrer" className="tap-button mt-6 inline-flex items-center gap-2 rounded-full bg-[#0b4ab8] px-4 py-2.5 text-xs font-extrabold text-white"><Download className="h-3.5 w-3.5" />Download notes</a>}</div></div><div className="mt-12"><VideoEmbed provider={sermon.videoProvider} videoId={sermon.videoId} title={sermon.title} /></div></section></PublicLayout>;
}
