import { Mail, MapPin, Phone } from "lucide-react";
import { PageHero } from "@/components/PageBits";
import PublicLayout from "@/components/PublicLayout";
import { site } from "@/data/site";

export default function Contact() {
  return <PublicLayout><PageHero eyebrow="Contact TAP" title="Let’s start a conversation." copy="Whether you have a question about visiting, ministry life, or prayer, our parish team would be glad to help." /><section className="container grid gap-4 py-20 sm:grid-cols-2 lg:grid-cols-3 sm:py-28">{[{ icon: MapPin, title: "Visit", body: site.city, note: "Exact campus directions will be confirmed by the church office." }, { icon: Mail, title: "Email", body: "Contact information coming soon", note: "A verified parish email channel will appear here." }, { icon: Phone, title: "Call", body: "Contact information coming soon", note: "A verified parish phone channel will appear here." }].map(item => <article key={item.title} className="rounded-[1.4rem] border border-slate-200 bg-white p-7"><item.icon className="h-6 w-6 text-[#0b4ab8]" /><p className="mt-10 text-xs font-extrabold uppercase tracking-[0.14em] text-[#0b4ab8]">{item.title}</p><p className="mt-3 font-extrabold text-[#10213e]">{item.body}</p><p className="mt-3 text-sm leading-6 text-slate-600">{item.note}</p></article>)}</section></PublicLayout>;
}
