export type SignInField = "email" | "password";
export type SignInValues = Record<SignInField, string>;
export type SignInErrors = Partial<Record<SignInField, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSignInField(field: SignInField, value: string): string | undefined {
  const normalized = value.trim();
  if (!normalized) return field === "email" ? "Enter your email address." : "Enter your password.";
  if (field === "email" && !emailPattern.test(normalized)) return "Enter a valid email address.";
  return undefined;
}

export function validateSignIn(values: SignInValues): SignInErrors {
  return (Object.keys(values) as SignInField[]).reduce<SignInErrors>((errors, field) => {
    const error = validateSignInField(field, values[field]);
    if (error) errors[field] = error;
    return errors;
  }, {});
}
