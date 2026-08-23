import { Bell, Menu, Play, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { navigation } from "@/data/site";
import { trpc } from "@/lib/trpc";

const utilities = [
  { label: "Contact", href: "/contact" },
  { label: "Leadership", href: "/leadership" },
  { label: "Junior Church", href: "/junior-church" },
  { label: "Media", href: "/media" },
  { label: "News", href: "/news" },
  { label: "Announcements", href: "/announcements" },
  { label: "Account", href: "/account" },
];

export function TapMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className="flex items-center gap-2.5" aria-label="RCCG, The Almighty Parish">
      <span className={`grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border ${inverse ? "border-white/40 bg-white" : "border-blue-100 bg-white"}`}><img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663804076298/hIMtHTrGgFsxuoBl.png" alt="" className="h-full w-full scale-[1.18] object-contain" /></span>
      <span className={`leading-none ${inverse ? "text-white" : "text-[#10213e]"}`}>
        <strong className="block text-[0.69rem] font-extrabold tracking-[0.08em]">RCCG, THE ALMIGHTY PARISH</strong>
        <small className={`block pt-1 text-[0.58rem] font-bold tracking-[0.12em] ${inverse ? "text-blue-100" : "text-slate-500"}`}>RCCG TAP</small>
      </span>
    </div>
  );
}

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const announcements = trpc.content.announcements.list.useQuery();
  const notice = announcements.data?.[0];

  const isActive = (href: string) => href === "/" ? location === "/" : location.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-[#f7f9fc]/90 backdrop-blur-xl">
      {notice && <div className="border-b border-blue-100 bg-[#eaf2ff] text-[#0b4ab8]"><div className="container flex min-h-10 items-center gap-2 py-2 text-xs font-bold"><Bell className="h-3.5 w-3.5 shrink-0" /><Link href={`/announcements/${notice.id}`} className="min-w-0 truncate hover:underline">{notice.title}</Link>{notice.actionLabel && notice.actionUrl && <a href={notice.actionUrl} className="ml-auto shrink-0 rounded-full border border-blue-200 bg-white px-2.5 py-1 text-[0.65rem] font-extrabold hover:bg-blue-50">{notice.actionLabel}</a>}</div></div>}
      <div className="container flex h-[4.75rem] items-center justify-between gap-4">
        <Link href="/" onClick={() => setOpen(false)}><TapMark /></Link>
        <nav className="hidden items-center gap-5 lg:flex" aria-label="Primary navigation">
          {navigation.map(item => <Link key={item.href} href={item.href} className={`text-[0.82rem] font-bold transition-colors hover:text-[#0b4ab8] ${isActive(item.href) ? "text-[#0b4ab8]" : "text-slate-600"}`}>{item.label}</Link>)}
          <div className="h-4 w-px bg-slate-200" />
          <details className="group relative">
            <summary className="cursor-pointer list-none text-[0.82rem] font-bold text-slate-600 transition-colors hover:text-[#0b4ab8]">More</summary>
            <div className="absolute right-0 top-7 grid w-44 gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-xl shadow-blue-950/10">{utilities.map(item => <Link key={item.href} href={item.href} className={`rounded-lg px-3 py-2 text-[0.78rem] font-bold transition-colors hover:bg-blue-50 hover:text-[#0b4ab8] ${isActive(item.href) ? "bg-blue-50 text-[#0b4ab8]" : "text-slate-600"}`}>{item.label}</Link>)}</div>
          </details>
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/visit" className="tap-button rounded-full border border-[#0b4ab8] px-4 py-2 text-[0.76rem] font-extrabold text-[#0b4ab8] hover:bg-blue-50">Plan a Visit</Link>
          <Link href="/sermons" className="tap-button inline-flex items-center gap-1.5 rounded-full bg-[#0b4ab8] px-4 py-2 text-[0.76rem] font-extrabold text-white shadow-[0_8px_18px_rgba(11,74,184,0.18)] hover:bg-[#063887]"><Play className="h-3 w-3 fill-current" />Watch Sermon</Link>
        </div>
        <button className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-[#10213e] lg:hidden" onClick={() => setOpen(value => !value)} aria-label={open ? "Close navigation" : "Open navigation"}>{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
      </div>
      {open && (
        <div className="border-t border-slate-200 bg-[#f7f9fc] px-4 pb-5 pt-3 lg:hidden">
          <nav className="container grid gap-1" aria-label="Mobile navigation">
            {[...navigation, ...utilities].map(item => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={`rounded-xl px-3 py-3 text-sm font-bold ${isActive(item.href) ? "bg-blue-50 text-[#0b4ab8]" : "text-slate-700 hover:bg-white"}`}>{item.label}</Link>)}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link href="/visit" onClick={() => setOpen(false)} className="tap-button rounded-xl border border-[#0b4ab8] px-3 py-3 text-center text-xs font-extrabold text-[#0b4ab8]">Plan a Visit</Link>
              <Link href="/sermons" onClick={() => setOpen(false)} className="tap-button rounded-xl bg-[#0b4ab8] px-3 py-3 text-center text-xs font-extrabold text-white">Watch Sermon</Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
