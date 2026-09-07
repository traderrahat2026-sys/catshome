import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { getOfferProducts } from "@/lib/products";

export default function OffersPage() {
  const products = getOfferProducts();

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

      {/* Offer Hero */}
      <section className="bg-black px-5 py-16 text-center text-white lg:py-24">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-[#d4a017]">
          Limited Time
        </p>

        <h1 className="mt-4 text-4xl font-black sm:text-6xl">
          Special Offers
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-zinc-400">
          Save more on selected CATS HOME products while the offers last.
        </p>

        <Link
          href="/category/hot-sale"
          className="mt-8 inline-flex rounded-xl bg-[#d4a017] px-7 py-3 font-black text-black transition hover:bg-[#e5b52b]"
        >
          View Hot Sale
        </Link>
      </section>

      {/* Products */}
      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="mb-7">
          <p className="text-sm font-bold uppercase tracking-widest text-[#d4a017]">
            Best Deals
          </p>

          <h2 className="mt-2 text-3xl font-black">
            Products on Offer
          </h2>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-zinc-200 bg-white p-12 text-center">
            <h2 className="text-2xl font-black">
              No active offers
            </h2>

            <Link
              href="/products"
              className="mt-6 inline-flex rounded-xl bg-black px-6 py-3 font-bold text-white"
            >
              View All Products
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
