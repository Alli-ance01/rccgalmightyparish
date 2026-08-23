import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ShieldCheck, UserCog } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const roles = ["worker", "ministry_leader", "editor", "admin"] as const;
type StaffRole = (typeof roles)[number];
type ManagedStaffAccount = { id: string; name: string; email: string; role: string; accountStatus: string; approvalNote: string | null };

export default function Approvals() {
  return <DashboardLayout><ApprovalWorkspace /></DashboardLayout>;
}

function ApprovalWorkspace() {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();
  const requests = trpc.account.requests.list.useQuery(undefined, { enabled: user?.role === "master_admin" });
  const managed = trpc.account.requests.managed.useQuery(undefined, { enabled: user?.role === "master_admin" });
  const refresh = () => { void requests.refetch(); void managed.refetch(); void utils.auth.me.invalidate(); };
  const decide = trpc.account.requests.decide.useMutation({ onSuccess: () => { refresh(); toast.success("Access request updated."); }, onError: error => toast.error(error.message) });
  const changeRole = trpc.account.requests.changeRole.useMutation({ onSuccess: () => { refresh(); toast.success("Staff role updated."); }, onError: error => toast.error(error.message) });
  const suspend = trpc.account.requests.suspend.useMutation({ onSuccess: () => { refresh(); toast.success("Staff access suspended."); }, onError: error => toast.error(error.message) });
  const reactivate = trpc.account.requests.reactivate.useMutation({ onSuccess: () => { refresh(); toast.success("Staff access restored."); }, onError: error => toast.error(error.message) });

  if (loading) return null;
  if (user?.role !== "master_admin") return <section className="mx-auto max-w-2xl py-16"><p className="eyebrow text-[#0b4ab8]">TAP access control</p><h1 className="display mt-4 text-5xl text-[#10213e]">Master Admin only.</h1><p className="mt-5 text-sm leading-7 text-slate-600">Only the Master Admin can review and manage staff access.</p></section>;

  const accounts = managed.data ?? [];
  const active = accounts.filter(account => account.accountStatus === "active");
  const rejected = accounts.filter(account => account.accountStatus === "rejected");
  const suspended = accounts.filter(account => account.accountStatus === "suspended");
  const isMutating = changeRole.isPending || suspend.isPending || reactivate.isPending;
  const renderCard = (account: ManagedStaffAccount) => <ManagedStaffCard key={account.id} account={account} pending={isMutating} onRole={role => changeRole.mutate({ id: account.id, role })} onSuspend={() => suspend.mutate({ id: account.id })} onReactivate={() => reactivate.mutate({ id: account.id })} />;

  return <section className="mx-auto max-w-5xl py-6"><p className="eyebrow text-[#0b4ab8]">Master Admin</p><h1 className="display mt-4 text-5xl text-[#10213e]">Staff access control</h1><p className="mt-4 text-sm leading-7 text-slate-600">Review incoming requests, assign roles, suspend access, and restore approved workers when appropriate.</p>
    <section className="mt-10"><p className="eyebrow text-[#0b4ab8]">Pending requests</p><div className="mt-4 grid gap-4">{requests.isLoading ? <LoadingCard /> : !requests.data?.length ? <Empty label="There are no pending staff access requests." /> : requests.data.map(request => <RequestCard key={request.id} request={request} pending={decide.isPending} onDecide={(decision, role, note) => decide.mutate({ id: request.id, decision, role, note })} />)}</div></section>
    {managed.isLoading ? <section className="mt-12"><LoadingCard /></section> : <><StaffStatusSection title="Active staff" description="Approved staff members who can access their assigned TAP workspace." empty="No active staff accounts are currently available." accounts={active}>{renderCard}</StaffStatusSection><StaffStatusSection title="Rejected requests" description="Requests that were not approved. These accounts cannot access staff tools." empty="No staff access requests have been rejected." accounts={rejected}>{renderCard}</StaffStatusSection><StaffStatusSection title="Suspended staff" description="Previously approved accounts with staff access currently paused." empty="No staff accounts are currently suspended." accounts={suspended}>{renderCard}</StaffStatusSection></>}
  </section>;
}

