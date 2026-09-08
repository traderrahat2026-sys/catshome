"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-black/10 border-t-black" />

        <p className="text-sm font-medium text-black/50">
          Opening Admin Panel...
        </p>
      </div>
    </main>
  );
}