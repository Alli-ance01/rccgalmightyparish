import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { EmptyCard, PageHero, QueryError } from "@/components/PageBits";
import PublicLayout from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";

export default function News() {
  const { data: allPosts = [] } = trpc.content.posts.list.useQuery();
  const [category, setCategory] = useState("");
  const queryInput = useMemo(() => category ? { category } : undefined, [category]);
  const { data: posts = [], isLoading } = trpc.content.posts.list.useQuery(queryInput);
  const categories = Array.from(new Set(allPosts.map(post => post.category)));
  return <PublicLayout><PageHero eyebrow="News and stories" title="Life in the TAP family." copy="Parish news, faith resources, stories of growth, and practical encouragement from our community." /><section className="container py-16 sm:py-24"><div className="flex flex-wrap gap-2"><button onClick={() => setCategory("")} className={`tap-button rounded-full px-4 py-2 text-xs font-extrabold ${!category ? "bg-[#0b4ab8] text-white" : "border border-slate-200 bg-white text-slate-600"}`}>All stories</button>{categories.map(item => <button key={item} onClick={() => setCategory(item)} className={`tap-button rounded-full px-4 py-2 text-xs font-extrabold ${category === item ? "bg-[#0b4ab8] text-white" : "border border-slate-200 bg-white text-slate-600"}`}>{item}</button>)}</div>{posts.length ? <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{posts.map(post => <Link href={`/news/${post.slug}`} key={post.id} className="group rounded-[1.4rem] border border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5"><p className="eyebrow text-[#0b4ab8]">{post.category}</p><h2 className="display mt-7 text-3xl leading-[0.94] text-[#10213e]">{post.title}</h2><p className="mt-4 text-sm leading-6 text-slate-600">{post.excerpt}</p><div className="mt-8 flex items-center justify-between"><p className="text-xs font-bold text-slate-500">{post.authorName}</p><span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#0b4ab8]">Read<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span></div></Link>)}</div> : <div className="mt-10">{isLoading ? <EmptyCard title="Loading news…" copy="Retrieving published parish updates and resources." /> : (allPosts.length === 0 ? <EmptyCard title="The news desk is ready." copy="Published parish updates, articles, and resources will appear here once they are added by the communications team." /> : <QueryError label="We could not load this category." retry={() => void window.location.reload()} />)}</div>}</section></PublicLayout>;
}
