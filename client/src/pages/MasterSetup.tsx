import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { FormEvent } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { storeLocalSessionToken } from "@/lib/localSession";

export default function MasterSetup() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { data: status } = trpc.account.setupStatus.useQuery();
  const setup = trpc.account.setupAdmin.useMutation({
    onSuccess: async result => {
      storeLocalSessionToken(result.sessionToken);
      await utils.auth.me.invalidate();
      toast.success(status?.needsSetup ? "Administrator account created." : "Administrator access repaired.");
      setLocation("/admin");
    },
  });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setup.mutate({ name: String(form.get("name")), email: String(form.get("email")), password: String(form.get("password")), setupToken: String(form.get("setupToken")) });
  };
  const recovery = status && !status.needsSetup;
  return <PublicLayout><section className="container py-20 sm:py-28"><div className="mx-auto max-w-xl rounded-[1.5rem] border border-slate-200 bg-white p-7 sm:p-9"><p className="eyebrow text-[#0b4ab8]">Protected administrator access</p><h1 className="display mt-4 text-5xl leading-[0.95] text-[#10213e]">{recovery ? "Repair administrator access." : "Create the administrator."}</h1><form onSubmit={submit} className="mt-7 grid gap-5"><p className="text-sm leading-6 text-slate-600">{recovery ? "An administrator already exists. Use the configured setup token to normalize the account, remove legacy records, and set a new password." : "This one-time setup is restricted to"} {!recovery && <strong>{status?.adminEmail ?? "the configured administrator email"}</strong>} Enter the private setup token stored in Render; never share it publicly.</p><Input name="name" placeholder="Full name" required className="h-11 rounded-xl" /><Input name="email" type="email" placeholder="Administrator email" required className="h-11 rounded-xl" /><Input name="password" type="password" autoComplete="new-password" minLength={10} placeholder={recovery ? "Set a new strong password" : "Create a strong password"} required className="h-11 rounded-xl" /><Input name="setupToken" type="password" autoComplete="off" placeholder="Private setup token" required className="h-11 rounded-xl" /><Button type="submit" disabled={setup.isPending} className="h-11 rounded-xl bg-[#0b4ab8] font-extrabold">{setup.isPending ? "Working…" : recovery ? "Repair administrator access" : "Create administrator"}</Button>{setup.error && <p role="alert" className="text-sm font-semibold text-rose-700">{setup.error.message}</p>}</form></div></section></PublicLayout>;
}
