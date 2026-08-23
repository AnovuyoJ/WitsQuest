"use client";

import { useState, FormEvent } from "react";
// 1. Importing OAuth and password reset functions alongside signIn
import {
  signIn,
  signInWithGithub,
  signInWithGoogle,
  sendPasswordReset,
} from "@/lib/authService";

type FormErrors = {
  email?: string;
  password?: string;
};

const WITS_BLUE = "#043673";
const WITS_GOLD = "#C9A24B";

export default function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. Social sign-in handlers for Google & GitHub
  async function handleGoogleSignIn() {
    setServerError(null);
    setResetSuccess(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setServerError("Couldn't connect with Google right now. Please try again!");
    }
  }

  async function handleGithubSignIn() {
    setServerError(null);
    setResetSuccess(null);
    const { error } = await signInWithGithub();
    if (error) {
      setServerError("Couldn't connect with GitHub right now. Please try again!");
    }
  }

  // 3. Handles triggering password reset email directly without needing a separate page
  async function handleForgotPassword() {
    setServerError(null);
    setResetSuccess(null);

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailPattern.test(email)) {
      setErrors({ email: "Please enter your email above so we know where to send the reset link." });
      return;
    }

    setIsSubmitting(true);
    const { error } = await sendPasswordReset(email);
    setIsSubmitting(false);

    if (error) {
      setServerError("Couldn't send the password reset email. Please double-check your address.");
    } else {
      setResetSuccess("Password reset link sent! Check your inbox to pick a new password.");
    }
  }

  function validate(): boolean {
    const nextErrors: FormErrors = {};

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!password) {
      nextErrors.password = "Enter your password.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError(null);
    setResetSuccess(null);

    if (!validate()) return;

    setIsSubmitting(true);
    const { error } = await signIn(email, password);
    setIsSubmitting(false);

    if (error) {
      if (error.message.toLowerCase().includes("invalid login credentials")) {
        setServerError("Incorrect email or password.");
      } else {
        setServerError(error.message);
      }
      return;
    }

    // Sign-in succeeded — redirect to campus dashboard
    window.location.href = "/dashboard";
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-[0_2px_40px_-8px_rgba(4,54,115,0.25)]"
    >
      {/* Gold-to-blue accent bar */}
      <div
        style={{ background: `linear-gradient(90deg, ${WITS_BLUE}, ${WITS_GOLD})` }}
        className="h-1.5 w-full"
      />

      <div className="px-9 pb-9 pt-8">
        <div className="mb-7 flex flex-col items-center text-center">
          <Monogram />
          <h1 className="mt-4 font-serif text-[26px] leading-tight text-[#0A1F3D]">
            Welcome back
          </h1>
          <p className="mt-1.5 text-[13px] text-gray-500">Sign in to continue your quest</p>
        </div>

        {/* Server error feedback banner */}
        {serverError && (
          <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        {/* Success feedback banner when password reset email is sent */}
        {resetSuccess && (
          <div className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {resetSuccess}
          </div>
        )}

        {/* 4. Connected click triggers to the social login buttons */}
        <div className="mb-4 flex flex-col gap-2.5">
          <OAuthButton
            label="Continue with Google"
            icon={<GoogleIcon />}
            onClick={handleGoogleSignIn}
          />
          <OAuthButton
            label="Continue with GitHub"
            icon={<GitHubIcon />}
            onClick={handleGithubSignIn}
          />
        </div>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
            or sign in with email
          </span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <Field
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="name@gmail.com"
          error={errors.email}
        />

        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="password" className="block text-[13px] font-medium text-gray-600">
            Password
          </label>
          {/* 5. Triggering in-line password reset instead of dead link */}
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-[12px] font-medium hover:underline"
            style={{ color: WITS_BLUE }}
          >
            Forgot password?
          </button>
        </div>

        <div className="mb-6">
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-2.5 text-sm text-[#0A1F3D] outline-none transition-colors focus:border-[#043673] focus:bg-white"
          />
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{ background: WITS_BLUE }}
          className="mt-1 w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>

        <p className="mt-5 text-center text-sm text-gray-500">
          No account?{" "}
          <a href="/signup" className="font-medium" style={{ color: WITS_BLUE }}>
            Sign up
          </a>
        </p>
      </div>
    </form>
  );
}

// --- Monogram badge ---
function Monogram() {
  return (
    <div
      className="flex h-14 w-14 items-center justify-center rounded-2xl"
      style={{
        background: `linear-gradient(155deg, ${WITS_BLUE} 0%, #0A1F3D 100%)`,
        boxShadow: `0 0 0 3px ${WITS_GOLD}33`,
      }}
    >
      <span className="font-serif text-lg tracking-wide" style={{ color: WITS_GOLD }}>
        WQ
      </span>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  error?: string;
  type?: string;
}) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-gray-600">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-2.5 text-sm text-[#0A1F3D] outline-none transition-colors focus:border-[#043673] focus:bg-white"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

// 6. Updated OAuthButton to handle clicks
function OAuthButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
    >
      {icon}
      {label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6 29.5 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.4 0 10.3-1.8 14-5.1l-6.5-5.4C29.4 35.1 26.8 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.5l6.5 5.4C40.9 36.8 44 31.1 44 24c0-1.3-.1-2.7-.4-3.5z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#181717" aria-hidden="true">
      <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.6 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z" />
    </svg>
  );
}