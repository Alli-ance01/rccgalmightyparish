import { ArrowUpRight, Instagram, MapPin, Youtube } from "lucide-react";
import { Link } from "wouter";
import { site } from "@/data/site";
import { TapMark } from "./SiteHeader";

const footerLinks = [
  { label: "About TAP", href: "/about" },
  { label: "Visit us", href: "/visit" },
  { label: "Contact", href: "/contact" },
  { label: "Give", href: "/give" },
  { label: "Administration", href: "/admin" },
];

export default function SiteFooter() {
  return (
    <footer className="mt-20 overflow-hidden bg-[#081f50] text-white">
      <div className="container grid gap-12 py-14 md:grid-cols-[1.4fr_0.8fr_0.8fr] md:py-20">
        <div>
          <TapMark inverse />
          <p className="mt-7 max-w-sm text-sm leading-7 text-blue-100">A parish family of The Redeemed Christian Church of God, gathering in faith and serving our city from Ibadan, Nigeria.</p>
          <Link href="/visit" className="mt-7 inline-flex items-center gap-2 border-b border-[#d7ff54] pb-1 text-sm font-extrabold text-[#d7ff54]">Plan your visit <ArrowUpRight className="h-4 w-4" /></Link>
        </div>
        <div>
          <p className="eyebrow text-[#d7ff54]">Explore</p>
          <div className="mt-5 grid gap-3">{footerLinks.map(item => <Link key={item.href} href={item.href} className="text-sm font-bold text-blue-50 transition-colors hover:text-[#d7ff54]">{item.label}</Link>)}</div>
        </div>
        <div>
          <p className="eyebrow text-[#d7ff54]">Find TAP</p>
          <p className="mt-5 flex items-start gap-2 text-sm leading-6 text-blue-50"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#d7ff54]" />{site.city}</p>
          <p className="mt-3 text-sm leading-6 text-blue-200">Specific campus directions and contact channels will be shared by the church office.</p>
          <div className="mt-6 flex gap-3"><a href="#" aria-label="TAP Church on YouTube" className="grid h-9 w-9 place-items-center rounded-full border border-white/20 text-white hover:bg-white hover:text-[#081f50]"><Youtube className="h-4 w-4" /></a><a href="#" aria-label="TAP Church on Instagram" className="grid h-9 w-9 place-items-center rounded-full border border-white/20 text-white hover:bg-white hover:text-[#081f50]"><Instagram className="h-4 w-4" /></a></div>
        </div>
      </div>
      <div className="border-t border-white/10"><div className="container flex flex-col justify-between gap-2 py-5 text-[0.68rem] font-bold tracking-wide text-blue-300 sm:flex-row"><span>© {new Date().getFullYear()} {site.name}</span><span>Built as a digital home for Ibadan.</span></div></div>
    </footer>
  );
}
