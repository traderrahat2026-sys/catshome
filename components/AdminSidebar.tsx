"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { name: "Dashboard", href: "/admin", icon: "▦" },
  { name: "Products", href: "/admin/products", icon: "□" },
  { name: "Categories", href: "/admin/categories", icon: "▤" },
  { name: "Orders", href: "/admin/orders", icon: "☰" },
  { name: "Customers", href: "/admin/customers", icon: "♙" },
  { name: "Transactions", href: "/admin/transactions", icon: "৳" },
  {
    name: "Payment Verification",
    href: "/admin/payment-verification",
    icon: "✓",
  },
  {
    name: "Order Tracking",
    href: "/admin/tracking",
    icon: "→",
  },

  // NEW
  {
    name: "Customer Receipt",
    href: "/admin/customer-receipt",
    icon: "▣",
  },

  {
    name: "Settings",
    href: "/admin/settings",
    icon: "⚙",
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  async function handleLogout() {
    try {
      const response = await fetch("/api/admin/logout", {
        method: "POST",
        cache: "no-store",
      });

      if (!response.ok) {
        console.error("Logout failed:", await response.text());
        return;
      }

      window.location.href = "/admin-login";
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-white/10 bg-black text-white">
      {/* LOGO */}
      <div className="flex h-20 items-center border-b border-white/10 px-6">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl font-black text-black">
            N
          </div>

          <div>
            <div className="text-lg font-bold tracking-wide">
              CATS HOME
            </div>

            <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">
              Admin Panel
            </div>
          </div>
        </Link>
      </div>

      {/* MENU */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
          Management
        </p>

        <div className="space-y-1">
          {menuItems.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                  active
                    ? "bg-white text-black"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    active
                      ? "bg-black text-white"
                      : "bg-white/5 text-white/60 group-hover:text-white"
                  }`}
                >
                  {item.icon}
                </span>

                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* BOTTOM */}
      <div className="space-y-2 border-t border-white/10 p-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/50 transition hover:bg-white/10 hover:text-white"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
            ←
          </span>

          <span>Back to Store</span>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
            ↪
          </span>

          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
