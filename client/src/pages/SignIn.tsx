import PublicLayout from "@/components/PublicLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { validateSignIn, validateSignInField, type SignInErrors, type SignInField } from "@/lib/signInValidation";
import { Loader2, ShieldCheck } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import { storeLocalSessionToken } from "@/lib/localSession";

export default function SignIn() {
  const [errors, setErrors] = useState<SignInErrors>({});
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const status = trpc.account.setupStatus.useQuery();
  const signIn = trpc.account.signIn.useMutation({ onSuccess: async result => { storeLocalSessionToken(result.sessionToken); await utils.auth.me.invalidate(); toast.success(`Welcome back, ${result.user.name}.`); setLocation("/admin"); } });
  useEffect(() => { if (user) setLocation("/admin"); }, [setLocation, user]);
  const updateError = (field: SignInField, value: string) => setErrors(current => { const error = validateSignInField(field, value); if (!error) { const { [field]: _removed, ...rest } = current; return rest; } return { ...current, [field]: error }; });
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const values = new FormData(event.currentTarget); const credentials = { email: String(values.get("email")).trim(), password: String(values.get("password")) }; const next = validateSignIn(credentials); setErrors(next); if (!Object.keys(next).length) signIn.mutate(credentials); };
  return <PublicLayout><section className="container grid min-h-[calc(100vh-12rem)] items-center py-14 sm:py-20"><div className="mx-auto w-full max-w-xl"><p className="eyebrow text-[#0b4ab8]">RCCG TAP administrator access</p><h1 className="display mt-4 text-5xl leading-[0.94] text-[#10213e]">Private admin workspace.</h1><p className="mt-5 max-w-lg text-sm leading-7 text-slate-600">Only approved administrators can sign in and manage the public church website. There are no member or worker accounts.</p><div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><form noValidate onSubmit={submit} className="grid gap-5"><div><ShieldCheck className="h-6 w-6 text-[#0b4ab8]" /><h2 className="mt-5 text-2xl font-extrabold text-[#10213e]">Administrator sign in</h2><p className="mt-2 text-sm leading-6 text-slate-600">Use the administrator email and password configured for RCCG TAP.</p></div><Field name="email" label="Email" type="email" required error={errors.email} onBlur={event => updateError("email", event.target.value)} /><Field name="password" label="Password" type="password" required error={errors.password} onBlur={event => updateError("password", event.target.value)} /><Button type="submit" disabled={signIn.isPending} aria-busy={signIn.isPending} className="h-11 rounded-xl bg-[#0b4ab8] font-extrabold">{signIn.isPending ? <><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Signing in…</> : "Sign in as administrator"}</Button>{signIn.error && <ErrorText text={signIn.error.message} />}</form></div>{status.data?.needsSetup && <p className="mt-6 text-center text-xs leading-5 text-slate-500">First administrator? <Link href="/master-setup" className="font-extrabold text-[#0b4ab8]">Complete the protected setup</Link>.</p>}</div></section></PublicLayout>;
}
function Field({ name, label, type = "text", error, ...props }: { name: string; label: string; type?: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) { const errorId = `${name}-error`; return <label className="grid gap-1.5"><Label htmlFor={name} className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-500">{label}</Label><Input id={name} name={name} type={type} autoComplete={type === "password" ? "current-password" : "email"} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} className={`h-11 rounded-xl ${error ? "border-rose-500" : ""}`} {...props} />{error && <span id={errorId} role="alert" className="text-xs font-semibold text-rose-700">{error}</span>}</label>; }
function ErrorText({ text }: { text: string }) { return <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{text}</p>; }
