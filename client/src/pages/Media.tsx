import { FileText, Image, PlayCircle } from "lucide-react";
import { Link } from "wouter";
import { EmptyCard, PageHero, QueryError } from "@/components/PageBits";
import PublicLayout from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";
import { useMemo, useState } from "react";
import { filterArchiveItems } from "@/lib/archiveSearch";

export default function Media() {
  const query = trpc.content.media.list.useQuery();
  const media = query.data ?? [];
  const [search, setSearch] = useState("");
  const matching = useMemo(() => filterArchiveItems(media, search), [media, search]);
  return <PublicLayout><PageHero eyebrow="Media gallery" title="Moments from the TAP family." copy="Photos, videos, and resources from worship, ministry, community, and everyday parish life." /><section className="container py-16 sm:py-24">{query.isError ? <QueryError retry={() => void query.refetch()} /> : media.length ? <><label className="mx-auto block max-w-xl text-xs font-extrabold uppercase tracking-[0.11em] text-slate-500">Search media<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Try worship, youth, document…" className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm normal-case tracking-normal text-[#10213e] outline-none focus:border-[#0b4ab8]" /></label>{matching.length ? <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{matching.map(item => <Link href={`/media/${item.id}`} key={item.id} className="overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5">{item.mediaType === "image" ? <img src={item.url} alt={item.altText ?? item.title} className="aspect-[4/3] w-full object-cover" /> : <div className="grid aspect-[4/3] place-items-center bg-[#0b4ab8] text-white">{item.mediaType === "video" ? <PlayCircle className="h-10 w-10 text-[#d7ff54]" /> : <FileText className="h-10 w-10 text-[#d7ff54]" />}</div>}<div className="p-5"><p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-[#0b4ab8]">{item.mediaType === "image" ? <Image className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}<span>{item.mediaType}</span></p><p className="mt-3 font-extrabold text-[#10213e]">{item.title}</p><p className="mt-4 text-xs font-extrabold text-[#0b4ab8]">View media</p></div></Link>)}</div> : <div className="mt-8"><EmptyCard title="No matching media." copy="Try another word or clear the search to browse the published library." /></div>}</> : <EmptyCard title={query.isLoading ? "Loading media…" : "A gallery in the making."} copy="Published photo, video, and document assets uploaded by the media team will be available here. Files are stored securely through the parish media system." />}</section></PublicLayout>;
}