function StaffStatusSection({ title, description, empty, accounts, children }: { title: string; description: string; empty: string; accounts: ManagedStaffAccount[]; children: (account: ManagedStaffAccount) => React.ReactNode }) {
  return <section className="mt-12"><div className="flex flex-wrap items-baseline justify-between gap-2"><p className="eyebrow text-[#0b4ab8]">{title}</p><p className="text-xs font-semibold text-slate-500">{accounts.length} {accounts.length === 1 ? "account" : "accounts"}</p></div><p className="mt-2 text-sm text-slate-600">{description}</p><div className="mt-4 grid gap-4">{accounts.length ? accounts.map(children) : <Empty label={empty} />}</div></section>;
}

function Empty({ label }: { label: string }) { return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-7 text-sm text-slate-600">{label}</div>; }
function LoadingCard() { return <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />; }
function RequestCard({ request, pending, onDecide }: { request: { id: string; name: string; email: string; requestedRole: string | null; requestNote: string | null }; pending: boolean; onDecide: (decision: "approve" | "reject", role?: StaffRole, note?: string) => void }) { const [role, setRole] = useState<StaffRole>((request.requestedRole as StaffRole) ?? "worker"); const [note, setNote] = useState(""); return <article className="rounded-[1.4rem] border border-slate-200 bg-white p-6"><div className="flex gap-4"><ShieldCheck className="h-6 w-6 text-[#0b4ab8]" /><div><h2 className="font-extrabold text-[#10213e]">{request.name}</h2><p className="mt-1 text-sm text-slate-500">{request.email} · requested {request.requestedRole?.replaceAll("_", " ")}</p>{request.requestNote && <p className="mt-4 text-sm leading-6 text-slate-600">“{request.requestNote}”</p>}</div></div><div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1.5fr_auto_auto]"><RoleSelect value={role} onChange={setRole} /><input value={note} onChange={event => setNote(event.target.value)} placeholder="Optional decision note" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" /><Button disabled={pending} onClick={() => onDecide("approve", role, note)} className="h-10 rounded-xl bg-[#0b4ab8] text-xs font-extrabold">Approve</Button><Button disabled={pending} variant="outline" onClick={() => onDecide("reject", undefined, note)} className="h-10 rounded-xl border-rose-200 text-xs font-extrabold text-rose-700">Reject</Button></div></article>; }
function ManagedStaffCard({ account, pending, onRole, onSuspend, onReactivate }: { account: ManagedStaffAccount; pending: boolean; onRole: (role: StaffRole) => void; onSuspend: () => void; onReactivate: () => void }) { const [role, setRole] = useState<StaffRole>(account.role as StaffRole); const suspended = account.accountStatus === "suspended"; const rejected = account.accountStatus === "rejected"; return <article className="rounded-[1.4rem] border border-slate-200 bg-white p-6"><div className="flex gap-4"><UserCog className="h-6 w-6 text-[#0b4ab8]" /><div className="min-w-0"><h2 className="font-extrabold text-[#10213e]">{account.name}</h2><p className="mt-1 text-sm text-slate-500">{account.email}</p>{account.approvalNote && <p className="mt-3 text-sm text-slate-600">{account.approvalNote}</p>}</div><span className={`ml-auto h-fit rounded-full px-2.5 py-1 text-[0.65rem] font-extrabold ${suspended || rejected ? "bg-rose-50 text-rose-700" : "bg-lime-50 text-lime-700"}`}>{account.accountStatus}</span></div>{rejected ? <p className="mt-5 text-sm leading-6 text-slate-600">This request was not approved. The requester can submit a new staff application if circumstances change.</p> : <div className="mt-5 flex flex-wrap gap-3"><RoleSelect value={role} onChange={setRole} /><Button disabled={pending || suspended} variant="outline" onClick={() => onRole(role)} className="h-10 rounded-xl text-xs font-extrabold">Save role</Button>{suspended ? <Button disabled={pending} onClick={onReactivate} className="h-10 rounded-xl bg-[#0b4ab8] text-xs font-extrabold">Restore access</Button> : <Button disabled={pending} variant="outline" onClick={onSuspend} className="h-10 rounded-xl border-rose-200 text-xs font-extrabold text-rose-700">Suspend access</Button>}</div>}</article>; }
function RoleSelect({ value, onChange }: { value: StaffRole; onChange: (role: StaffRole) => void }) { return <select value={value} onChange={event => onChange(event.target.value as StaffRole)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm"><option value="worker">Worker</option><option value="ministry_leader">Ministry Leader</option><option value="editor">Editor</option><option value="admin">Admin</option></select>; }
