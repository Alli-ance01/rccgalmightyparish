import { ArrowLeft, Download, FileText, PlayCircle } from "lucide-react";
import { Link, useRoute } from "wouter";
import { QueryError } from "@/components/PageBits";
import PublicLayout from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";

export default function MediaDetail() {
  const [, params] = useRoute("/media/:id");
  const id = Number(params?.id);
  const query = trpc.content.media.byId.useQuery({ id }, { enabled: Number.isInteger(id) && id > 0 });
  const media = query.data;
  return <PublicLayout><section className="container py-12 sm:py-20"><Link href="/media" className="inline-flex items-center gap-2 text-xs font-extrabold text-[#0b4ab8]"><ArrowLeft className="h-3.5 w-3.5" />Media gallery</Link>{query.isError ? <div className="mt-10"><QueryError label="We could not load this media item." retry={() => void query.refetch()} /></div> : query.isLoading ? <div className="mt-10 h-96 animate-pulse rounded-[1.5rem] bg-slate-200" /> : !media ? <h1 className="display mt-10 text-5xl text-[#10213e]">This media item is not available.</h1> : <div className="mt-10"><p className="eyebrow text-[#0b4ab8]">TAP media · {media.mediaType}</p><h1 className="display mt-5 text-6xl leading-[0.92] text-[#10213e]">{media.title}</h1><div className="mt-10 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-950">{media.mediaType === "image" ? <img src={media.url} alt={media.altText ?? media.title} className="max-h-[42rem] w-full object-contain" /> : media.mediaType === "video" ? <video src={media.url} controls className="w-full" title={media.title}><track kind="captions" /></video> : <div className="grid min-h-72 place-items-center text-center text-white"><div><FileText className="mx-auto h-12 w-12 text-[#d7ff54]" /><p className="mt-5 font-bold">Document resource</p><a href={media.url} target="_blank" rel="noreferrer" className="tap-button mt-5 inline-flex items-center gap-2 rounded-full bg-[#d7ff54] px-4 py-2.5 text-xs font-extrabold text-[#10213e]"><Download className="h-3.5 w-3.5" />Open document</a></div></div>}</div>{media.mediaType === "video" && <a href={media.url} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 text-xs font-extrabold text-[#0b4ab8]"><PlayCircle className="h-4 w-4" />Open video directly</a>}</div>}</section></PublicLayout>;
}
