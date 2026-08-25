import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { availabilityOptions, juniorCategoryOptions, ministryOptions, type AvailabilityOptionValue, type JuniorCategoryOptionValue, type MinistryOptionValue } from "@/lib/memberOptions";
import { validateSignIn, validateSignInField, type SignInErrors, type SignInField } from "@/lib/signInValidation";
import { Loader2, ShieldCheck, UserPlus, UsersRound } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import { storeLocalSessionToken } from "@/lib/localSession";

type Mode = "sign-in" | "member" | "staff";
type RegistrationPreferences = { ministryInterests: MinistryOptionValue[]; serviceAvailability: AvailabilityOptionValue | null; wantsParishUpdates: boolean; isGuardian: boolean; juniorAgeCategories: JuniorCategoryOptionValue[] };
const staffRoles = ["worker", "ministry_leader", "editor", "admin"] as const;
const emptyRegistrationPreferences: RegistrationPreferences = { ministryInterests: [], serviceAvailability: null, wantsParishUpdates: true, isGuardian: false, juniorAgeCategories: [] };

export default function SignIn() {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [signInErrors, setSignInErrors] = useState<SignInErrors>({});
  const [registrationPreferences, setRegistrationPreferences] = useState<RegistrationPreferences>(emptyRegistrationPreferences);
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const status = trpc.account.setupStatus.useQuery();
  const signIn = trpc.account.signIn.useMutation({
    onSuccess: async result => {
      storeLocalSessionToken(result.sessionToken);
      await utils.auth.me.invalidate();
      toast.success(`Welcome back, ${result.user.name}.`);
      setLocation(result.user.role === "member" ? "/member" : "/admin");
    },
  });
  const register = trpc.account.register.useMutation({
    onSuccess: result => {
      toast.success(result.message);
      setMode("sign-in");
    },
  });

  const updateSignInError = (field: SignInField, value: string) => {
    setSignInErrors(current => {
      const error = validateSignInField(field, value);
      if (!error && !current[field]) return current;
      if (!error) {
        const { [field]: _removed, ...rest } = current;
        return rest;
      }
      return { ...current, [field]: error };
    });
  };

  const submitSignIn = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const credentials = { email: String(values.get("email")).trim(), password: String(values.get("password")) };
    const errors = validateSignIn(credentials);
    setSignInErrors(errors);
    if (Object.keys(errors).length) return;
    signIn.mutate(credentials);
  };

  const submitRegister = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    register.mutate({
      name: String(values.get("name")),
      email: String(values.get("email")),
      password: String(values.get("password")),
      accountType: mode === "staff" ? "staff" : "member",
      requestedRole: mode === "staff" ? String(values.get("requestedRole")) as (typeof staffRoles)[number] : undefined,
      requestNote: mode === "staff" ? String(values.get("requestNote") || "") : undefined,
      onboarding: mode === "member" ? registrationPreferences : undefined,
    });
  };

  const selectMode = (nextMode: Mode) => {
    setMode(nextMode);
    setSignInErrors({});
  };
  const toggleRegistrationMinistry = (value: MinistryOptionValue) => setRegistrationPreferences(current => ({ ...current, ministryInterests: current.ministryInterests.includes(value) ? current.ministryInterests.filter(item => item !== value) : [...current.ministryInterests, value] }));
  const toggleRegistrationCategory = (value: JuniorCategoryOptionValue) => setRegistrationPreferences(current => ({ ...current, juniorAgeCategories: current.juniorAgeCategories.includes(value) ? current.juniorAgeCategories.filter(item => item !== value) : [...current.juniorAgeCategories, value] }));

  return (
    <PublicLayout>
      <section className="container grid min-h-[calc(100vh-12rem)] items-center py-14 sm:py-20">
        <div className="mx-auto w-full max-w-xl">
          <p className="eyebrow text-[#0b4ab8]">RCCG TAP access</p>
          <h1 className="display mt-4 text-5xl leading-[0.94] text-[#10213e]">Your place in the parish.</h1>
          <p className="mt-5 max-w-lg text-sm leading-7 text-slate-600">Members can create a personal account. Workers can request staff access; every request is reviewed by the Master Admin before access is granted.</p>

          <div className="mt-8 grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1.5">
            {(["sign-in", "member", "staff"] as Mode[]).map(item => (
              <button key={item} type="button" onClick={() => selectMode(item)} className={`tap-button rounded-xl px-3 py-2.5 text-xs font-extrabold ${mode === item ? "bg-white text-[#0b4ab8] shadow-sm" : "text-slate-500"}`}>
                {item === "sign-in" ? "Sign in" : item === "member" ? "Join as member" : "Request staff access"}
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            {mode === "sign-in" ? (
              <form noValidate onSubmit={submitSignIn} className="grid gap-5">
                <FormTitle icon={ShieldCheck} title="Sign in" copy="Use the email and password connected to your RCCG TAP account." />
                <Field name="email" label="Email" type="email" required error={signInErrors.email} onBlur={event => updateSignInError("email", event.target.value)} onChange={event => { if (signInErrors.email) updateSignInError("email", event.target.value); }} />
                <Field name="password" label="Password" type="password" required error={signInErrors.password} onBlur={event => updateSignInError("password", event.target.value)} onChange={event => { if (signInErrors.password) updateSignInError("password", event.target.value); }} />
                <Button type="submit" disabled={signIn.isPending} aria-busy={signIn.isPending} className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0b4ab8] font-extrabold">
                  {signIn.isPending ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /><span>Signing in…</span></> : "Sign in"}
                </Button>
                {signIn.error && <ErrorText text={signIn.error.message} />}
              </form>
            ) : (
              <form onSubmit={submitRegister} className="grid gap-5">
                <FormTitle icon={mode === "staff" ? UsersRound : UserPlus} title={mode === "staff" ? "Request staff access" : "Create a member account"} copy={mode === "staff" ? "Your request stays pending until the Master Admin approves your role." : "Create a limited member account for parish updates and future member features."} />
                <Field name="name" label="Full name" required />
                <Field name="email" label="Email" type="email" required />
                <Field name="password" label="Password" type="password" minLength={10} hint="Use at least 10 characters." required />
                {mode === "member" && <section className="rounded-2xl bg-blue-50 p-4"><p className="text-sm font-extrabold text-[#10213e]">Make your parish journey personal</p><p className="mt-1 text-xs leading-5 text-slate-600">Choose interests now; you can always update them later. Ministry interests do not grant staff access.</p><p className="mt-4 text-xs font-extrabold uppercase tracking-[0.1em] text-slate-500">Ministry interests</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{ministryOptions.map(option => <button key={option.value} type="button" onClick={() => toggleRegistrationMinistry(option.value)} className={`rounded-xl border px-3 py-2.5 text-left text-xs font-bold ${registrationPreferences.ministryInterests.includes(option.value) ? "border-[#0b4ab8] bg-white text-[#0b4ab8]" : "border-blue-100 text-slate-600"}`}>{registrationPreferences.ministryInterests.includes(option.value) ? "✓ " : ""}{option.label}</button>)}</div><label className="mt-4 grid gap-1.5 text-xs font-extrabold uppercase tracking-[0.1em] text-slate-500">Availability<select value={registrationPreferences.serviceAvailability ?? ""} onChange={event => setRegistrationPreferences(current => ({ ...current, serviceAvailability: (event.target.value || null) as AvailabilityOptionValue | null }))} className="h-10 rounded-xl border border-blue-100 bg-white px-3 text-sm font-medium normal-case tracking-normal text-[#10213e]"><option value="">Choose later</option>{availabilityOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><label className="mt-4 flex items-start gap-3 text-sm leading-6 text-slate-700"><input type="checkbox" checked={registrationPreferences.isGuardian} onChange={event => setRegistrationPreferences(current => ({ ...current, isGuardian: event.target.checked, juniorAgeCategories: event.target.checked ? current.juniorAgeCategories : [] }))} className="mt-1 h-4 w-4 accent-[#0b4ab8]" /><span><strong className="block">I am a parent or guardian</strong>Select Junior Church categories for family resources. No child account is created.</span></label>{registrationPreferences.isGuardian && <div className="mt-3 grid gap-2 sm:grid-cols-2">{juniorCategoryOptions.map(option => <button key={option.value} type="button" onClick={() => toggleRegistrationCategory(option.value)} className={`rounded-xl border px-3 py-2.5 text-left text-xs font-bold ${registrationPreferences.juniorAgeCategories.includes(option.value) ? "border-[#7c1eff] bg-white text-[#7c1eff]" : "border-violet-100 text-slate-600"}`}>{registrationPreferences.juniorAgeCategories.includes(option.value) ? "✓ " : ""}{option.label}</button>)}</div>}</section>}
                {mode === "staff" && <>
                  <label className="grid gap-1.5 text-xs font-extrabold uppercase tracking-[0.1em] text-slate-500">Requested role
                    <select name="requestedRole" className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium normal-case tracking-normal text-[#10213e]">
                      <option value="worker">Worker</option><option value="ministry_leader">Ministry Leader</option><option value="editor">Editor</option><option value="admin">Admin</option>
                    </select>
                  </label>
                  <label className="grid gap-1.5 text-xs font-extrabold uppercase tracking-[0.1em] text-slate-500">Note for the Master Admin
                    <textarea name="requestNote" className="min-h-24 rounded-xl border border-slate-200 p-3 text-sm font-medium normal-case tracking-normal text-[#10213e]" placeholder="Tell us how you serve at RCCG TAP." />
                  </label>
                </>}
                <Button type="submit" disabled={register.isPending} className="mt-1 h-11 rounded-xl bg-[#0b4ab8] font-extrabold">{register.isPending ? "Submitting…" : mode === "staff" ? "Send access request" : "Create member account"}</Button>
                {register.error && <ErrorText text={register.error.message} />}
              </form>
            )}
          </div>
          {status.data?.needsSetup && <p className="mt-6 text-center text-xs leading-5 text-slate-500">Initial Master Admin? <Link href="/master-setup" className="font-extrabold text-[#0b4ab8]">Set up the first protected account</Link>.</p>}
        </div>
      </section>
    </PublicLayout>
  );
}

function FormTitle({ icon: Icon, title, copy }: { icon: typeof ShieldCheck; title: string; copy: string }) {
  return <div><Icon className="h-6 w-6 text-[#0b4ab8]" /><h2 className="mt-5 text-2xl font-extrabold text-[#10213e]">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p></div>;
}

function Field({ name, label, type = "text", hint, error, ...props }: { name: string; label: string; type?: string; hint?: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const errorId = `${name}-error`;
  const hintId = hint ? `${name}-hint` : undefined;
  const describedBy = [hintId, error ? errorId : undefined].filter(Boolean).join(" ") || undefined;
  return <label className="grid gap-1.5"><Label htmlFor={name} className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-500">{label}</Label><Input id={name} name={name} type={type} aria-invalid={Boolean(error)} aria-describedby={describedBy} className={`h-11 rounded-xl ${error ? "border-rose-500 focus-visible:ring-rose-500" : ""}`} {...props} />{hint && <span id={hintId} className="text-xs text-slate-500">{hint}</span>}{error && <span id={errorId} role="alert" className="text-xs font-semibold text-rose-700">{error}</span>}</label>;
}

function ErrorText({ text }: { text: string }) {
  return <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{text}</p>;
}
