import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { FormEvent } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { storeLocalSessionToken } from "@/lib/localSession";

export default function MasterSetup() {
  const [, setLocation] = useLocation(); const utils = trpc.useUtils();
  const status = trpc.account.setupStatus.useQuery();
  const setup = trpc.account.setupMasterAdmin.useMutation({ onSuccess: async result => { storeLocalSessionToken(result.sessionToken); await utils.auth.me.invalidate(); toast.success("Master Admin account created."); setLocation("/admin/approvals"); } });
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); setup.mutate({ name: String(form.get("name")), email: String(form.get("email")), password: String(form.get("password")), setupToken: String(form.get("setupToken")) }); };
  return <PublicLayout><section className="container py-20 sm:py-28"><div className="mx-auto max-w-xl rounded-[1.5rem] border border-slate-200 bg-white p-7 sm:p-9"><p className="eyebrow text-[#0b4ab8]">Protected setup</p><h1 className="display mt-4 text-5xl leading-[0.95] text-[#10213e]">Create the Master Admin.</h1>{status.data && !status.data.needsSetup ? <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">The Master Admin account has already been created. Sign in instead.</p> : <form onSubmit={submit} className="mt-7 grid gap-5"><p className="text-sm leading-6 text-slate-600">This one-time setup is restricted to <strong>{status.data?.masterEmail ?? "the configured Master Admin email"}</strong>. Enter the private setup token stored in Render; never share it publicly.</p><Input name="name" placeholder="Full name" required className="h-11 rounded-xl" /><Input name="email" type="email" placeholder="Master Admin email" required className="h-11 rounded-xl" /><Input name="password" type="password" minLength={10} placeholder="Create a strong password" required className="h-11 rounded-xl" /><Input name="setupToken" type="password" placeholder="Private setup token" required className="h-11 rounded-xl" /><Button type="submit" disabled={setup.isPending} className="h-11 rounded-xl bg-[#0b4ab8] font-extrabold">{setup.isPending ? "Creating…" : "Create Master Admin"}</Button>{setup.error && <p role="alert" className="text-sm font-semibold text-rose-700">{setup.error.message}</p>}</form>}</div></section></PublicLayout>;
}
