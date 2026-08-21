import { ArrowUpRight, CalendarDays, MapPin, PlayCircle } from "lucide-react";
import { Link } from "wouter";

export function SectionHeading({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy?: string; action?: { label: string; href: string } }) {
  return <div className="grid gap-5 md:grid-cols-[0.9fr_1.5fr_auto] md:items-end"><div><p className="eyebrow text-[#0b4ab8]">{eyebrow}</p></div><div><h2 className="display text-4xl leading-[0.96] text-[#10213e] sm:text-5xl">{title}</h2>{copy && <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">{copy}</p>}</div>{action && <Link href={action.href} className="tap-button inline-flex w-fit items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-xs font-extrabold text-[#10213e] hover:border-[#0b4ab8] hover:text-[#0b4ab8]">{action.label}<ArrowUpRight className="h-3.5 w-3.5" /></Link>}</div>;
}

export function PageHero({ eyebrow, title, copy, label = "TAP Church", extra }: { eyebrow: string; title: string; copy: string; label?: string; extra?: React.ReactNode }) {
  return <section className="mesh grid-noise overflow-hidden text-white"><div className="container relative py-20 sm:py-28"><div className="absolute right-[-3rem] top-[-2.5rem] h-48 w-48 rounded-full border border-white/20 bg-white/5 sm:h-72 sm:w-72" /><div className="relative max-w-3xl"><p className="eyebrow text-[#d7ff54]">{eyebrow}</p><h1 className="display mt-5 text-5xl leading-[0.94] sm:text-7xl">{title}</h1><p className="mt-6 max-w-2xl text-base leading-7 text-blue-100 sm:text-lg">{copy}</p>{extra && <div className="mt-8">{extra}</div>}<p className="mt-12 text-[0.68rem] font-extrabold tracking-[0.16em] text-blue-200">{label}</p></div></div></section>;
}

export function EmptyCard({ title, copy, action }: { title: string; copy: string; action?: { label: string; href: string } }) {
  return <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-7"><p className="font-bold text-[#10213e]">{title}</p><p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">{copy}</p>{action && <Link href={action.href} className="mt-5 inline-flex items-center gap-1 border-b border-[#0b4ab8] pb-1 text-xs font-extrabold text-[#0b4ab8]">{action.label}<ArrowUpRight className="h-3.5 w-3.5" /></Link>}</div>;
}

export function QueryError({ label = "We could not load this content.", retry }: { label?: string; retry?: () => void }) {
  return <div className="rounded-[1.25rem] border border-rose-100 bg-rose-50 p-6"><p className="font-extrabold text-rose-800">{label}</p><p className="mt-2 text-sm leading-6 text-rose-700">Please check your connection and try again. If the issue continues, contact the parish team.</p>{retry && <button onClick={retry} className="tap-button mt-4 rounded-full border border-rose-200 bg-white px-4 py-2 text-xs font-extrabold text-rose-700">Try again</button>}</div>;
}

export function EventMeta({ date, location }: { date: Date; location: string }) {
  return <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold text-slate-500"><span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-[#0b4ab8]" />{date.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</span><span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[#0b4ab8]" />{location}</span></div>;
}

export function VideoEmbed({ provider, videoId, title }: { provider: "youtube" | "vimeo" | "none"; videoId: string | null; title: string }) {
  if (provider === "none" || !videoId) return <div className="grid aspect-video place-items-center rounded-[1.25rem] bg-[#092c75] text-center text-blue-100"><div><PlayCircle className="mx-auto h-9 w-9 text-[#d7ff54]" /><p className="mt-3 text-sm font-bold">Video will be added by the ministry team.</p></div></div>;
  const src = provider === "youtube" ? `https://www.youtube-nocookie.com/embed/${videoId}` : `https://player.vimeo.com/video/${videoId}`;
  return <div className="aspect-video overflow-hidden rounded-[1.25rem] bg-slate-900 shadow-2xl"><iframe src={src} title={title} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>;
}
