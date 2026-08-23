"use client";

import { useState, FormEvent } from "react";
import { updatePassword } from "@/lib/authService";

const WITS_BLUE = "#043673";
const WITS_GOLD = "#C9A24B";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError(null);
    setPasswordError(null);

    // Basic password validation checks
    if (!password) {
      setPasswordError("Please enter a new password.");
      return;
    }
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    // Update password in Supabase database
    const { error } = await updatePassword(password);
    setIsSubmitting(false);

    if (error) {
      setServerError("Link may have expired. Try requesting a new password reset email.");
    } else {
      setIsSuccess(true);
    }
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-[0_2px_40px_-8px_rgba(4,54,115,0.25)]">
        {/* Signature Wits Gold-to-Blue bar */}
        <div
          style={{ background: `linear-gradient(90deg, ${WITS_BLUE}, ${WITS_GOLD})` }}
          className="h-1.5 w-full"
        />

        <div className="px-9 pb-9 pt-8">
          <div className="mb-7 flex flex-col items-center text-center">
            <Monogram />
            <h1 className="mt-4 font-serif text-[26px] leading-tight text-[#0A1F3D]">
              {isSuccess ? "Password updated" : "Set new password"}
            </h1>
            <p className="mt-1.5 text-[13px] text-gray-500">
              {isSuccess
                ? "Your credentials have been securely saved."
                : "Enter your new account password below"}
            </p>
          </div>

          {serverError && (
            <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          {isSuccess ? (
            <div className="text-center">
              <p className="mb-6 text-sm text-gray-600">
                You can now log in to Wits Quest using your new password.
              </p>
              <a
                href="/login"
                style={{ background: WITS_BLUE }}
                className="inline-block w-full rounded-xl py-3.5 text-center text-sm font-semibold text-white transition-all hover:brightness-110"
              >
                Go to Sign In
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-4">
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-[13px] font-medium text-gray-600"
                >
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-2.5 text-sm text-[#0A1F3D] outline-none transition-colors focus:border-[#043673] focus:bg-white"
                />
              </div>

              <div className="mb-6">
                <label
                  htmlFor="confirmPassword"
                  className="mb-1.5 block text-[13px] font-medium text-gray-600"
                >
                  Confirm new password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-2.5 text-sm text-[#0A1F3D] outline-none transition-colors focus:border-[#043673] focus:bg-white"
                />
                {passwordError && (
                  <p className="mt-1.5 text-xs text-red-600">{passwordError}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{ background: WITS_BLUE }}
                className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60"
              >
                {isSubmitting ? "Updating password…" : "Reset password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

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