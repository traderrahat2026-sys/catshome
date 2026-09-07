import { redirect } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Keep existing authentication functionality
  if (!user) {
    redirect("/admin-login");
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-black">
      {/* Existing Admin Sidebar */}
      <AdminSidebar />

      {/* Existing Admin Pages */}
      <main className="min-h-screen pl-64">
        {children}
      </main>
    </div>
  );
}
