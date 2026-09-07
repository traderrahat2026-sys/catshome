"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";

export default function Navbar() {
  const { cartCount } = useCart();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* CATS HOME LOGO */}
        <Link
          href="/"
          className="flex shrink-0 items-center"
          aria-label="CATS HOME"
        >
          <Image
            src="/cats-home-logo-transparent.png"
            alt="CATS HOME"
            width={145}
            height={55}
            priority
            unoptimized
            className="block h-[55px] w-auto object-contain"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-5 md:flex">
          <Link
            href="/"
            className="text-sm font-semibold text-zinc-700 transition hover:text-black"
          >
            Home
          </Link>

          <Link
            href="/category"
            className="text-sm font-semibold text-zinc-700 transition hover:text-black"
          >
            Categories
          </Link>

          <Link
            href="/category/gadgets"
            className="text-sm font-semibold text-zinc-700 transition hover:text-black"
          >
            Gadgets
          </Link>

          <Link
            href="/category/hot-sale"
            className="text-sm font-bold text-red-600 transition hover:text-red-700"
          >
            🔥 Hot Sale
          </Link>

          <Link
            href="/products"
            className="text-sm font-semibold text-zinc-700 transition hover:text-black"
          >
            Products
          </Link>

          <Link
            href="/offers"
            className="text-sm font-semibold text-zinc-700 transition hover:text-black"
          >
            Offers
          </Link>
        </nav>

        {/* Cart */}
        <Link
          href="/cart"
          className="relative flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-bold text-zinc-900 transition hover:border-black hover:bg-zinc-50"
        >
          <span className="text-lg">🛒</span>
          <span className="hidden sm:inline">Cart</span>

          {cartCount > 0 && (
            <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-black px-1.5 text-xs font-bold text-white">
              {cartCount}
            </span>
          )}
        </Link>
      </div>

      {/* Mobile Navigation */}
      <div className="border-t border-zinc-100 md:hidden">
        <nav className="mx-auto flex max-w-7xl items-center gap-6 overflow-x-auto px-4 py-3">
          <Link
            href="/"
            className="whitespace-nowrap text-xs font-semibold text-zinc-700"
          >
            Home
          </Link>

          <Link
            href="/category"
            className="whitespace-nowrap text-xs font-semibold text-zinc-700"
          >
            Categories
          </Link>

          <Link
            href="/category/gadgets"
            className="whitespace-nowrap text-xs font-semibold text-zinc-700"
          >
            Gadgets
          </Link>

          <Link
            href="/category/hot-sale"
            className="whitespace-nowrap text-xs font-bold text-red-600"
          >
            🔥 Hot Sale
          </Link>

          <Link
            href="/products"
            className="whitespace-nowrap text-xs font-semibold text-zinc-700"
          >
            Products
          </Link>

          <Link
            href="/offers"
            className="whitespace-nowrap text-xs font-semibold text-zinc-700"
          >
            Offers
          </Link>
        </nav>
      </div>
    </header>
  );
}