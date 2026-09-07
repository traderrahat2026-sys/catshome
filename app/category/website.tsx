import Link from "next/link";
import { categories } from "@/lib/products";

export default function CategoriesPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f5] text-zinc-950">
      {/* Header */}
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
          <Link href="/" className="text-2xl font-black tracking-tight">
            CATS HOME<span className="text-[#d4a017]">.</span>
          </Link>

          <Link
            href="/"
            className="text-sm font-bold transition hover:text-[#d4a017]"
          >
            ← Home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-5 py-16 text-center lg:py-24">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-[#d4a017]">
          Explore CATS HOME
        </p>

        <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
          Shop by Category
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-zinc-500">
          Discover products across fashion, footwear, accessories, watches
          and gadgets.
        </p>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="group rounded-3xl border border-zinc-200 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[#d4a017] hover:shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 text-3xl transition group-hover:bg-[#d4a017]">
                  {category.icon}
                </div>

                <span className="text-2xl transition group-hover:translate-x-1">
                  →
                </span>
              </div>

              <h2 className="mt-7 text-2xl font-black">
                {category.name}
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                Explore {category.name.toLowerCase()} products
              </p>
            </Link>
          ))}
        </div>

        {/* Special Sections */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <Link
            href="/category/hot-sale"
            className="rounded-3xl bg-black p-8 text-white transition hover:-translate-y-1 hover:shadow-xl"
          >
            <p className="text-sm font-bold uppercase tracking-widest text-[#d4a017]">
              Special
            </p>

            <h2 className="mt-3 text-3xl font-black">Hot Sale</h2>

            <p className="mt-2 text-sm text-zinc-400">
              Grab our hottest deals before they are gone.
            </p>

            <span className="mt-6 inline-block font-bold">
              Shop Hot Sale →
            </span>
          </Link>

          <Link
            href="/offers"
            className="rounded-3xl border border-zinc-200 bg-white p-8 transition hover:-translate-y-1 hover:border-[#d4a017] hover:shadow-xl"
          >
            <p className="text-sm font-bold uppercase tracking-widest text-[#d4a017]">
              Save More
            </p>

            <h2 className="mt-3 text-3xl font-black">Offers</h2>

            <p className="mt-2 text-sm text-zinc-500">
              Check out our latest discounted products.
            </p>

            <span className="mt-6 inline-block font-bold">
              View Offers →
            </span>
          </Link>
        </div>
      </section>
    </main>
  );
}
