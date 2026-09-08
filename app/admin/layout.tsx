import AdminSidebar from "@/components/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f5f5f5] text-black">
      <AdminSidebar />

      <main className="min-h-screen pl-64">
        {children}
      </main>
    </div>
  );
}