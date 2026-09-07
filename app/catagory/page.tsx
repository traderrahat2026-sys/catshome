"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Category = {
  id: number | string;
  name: string;
  slug: string;
  icon?: string | null;
  description?: string | null;
  image_url?: string | null;
};

/*
|--------------------------------------------------------------------------
| ONLY THESE 6 CATEGORIES WILL SHOW
|--------------------------------------------------------------------------
*/

const ALLOWED_CATEGORIES = [
  "cat-food",
  "wet-food",
  "cat-litter",
  "cat-toys",
  "cat-accessories",
  "accessories",
  "grooming",
];

/*
|--------------------------------------------------------------------------
| Default icons
|--------------------------------------------------------------------------
*/

const DEFAULT_ICONS: Record<string, string> = {
  "cat-food": "🐱",
  "wet-food": "🥫",
  "cat-litter": "🪣",
  "cat-toys": "🧶",
  "cat-accessories": "🎀",
  accessories: "🎀",
  grooming: "💜",
};

/*
|--------------------------------------------------------------------------
| Default descriptions
|--------------------------------------------------------------------------
*/

const DEFAULT_DESCRIPTIONS: Record<string, string> = {
  "cat-food":
    "Nutritious everyday food for happy and healthy cats.",

  "wet-food":
    "Delicious and hydrating wet meals cats love.",

  "cat-litter":
    "Fresh, clean and comfortable litter for your cat.",

  "cat-toys":
    "Fun toys for play, exercise and daily enrichment.",

  "cat-accessories":
    "Stylish and practical essentials for your cat.",

  accessories:
    "Stylish and practical essentials for your cat.",

  grooming:
    "Grooming essentials for a clean and healthy coat.",
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function normalizeSlug(value?: string | null) {
  return (value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
}

function getIcon(category: Category) {
  if (category.icon && category.icon.trim() !== "") {
    return category.icon;
  }

  const slug = normalizeSlug(category.slug);

  return DEFAULT_ICONS[slug] || "🐱";
}

function getDescription(category: Category) {
  if (category.description && category.description.trim() !== "") {
    return category.description;
  }

  const slug = normalizeSlug(category.slug);

  return (
    DEFAULT_DESCRIPTIONS[slug] ||
    "Discover quality products specially selected for your cat."
  );
}

/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

export default function CategoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | LOAD ONLY CAT CATEGORIES
  |--------------------------------------------------------------------------
  */

  async function loadCategories() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("categories")
        .select(
          "id,name,slug,icon,description,image_url"
        )
        .in("slug", ALLOWED_CATEGORIES);

      if (error) {
        console.error(
          "Error loading categories:",
          error
        );

        setCategories([]);
        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Remove duplicates
      |--------------------------------------------------------------------------
      */

      const uniqueCategories: Category[] = [];
      const usedSlugs = new Set<string>();

      for (const category of data || []) {
        const slug = normalizeSlug(category.slug);

        if (!ALLOWED_CATEGORIES.includes(slug)) {
          continue;
        }

        if (usedSlugs.has(slug)) {
          continue;
        }

        usedSlugs.add(slug);
        uniqueCategories.push(category);
      }

      /*
      |--------------------------------------------------------------------------
      | Keep the exact order we want
      |--------------------------------------------------------------------------
      */

      uniqueCategories.sort((a, b) => {
        const aSlug = normalizeSlug(a.slug);
        const bSlug = normalizeSlug(b.slug);

        return (
          ALLOWED_CATEGORIES.indexOf(aSlug) -
          ALLOWED_CATEGORIES.indexOf(bSlug)
        );
      });

      setCategories(uniqueCategories);
    } catch (error) {
      console.error(
        "Unexpected category error:",
        error
      );

      setCategories([]);
    } finally {
      setLoading(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-black">

      {/* ================================================================
          HEADER
      ================================================================= */}

      <section className="px-5 pt-28 pb-14 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">

          <div className="max-w-3xl">

            <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-[#d99b00]">
              Explore
            </p>

            <h1 className="text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
              Categories
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-gray-500 sm:text-lg">
              Everything your cat needs, carefully selected
              in one place. Explore food, litter, toys,
              accessories and grooming essentials.
            </p>

          </div>

        </div>
      </section>

      {/* ================================================================
          CATEGORY SECTION
      ================================================================= */}

      <section className="px-5 pb-24 sm:px-8 lg:px-12">

        <div className="mx-auto max-w-7xl">

          {/* ============================================================
              LOADING
          ============================================================= */}

          {loading ? (

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

              {Array.from({ length: 6 }).map((_, index) => (

                <div
                  key={index}
                  className="overflow-hidden rounded-[28px] bg-white shadow-sm"
                >

                  <div className="h-[260px] animate-pulse bg-gray-200" />

                  <div className="p-6">

                    <div className="h-7 w-32 animate-pulse rounded bg-gray-200" />

                    <div className="mt-4 h-4 w-full animate-pulse rounded bg-gray-200" />

                    <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-gray-200" />

                  </div>

                </div>

              ))}

            </div>

          ) : categories.length === 0 ? (

            /* ============================================================
               NO CATEGORY
            ============================================================ */

            <div className="rounded-[28px] bg-white px-6 py-20 text-center shadow-sm">

              <div className="text-6xl">
                🐱
              </div>

              <h2 className="mt-5 text-2xl font-black">
                No categories found
              </h2>

              <p className="mt-2 text-gray-500">
                Please add the cat categories from the admin panel.
              </p>

            </div>

          ) : (

            /* ============================================================
               CATEGORY GRID
            ============================================================ */

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

              {categories.map((category) => {

                const slug =
                  normalizeSlug(category.slug);

                const icon =
                  getIcon(category);

                const description =
                  getDescription(category);

                const image =
                  category.image_url?.trim() || "";

                return (

                  <Link
                    key={category.id}
                    href={`/category/${encodeURIComponent(slug)}`}
                    className="group block"
                  >

                    <article className="overflow-hidden rounded-[28px] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(0,0,0,0.10)]">

                      {/* ==================================================
                          IMAGE
                      ================================================== */}

                      <div className="relative h-[260px] overflow-hidden bg-[#ece9e1]">

                        {image ? (

                          <img
                            src={image}
                            alt={category.name}
                            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            loading="lazy"
                            onError={(event) => {

                              /*
                              If image URL is broken,
                              hide image and show icon.
                              */

                              event.currentTarget.style.display =
                                "none";

                              const parent =
                                event.currentTarget.parentElement;

                              if (parent) {
                                parent.classList.add(
                                  "flex",
                                  "items-center",
                                  "justify-center"
                                );
                              }
                            }}
                          />

                        ) : (

                          <div className="flex h-full w-full items-center justify-center">

                            <span className="text-7xl">
                              {icon}
                            </span>

                          </div>

                        )}

                        {/* ==================================================
                            CATEGORY ICON
                        ================================================== */}

                        <div className="absolute left-5 top-5 flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-[0_5px_20px_rgba(0,0,0,0.12)]">

                          {icon}

                        </div>

                        {/* ==================================================
                            HOVER OVERLAY
                        ================================================== */}

                        <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/5" />

                      </div>

                      {/* ==================================================
                          CONTENT
                      ================================================== */}

                      <div className="p-6">

                        <h2 className="text-2xl font-black tracking-tight">
                          {category.name}
                        </h2>

                        <p className="mt-1 text-xs font-medium text-gray-400">
                          {slug}
                        </p>

                        <p className="mt-4 min-h-[48px] text-sm leading-6 text-gray-500">
                          {description}
                        </p>

                        {/* ==================================================
                            EXPLORE
                        ================================================== */}

                        <div className="mt-6 flex items-center justify-between">

                          <span className="text-xs font-black uppercase tracking-[0.25em] text-[#d99b00]">
                            Explore
                          </span>

                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white transition-all duration-300 group-hover:translate-x-1 group-hover:bg-[#d99b00]">

                            <svg
                              width="17"
                              height="17"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >

                              <path
                                d="M5 12H19"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />

                              <path
                                d="M13 6L19 12L13 18"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />

                            </svg>

                          </span>

                        </div>

                      </div>

                    </article>

                  </Link>

                );

              })}

            </div>

          )}

        </div>

      </section>

    </main>
  );
}
