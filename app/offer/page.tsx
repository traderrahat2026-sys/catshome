import Link from "next/link";

export default function OffersPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f5] text-black">
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
            ← Back Home
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4a017]">
          Best Deals
        </p>

        <h1 className="mt-3 text-5xl font-black">
          Special Offers
        </h1>

        <p className="mt-4 max-w-xl text-black/60">
          Discover our latest discounts and special deals.
        </p>

        <div className="mt-10 rounded-[2rem] bg-black p-10 text-white">
          <h2 className="text-4xl font-black">
            Up to 40% OFF
          </h2>

          <p className="mt-4 max-w-lg text-white/60">
            Grab selected products before the offer ends.
          </p>

          <Link
            href="/category/hot-sale"
            className="mt-7 inline-block rounded-full bg-[#d4a017] px-7 py-3.5 text-sm font-black text-black"
          >
            SHOP DEALS
          </Link>
        </div>
      </section>
    </main>
  );
}
