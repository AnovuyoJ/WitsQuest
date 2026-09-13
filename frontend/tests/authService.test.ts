import { afterEach, describe, expect, it, jest } from "@jest/globals";
import {
  sendPasswordReset,
  signIn,
  signInWithGithub,
  signInWithGoogle,
  signOut,
  signUp,
  updatePassword,
} from "../lib/authService";
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

  it("initiates Google OAuth sign-in with correct redirect URL", async () => {
    const supabaseResponse = {
      data: { provider: "google", url: "https://accounts.google.com" },
      error: null,
    };
    const googleSpy = jest
      .spyOn(supabase.auth, "signInWithOAuth")
      .mockResolvedValue(supabaseResponse as never);

    const result = await signInWithGoogle();

    expect(googleSpy).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    expect(result).toEqual(supabaseResponse);
  });

  it("initiates GitHub OAuth sign-in with correct redirect URL", async () => {
    const supabaseResponse = {
      data: { provider: "github", url: "https://github.com/login" },
      error: null,
    };
    const githubSpy = jest
      .spyOn(supabase.auth, "signInWithOAuth")
      .mockResolvedValue(supabaseResponse as never);

    const result = await signInWithGithub();

    expect(githubSpy).toHaveBeenCalledWith({
      provider: "github",
      options: {
        redirectTo: window.location.origin,
      },
    });
    expect(result).toEqual(supabaseResponse);
  });

  it("sends a password reset email with the correct reset route", async () => {
    const supabaseResponse = { data: {}, error: null };
    const resetSpy = jest
      .spyOn(supabase.auth, "resetPasswordForEmail")
      .mockResolvedValue(supabaseResponse as never);

    const result = await sendPasswordReset("student@wits.ac.za");

    expect(resetSpy).toHaveBeenCalledWith("student@wits.ac.za", {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    expect(result).toEqual(supabaseResponse);
  });

  it("updates the authenticated user password", async () => {
    const supabaseResponse = {
      data: { user: { id: "user-123" } },
      error: null,
    };
    const updateSpy = jest
      .spyOn(supabase.auth, "updateUser")
      .mockResolvedValue(supabaseResponse as never);

    const result = await updatePassword("new-secure-password");

    expect(updateSpy).toHaveBeenCalledWith({
      password: "new-secure-password",
    });
    expect(result).toEqual(supabaseResponse);
  });

  it("signs out the active user session", async () => {
    const supabaseResponse = { error: null };
    const signOutSpy = jest
      .spyOn(supabase.auth, "signOut")
      .mockResolvedValue(supabaseResponse as never);

    const result = await signOut();

    expect(signOutSpy).toHaveBeenCalled();
    expect(result).toBe(supabaseResponse);
  });
});