import DashboardLayout from "@/components/DashboardLayout";
import { QueryError } from "@/components/PageBits";
import { trpc } from "@/lib/trpc";
import { HeartHandshake, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PrayerRequests() { return <DashboardLayout><PrayerRequestWorkspace /></DashboardLayout>; }

function PrayerRequestWorkspace() {
  const query = trpc.prayer.list.useQuery(); const utils = trpc.useUtils();
  const update = trpc.prayer.updateStatus.useMutation({ onSuccess: () => { void utils.prayer.list.invalidate(); toast.success("Prayer request status updated."); }, onError: error => toast.error(error.message) });
  if (query.isLoading) return <div className="grid min-h-[50vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[#0b4ab8]" /></div>;
  if (query.isError) return <div className="mx-auto max-w-3xl py-16"><QueryError label="Prayer requests could not be loaded." retry={() => void query.refetch()} /></div>;
  const requests = query.data ?? [];
  return <section className="mx-auto max-w-5xl py-5 sm:py-8"><p className="eyebrow text-[#0b4ab8]">Private ministry care</p><h1 className="display mt-3 text-5xl leading-none text-[#10213e]">Prayer requests</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">Requests are confidential. Update a request only after the prayer team has responded appropriately.</p><div className="mt-8 space-y-4">{requests.length ? requests.map(item => <article key={item.id} className="rounded-[1.4rem] border border-slate-200 bg-white p-6"><div className="flex flex-wrap items-start gap-4"><HeartHandshake className="h-5 w-5 text-[#0b4ab8]" /><div className="min-w-0 flex-1"><p className="font-extrabold text-[#10213e]">{item.name || "Anonymous request"}</p>{item.email && <p className="mt-1 text-sm text-slate-500">{item.email}{item.wantsFollowUp ? " · Follow-up requested" : ""}</p>}<p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700">{item.request}</p><p className="mt-4 text-xs font-bold text-slate-400">Received {new Date(item.createdAt).toLocaleString()}</p></div><select aria-label="Prayer request status" value={item.status} disabled={update.isPending} onChange={event => update.mutate({ id: item.id, status: event.target.value as "new" | "prayed" | "closed" })} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-extrabold text-[#10213e]"><option value="new">New</option><option value="prayed">Prayed</option><option value="closed">Closed</option></select></div></article>) : <div className="rounded-[1.4rem] border border-dashed border-slate-300 bg-white p-7"><p className="font-extrabold text-[#10213e]">No prayer requests yet.</p><p className="mt-2 text-sm leading-6 text-slate-500">New requests from the public homepage will appear here for authorised administrators.</p></div>}</div></section>;
}
