import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { products } from "@/lib/products";

export default function ProductsPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f5] text-zinc-950">
      {/* Header */}
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
          <Link
            href="/"
            className="text-2xl font-black tracking-tight"
          >
            CATS HOME<span className="text-[#d4a017]">.</span>
          </Link>

          <Link
            href="/"
            className="text-sm font-bold hover:text-[#d4a017]"
          >
            ← Home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-5 py-14 text-center lg:py-20">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-[#d4a017]">
          CATS HOME Store
        </p>

        <h1 className="mt-4 text-4xl font-black sm:text-5xl">
          All Products
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-zinc-500">
          Explore our complete collection of products.
        </p>
      </section>

      {/* Products */}
      <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-black">
            {products.length} Products
          </h2>

          <Link
            href="/category"
            className="text-sm font-bold hover:text-[#d4a017]"
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
    </main>
  );
}
