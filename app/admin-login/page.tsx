"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAccess(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: code.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid access code.");
        return;
      }

      router.push("/admin");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
      <div className="w-full max-w-md">

        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-4xl font-black text-black shadow-2xl">
            C
          </div>

          <h1 className="text-3xl font-bold">
            CATS HOME
          </h1>

          <p className="mt-2 text-sm text-white/40">
            Private Admin Access
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-2xl">

          <div className="mb-7">
            <h2 className="text-xl font-semibold">
              Welcome
            </h2>

            <p className="mt-2 text-sm text-white/40">
              Enter your secret access code to open the Admin Panel.
            </p>
          </div>

          <form onSubmit={handleAccess}>

            <label className="mb-2 block text-sm font-medium text-white/70">
              Secret Access Code
            </label>

            <input
              type="password"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Enter your secret code"
              autoComplete="off"
              required
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/40 focus:ring-1 focus:ring-white/20"
            />

            {error && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-5 w-full rounded-xl bg-white px-4 py-4 font-semibold text-black transition hover:bg-white/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Checking..." : "Open Admin"}
            </button>

          </form>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-5 w-full text-center text-sm text-white/40 transition hover:text-white"
          >
            ← Back to Store
          </button>

        </div>

        <p className="mt-6 text-center text-xs text-white/20">
          CATS HOME • Private Administration
        </p>

      </div>
    </main>
  );
}