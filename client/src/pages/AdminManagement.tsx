import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { FormEvent } from "react";
import { toast } from "sonner";

export default function AdminManagement() {
  const utils = trpc.useUtils();
  const admins = trpc.account.admins.list.useQuery();
  const create = trpc.account.admins.create.useMutation({
    onSuccess: async () => {
      await utils.account.admins.list.invalidate();
      toast.success("Administrator added.");
    },
  });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    create.mutate({ name: String(form.get("name")), email: String(form.get("email")), password: String(form.get("password")) }, { onSuccess: () => event.currentTarget.reset() });
  };
  return <div className="mt-8 grid gap-7 lg:grid-cols-[1fr_0.8fr]">
    <section className="rounded-[1.4rem] border border-slate-200 bg-white p-6 sm:p-7">
      <p className="eyebrow text-[#0b4ab8]">Authorized access</p>
      <h2 className="display mt-3 text-4xl leading-none text-[#10213e]">Administrators</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">These accounts can sign in and manage the public church website.</p>
      <div className="mt-6 space-y-3">{admins.isLoading ? <div className="h-20 animate-pulse rounded-xl bg-slate-100" /> : admins.data?.map(admin => <div key={admin.id} className="rounded-xl border border-slate-200 p-4"><p className="font-extrabold text-[#10213e]">{admin.name}</p><p className="mt-1 text-sm text-slate-500">{admin.email}</p><p className="mt-2 text-xs font-bold uppercase tracking-[0.1em] text-emerald-700">Active administrator</p></div>)}</div>
    </section>
    <section className="rounded-[1.4rem] border border-slate-200 bg-white p-6 sm:p-7">
      <p className="font-extrabold text-[#10213e]">Add an administrator</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">Give the new administrator their email and temporary password securely.</p>
      <form onSubmit={submit} className="mt-6 grid gap-4"><Input name="name" placeholder="Full name" required className="h-11 rounded-xl" /><Input name="email" type="email" placeholder="Email address" required className="h-11 rounded-xl" /><Input name="password" type="password" autoComplete="new-password" minLength={10} placeholder="Temporary password (10+ characters)" required className="h-11 rounded-xl" /><Button type="submit" disabled={create.isPending} className="h-11 rounded-xl bg-[#0b4ab8] font-extrabold">{create.isPending ? "Adding…" : "Add administrator"}</Button>{create.error && <p role="alert" className="text-sm font-semibold text-rose-700">{create.error.message}</p>}</form>
    </section>
  </div>;
}
