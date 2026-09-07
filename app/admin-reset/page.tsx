"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminResetPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendResetLink() {
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(
      "forbusiness0101@gmail.com",
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

  if (sent) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-7 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl text-black">
            ✓
          </div>

          <h1 className="text-2xl font-bold">Check your email</h1>

          <p className="mt-3 text-sm leading-6 text-white/50">
            A password reset link has been sent to the admin email.
          </p>

          <p className="mt-2 text-xs text-white/30">
            Open the link and you will be brought back here to set a new
            password.
          </p>
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

          <h1 className="text-3xl font-bold">CATS HOME</h1>

          <p className="mt-2 text-sm text-white/40">
            Admin Password Reset
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">

          <h2 className="text-xl font-semibold">
            Forgot your password?
          </h2>

          <p className="mt-2 text-sm leading-6 text-white/40">
            We will send a secure password reset link to the admin account.
          </p>

          {error && (
            <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
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
            className="mt-4 w-full text-sm text-white/40 hover:text-white"
          >
            ← Back to Login
          </button>

        </div>
      </div>
    </main>
  );
}
