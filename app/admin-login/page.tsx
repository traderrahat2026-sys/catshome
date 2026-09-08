"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid login credentials.");
        return;
      }

      router.replace("/admin");
      router.refresh();
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

          <h1 className="text-3xl font-bold tracking-tight">
            CATS HOME
          </h1>

          <p className="mt-2 text-sm text-white/40">
            Admin Login
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-2xl backdrop-blur-xl">

          <div className="mb-7">
            <h2 className="text-xl font-semibold">
              Welcome Back
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/40">
              Sign in to access the Admin Panel.
            </p>
          </div>

          <form onSubmit={handleLogin}>

            <label className="mb-2 block text-sm font-medium text-white/70">
              Username
            </label>

            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter username"
              autoComplete="username"
              required
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/40 focus:ring-1 focus:ring-white/20"
            />

            <label className="mb-2 mt-5 block text-sm font-medium text-white/70">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
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
              {loading ? "Signing in..." : "Sign In"}
            </button>

          </form>

          <button
            type="button"
            onClick={() => router.push("/admin-reset")}
            className="mt-5 w-full text-center text-sm text-white/40 transition hover:text-white"
          >
            Forgot Password?
          </button>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-4 w-full text-center text-sm text-white/40 transition hover:text-white"
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