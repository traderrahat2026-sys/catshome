"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAIL = "traderrahat2026@gmail.com";

export default function AdminResetPage() {
  const [mode, setMode] = useState<"request" | "update" | "checking">(
    "checking"
  );

  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let mounted = true;

    async function checkRecovery() {
      const hash = window.location.hash;

      const searchParams = new URLSearchParams(window.location.search);

      const hasRecoveryType =
        searchParams.get("type") === "recovery" ||
        hash.includes("type=recovery");

      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!error && data.session && hasRecoveryType) {
        setMode("update");
        return;
      }

      if (!error && data.session) {
        setMode("update");
        return;
      }

      if (hasRecoveryType) {
        setMode("update");
        return;
      }

      setMode("request");
    }

    checkRecovery();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "PASSWORD_RECOVERY" && session) {
        setMode("update");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function sendResetLink() {
    setError("");
    setSuccess("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(
      ADMIN_EMAIL,
      {
        redirectTo: `${window.location.origin}/admin-reset`,
      }
    );

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSent(true);
  }

  async function updatePassword() {
    setError("");
    setSuccess("");

    if (!password || !confirmPassword) {
      setError("Please enter your new password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setUpdating(true);

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    setUpdating(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess("Password updated successfully!");

    setPassword("");
    setConfirmPassword("");

    await supabase.auth.signOut();

    setTimeout(() => {
      window.location.href = "/admin-login";
    }, 1500);
  }

  if (mode === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl font-black text-black">
            C
          </div>

          <h1 className="text-xl font-semibold">
            CATS HOME
          </h1>

          <p className="mt-3 text-sm text-white/40">
            Checking password reset...
          </p>
        </div>
      </main>
    );
  }

  if (mode === "request" && sent) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-7 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl font-black text-black">
            ✓
          </div>

          <h1 className="text-2xl font-bold">
            Check your email
          </h1>

          <p className="mt-3 text-sm leading-6 text-white/50">
            A password reset link has been sent to:
          </p>

          <p className="mt-2 break-all text-sm font-semibold text-white">
            {ADMIN_EMAIL}
          </p>

          <p className="mt-4 text-xs leading-5 text-white/30">
            Open the email and click the password reset link.
            You will return here to create a new password.
          </p>

          <button
            type="button"
            onClick={() => {
              setSent(false);
              setError("");
              setSuccess("");
            }}
            className="mt-6 w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            Send Again
          </button>

          <button
            type="button"
            onClick={() => {
              window.location.href = "/admin-login";
            }}
            className="mt-4 w-full text-sm text-white/40 transition hover:text-white"
          >
            ← Back to Login
          </button>
        </div>
      </main>
    );
  }

  if (mode === "update") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl font-black text-black">
              N
            </div>

            <h1 className="text-3xl font-bold">
              CATS HOME
            </h1>

            <p className="mt-2 text-sm text-white/40">
              Admin Password Reset
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
            <h2 className="text-xl font-semibold">
              Create New Password
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/40">
              Enter a new password for your admin account.
            </p>

            {error && (
              <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm leading-5 text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-5 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm leading-5 text-green-400">
                {success}
              </div>
            )}

            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-white/70">
                New Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter new password"
                autoComplete="new-password"
                disabled={updating}
                className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none transition placeholder:text-white/20 focus:border-white/30 disabled:opacity-50"
              />
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-white/70">
                Confirm Password
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                placeholder="Confirm new password"
                autoComplete="new-password"
                disabled={updating}
                className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none transition placeholder:text-white/20 focus:border-white/30 disabled:opacity-50"
              />
            </div>

            <p className="mt-3 text-xs text-white/30">
              Password must contain at least 6 characters.
            </p>

            <button
              type="button"
              onClick={updatePassword}
              disabled={updating}
              className="mt-6 w-full rounded-xl bg-white px-4 py-3 font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updating
                ? "Updating Password..."
                : "Update Password"}
            </button>

            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/admin-login";
              }}
              disabled={updating}
              className="mt-4 w-full text-sm text-white/40 transition hover:text-white disabled:opacity-50"
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl font-black text-black">
            N
          </div>

          <h1 className="text-3xl font-bold">
            CATS HOME
          </h1>

          <p className="mt-2 text-sm text-white/40">
            Admin Password Reset
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
          <h2 className="text-xl font-semibold">
            Forgot your password?
          </h2>

          <p className="mt-2 text-sm leading-6 text-white/40">
            We will send a secure password reset link to the
            admin account.
          </p>

          <div className="mt-5 rounded-xl border border-white/10 bg-black/40 px-4 py-3">
            <p className="text-xs text-white/30">
              Admin Email
            </p>

            <p className="mt-1 break-all text-sm font-medium text-white/80">
              {ADMIN_EMAIL}
            </p>
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm leading-5 text-red-400">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={sendResetLink}
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-white px-4 py-3 font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

          <button
            type="button"
            onClick={() => {
              window.location.href = "/admin-login";
            }}
            className="mt-4 w-full text-sm text-white/40 transition hover:text-white"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </main>
  );
}