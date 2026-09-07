"use client";

import Link from "next/link";

type Category = {
  name: string;
  slug: string;
  icon: string;
  description: string;
};

const categories: Category[] = [
  {
    name: "Cat Food",
    slug: "cat-food",
    icon: "🐱",
    description:
      "Nutritious everyday meals for happy and healthy cats.",
  },
  {
    name: "Wet Food",
    slug: "wet-food",
    icon: "🥫",
    description:
      "Delicious wet meals your cat will love.",
  },
  {
    name: "Cat Litter",
    slug: "cat-litter",
    icon: "🪣",
    description:
      "Fresh, clean and comfortable litter for every day.",
  },
  {
    name: "Toys",
    slug: "cat-toys",
    icon: "🧶",
    description:
      "Fun toys for play, exercise and enrichment.",
  },
  {
    name: "Accessories",
    slug: "cat-accessories",
    icon: "🎀",
    description:
      "Premium everyday essentials for your cat.",
  },
  {
    name: "Grooming",
    slug: "grooming",
    icon: "🪮",
    description:
      "Keep your cat clean, comfortable and well groomed.",
  },
  {
    name: "Hot Sale",
    slug: "hot-sale",
    icon: "🔥",
    description:
      "Grab the best deals on popular cat products.",
  },
  {
    name: "Special Offers",
    slug: "offers",
    icon: "🏷️",
    description:
      "Discover our latest discounts and special deals.",
  },
];

export default function CategoriesPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f5] text-zinc-950">
      {/* HEADER */}
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-3xl">🐱</span>

            <div>
              <p className="text-xl font-black">
                CATS<span className="text-[#d4a017]">.</span>
              </p>

              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/40">
                HOME
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-bold md:flex">
            <Link
              href="/"
              className="transition hover:text-[#d4a017]"
            >
              Home
            </Link>

            <Link
              href="/category"
              className="text-[#d4a017]"
            >
              Categories
            </Link>

            <Link
              href="/category/cat-food"
              className="transition hover:text-[#d4a017]"
            >
              Cat Food
            </Link>

            <Link
              href="/category/cat-litter"
              className="transition hover:text-[#d4a017]"
            >
              Cat Litter
            </Link>

            <Link
              href="/category/cat-toys"
              className="transition hover:text-[#d4a017]"
            >
              Toys
            </Link>

            <Link
              href="/category/hot-sale"
              className="transition hover:text-[#d4a017]"
            >
              Hot Sale
            </Link>

            <Link
              href="/offers"
              className="transition hover:text-[#d4a017]"
            >
              Offers
            </Link>
          </nav>
        </div>
      </header>

      {/* PAGE INTRO */}
      <section className="mx-auto max-w-7xl px-5 pb-10 pt-12 lg:px-8 lg:pt-16">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#d4a017]">
          CATS HOME
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
          Shop by Category
        </h1>

        <p className="mt-4 max-w-2xl text-sm leading-7 text-black/50 sm:text-base">
          Everything your cat needs in one place — food, litter,
          toys, accessories and grooming essentials.
        </p>
      </section>

      {/* CATEGORY GRID */}
      <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => {
            const href =
              category.slug === "offers"
                ? "/offers"
                : `/category/${category.slug}`;

            const isHotSale =
              category.slug === "hot-sale";

            const isOffer =
              category.slug === "offers";

            return (
              <Link
                key={category.slug}
                href={href}
                className="group relative overflow-hidden rounded-3xl border border-black/10 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-[#d4a017] hover:shadow-xl"
              >
                {/* ICON + BADGE */}
                <div className="flex items-start justify-between">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f7f7f5] text-3xl transition-all duration-300 group-hover:bg-[#d4a017] group-hover:scale-105">
                    {category.icon}
                  </div>

                  {isHotSale && (
                    <span className="rounded-full bg-black px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-white">
                      Hot
                    </span>
                  )}

                  {isOffer && (
                    <span className="rounded-full bg-[#d4a017] px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-black">
                      Offer
                    </span>
                  )}
                </div>

                {/* NAME */}
                <h2 className="mt-7 text-2xl font-black tracking-tight">
                  {category.name}
                </h2>

                {/* DESCRIPTION */}
                <p className="mt-3 min-h-[48px] text-sm leading-6 text-black/50">
                  {category.description}
                </p>

                {/* EXPLORE */}
                <div className="mt-7 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-[#d4a017]">
                    Explore
                  </span>

                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-lg text-white transition-all duration-300 group-hover:bg-[#d4a017] group-hover:text-black">
                    →
                  </span>
                </div>

                <div className="pointer-events-none absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-[#d4a017]/5 transition-transform duration-500 group-hover:scale-150" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-black/10 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-8 text-center lg:px-8">
          <Link
            href="/"
            className="inline-flex rounded-xl bg-black px-6 py-3 text-sm font-bold text-white transition hover:bg-[#d4a017] hover:text-black"
          >
            ← Back to Home
          </Link>
        </div>
      </footer>
    </main>
  );
}
