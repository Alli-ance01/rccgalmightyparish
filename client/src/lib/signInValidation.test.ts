import { describe, expect, it } from "vitest";
import { validateSignIn, validateSignInField } from "./signInValidation";

describe("sign-in validation", () => {
  it("reports clear inline errors for missing or malformed credentials", () => {
    expect(validateSignIn({ email: "not-an-email", password: "" })).toEqual({
      email: "Enter a valid email address.",
      password: "Enter your password.",
    });
  });

  it("accepts complete email and password credentials", () => {
    expect(validateSignIn({ email: "member@example.com", password: "a secure password" })).toEqual({});
    expect(validateSignInField("email", "member@example.com")).toBeUndefined();
  });
});
