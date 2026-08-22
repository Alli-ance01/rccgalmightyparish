import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";

export default function Account() {
  const { user, loading, logout } = useAuth();
  if (loading) return <PublicLayout><div className="container py-24 text-sm font-bold text-slate-500">Loading account…</div></PublicLayout>;
  if (!user) return <PublicLayout><section className="container py-24"><h1 className="display text-5xl text-[#10213e]">Account access</h1><p className="mt-5 text-slate-600">Sign in or create a member account to continue.</p><Link href="/sign-in" className="tap-button mt-7 inline-flex rounded-full bg-[#0b4ab8] px-5 py-3 text-sm font-extrabold text-white">Sign in</Link></section></PublicLayout>;
  const staff = user.role !== "member";
  return <PublicLayout><section className="container py-20 sm:py-28"><p className="eyebrow text-[#0b4ab8]">TAP account</p><h1 className="display mt-4 text-5xl text-[#10213e]">Welcome, {user.name}.</h1><div className="mt-8 max-w-2xl rounded-[1.5rem] border border-slate-200 bg-white p-7"><p className="text-sm font-extrabold text-[#10213e]">Your account is active.</p><p className="mt-3 text-sm leading-7 text-slate-600">You are registered as a {user.role.replaceAll("_", " ")}. {staff ? "Your approved staff workspace is available below." : "Member-only features will be added here over time."}</p>{staff && <Link href="/admin" className="tap-button mt-6 inline-flex rounded-full bg-[#0b4ab8] px-5 py-3 text-sm font-extrabold text-white">Open staff workspace</Link>}<Button variant="outline" onClick={() => void logout()} className="mt-6 block rounded-full">Sign out</Button></div></section></PublicLayout>;
}
