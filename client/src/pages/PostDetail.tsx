import { ArrowLeft, CalendarDays } from "lucide-react";
import { Link, useRoute } from "wouter";
import { QueryError } from "@/components/PageBits";
import PublicLayout from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";

export default function PostDetail() {
  const [, params] = useRoute("/news/:slug");
  const slug = params?.slug ?? "";
  const query = trpc.content.posts.bySlug.useQuery({ slug });
  const post = query.data;
  const isLoading = query.isLoading;
  if (query.isError) return <PublicLayout><section className="container py-24"><QueryError label="We could not load this article." retry={() => void query.refetch()} /></section></PublicLayout>;
  if (!isLoading && !post) return <PublicLayout><section className="container py-24"><Link href="/news" className="inline-flex items-center gap-2 text-xs font-extrabold text-[#0b4ab8]"><ArrowLeft className="h-3.5 w-3.5" />News and stories</Link><h1 className="display mt-8 text-5xl text-[#10213e]">This article is not available.</h1></section></PublicLayout>;
  if (!post) return <PublicLayout><div className="container py-24"><div className="h-72 animate-pulse rounded-[1.5rem] bg-slate-200" /></div></PublicLayout>;
  return <PublicLayout><article className="container max-w-4xl py-12 sm:py-20"><Link href="/news" className="inline-flex items-center gap-2 text-xs font-extrabold text-[#0b4ab8]"><ArrowLeft className="h-3.5 w-3.5" />News and stories</Link><p className="eyebrow mt-12 text-[#0b4ab8]">{post.category}</p><h1 className="display mt-5 text-6xl leading-[0.91] text-[#10213e]">{post.title}</h1><div className="mt-7 flex flex-wrap gap-5 text-sm font-bold text-slate-500"><span>{post.authorName}</span>{post.publishedAt && <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#0b4ab8]" />{new Date(post.publishedAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}</span>}</div><div className="thin-rule my-12" /><div className="max-w-2xl whitespace-pre-line text-base leading-8 text-slate-700">{post.body}</div></article></PublicLayout>;
}
