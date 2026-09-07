import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { products } from "@/lib/products";

export default function ProductsPage() {
  return (
    <main className="min-h-screen bg-[#f7f5ef] text-zinc-950">
      {/* Header */}
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-2xl font-black tracking-tight"
          >
            <span className="text-2xl">🐱</span>
            <span>
              CATS HOME<span className="text-[#c89b3c]">.</span>
            </span>
          </Link>

          <Link
            href="/"
            className="text-sm font-bold transition hover:text-[#c89b3c]"
          >
            ← Home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-5 py-14 text-center lg:py-20">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-[#c89b3c]">
          CATS HOME
        </p>

        <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
          Everything Your Cat Deserves.
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-zinc-500 sm:text-lg">
          Explore our complete collection of premium cat food, litter, toys,
          accessories and everyday essentials.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/category/cat-food"
            className="rounded-full bg-black px-6 py-3 text-sm font-black text-white transition hover:bg-[#c89b3c] hover:text-black"
          >
            SHOP CAT FOOD
          </Link>

          <Link
            href="/category"
            className="rounded-full border border-black/15 bg-white px-6 py-3 text-sm font-black transition hover:border-[#c89b3c] hover:text-[#c89b3c]"
          >
            BROWSE CATEGORIES
          </Link>
        </div>
      </section>

      {/* Products */}
      <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#c89b3c]">
              Our Collection
            </p>

            <h2 className="mt-1 text-2xl font-black">
              {products.length} Products
            </h2>
          </div>

          <Link
            href="/category"
            className="text-sm font-bold transition hover:text-[#c89b3c]"
          >
            Browse Categories →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-black/10 bg-black px-5 py-16 text-center text-white">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#c89b3c]">
          CATS HOME
        </p>

        <h2 className="mt-3 text-3xl font-black sm:text-4xl">
          Because They Deserve The Best.
        </h2>

        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/60">
          Premium products selected for happy, healthy and spoiled cats.
        </p>

        <Link
          href="/"
          className="mt-7 inline-flex rounded-full bg-white px-7 py-3 text-sm font-black text-black transition hover:bg-[#c89b3c]"
        >
          BACK TO HOME
        </Link>
      </section>
    </main>
  );
}
