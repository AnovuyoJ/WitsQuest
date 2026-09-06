import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { signIn, signUp } from "../lib/authService";
import { supabase } from "../lib/supabaseClient";

describe("authentication service", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("signs up a user with valid input", async () => {
    const supabaseResponse = {
      data: {
        user: { id: "user-123", email: "student@wits.ac.za" },
        session: null,
      },
      error: null,
    };
    const signUpSpy = jest
      .spyOn(supabase.auth, "signUp")
      .mockResolvedValue(supabaseResponse as never);

    const result = await signUp(
      "student@wits.ac.za",
      "valid-password",
      "Wits Student",
    );

    expect(signUpSpy).toHaveBeenCalledWith({
      email: "student@wits.ac.za",
      password: "valid-password",
      options: { data: { full_name: "Wits Student" } },
    });
    expect(result).toBe(supabaseResponse);
    expect(result.error).toBeNull();
  });

  it("returns the Supabase error when sign-up uses a duplicate email", async () => {
    const duplicateEmailError = {
      name: "AuthApiError",
      message: "User already registered",
      status: 422,
    };
    const supabaseResponse = {
      data: { user: null, session: null },
      error: duplicateEmailError,
    };
    const signUpSpy = jest
      .spyOn(supabase.auth, "signUp")
      .mockResolvedValue(supabaseResponse as never);

    const result = await signUp(
      "existing@wits.ac.za",
      "valid-password",
      "Existing Student",
    );

    expect(signUpSpy).toHaveBeenCalledWith({
      email: "existing@wits.ac.za",
      password: "valid-password",
      options: { data: { full_name: "Existing Student" } },
    });
    expect(result.error).toBe(duplicateEmailError);
    expect(result.error?.message).toBe("User already registered");
  });

  it("returns the correct error when sign-in credentials are incorrect", async () => {
    const invalidCredentialsError = {
      name: "AuthApiError",
      message: "Invalid login credentials",
      status: 400,
    };
    const supabaseResponse = {
      data: { user: null, session: null },
      error: invalidCredentialsError,
    };
    const signInSpy = jest
      .spyOn(supabase.auth, "signInWithPassword")
      .mockResolvedValue(supabaseResponse as never);

    const result = await signIn("student@wits.ac.za", "wrong-password");

    expect(signInSpy).toHaveBeenCalledWith({
      email: "student@wits.ac.za",
      password: "wrong-password",
    });
    expect(result.error).toBe(invalidCredentialsError);
    expect(result.error?.message).toBe("Invalid login credentials");
  });
});
