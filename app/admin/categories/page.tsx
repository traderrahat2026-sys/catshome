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
| ONLY CAT CATEGORIES
|--------------------------------------------------------------------------
*/

const CAT_CATEGORY_SLUGS = [
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
  if (
    category.description &&
    category.description.trim() !== ""
  ) {
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

  const [cleaning, setCleaning] = useState(false);
  const [deletingId, setDeletingId] = useState<
    number | string | null
  >(null);

  /*
  |--------------------------------------------------------------------------
  | Load categories
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("categories")
        .select(
          "id,name,slug,icon,description,image_url"
        )
        .order("id", {
          ascending: true,
        });

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
      | Only CAT categories
      |--------------------------------------------------------------------------
      */

      const catCategories: Category[] = [];

      const usedSlugs = new Set<string>();

      for (const category of data || []) {
        const slug = normalizeSlug(category.slug);

        if (!CAT_CATEGORY_SLUGS.includes(slug)) {
          continue;
        }

        /*
        Prevent duplicate categories
        */

        if (usedSlugs.has(slug)) {
          continue;
        }

        usedSlugs.add(slug);

        catCategories.push(category);
      }

      /*
      |--------------------------------------------------------------------------
      | Exact order
      |--------------------------------------------------------------------------
      */

      catCategories.sort((a, b) => {
        const aSlug = normalizeSlug(a.slug);
        const bSlug = normalizeSlug(b.slug);

        return (
          CAT_CATEGORY_SLUGS.indexOf(aSlug) -
          CAT_CATEGORY_SLUGS.indexOf(bSlug)
        );
      });

      setCategories(catCategories);
    } catch (error) {
      console.error(
        "Unexpected category loading error:",
        error
      );

      setCategories([]);
    } finally {
      setLoading(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Remove all non-cat categories
  |--------------------------------------------------------------------------
  |
  | This actually deletes unwanted categories from Supabase.
  |
  */

  async function removeOtherCategories() {
    if (cleaning) return;

    const confirmed = window.confirm(
      "Are you sure you want to remove all non-cat categories such as Gadgets, Fashion, Footwear and Watches?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setCleaning(true);

      /*
      Get every category
      */

      const { data: allCategories, error } =
        await supabase
          .from("categories")
          .select("id,name,slug");

      if (error) {
        throw error;
      }

      const unwanted =
        (allCategories || []).filter((category) => {
          const slug = normalizeSlug(category.slug);

          return !CAT_CATEGORY_SLUGS.includes(slug);
        });

      if (unwanted.length === 0) {
        alert("No other categories found.");
        return;
      }

      let deletedCount = 0;
      let skippedCount = 0;

      /*
      |--------------------------------------------------------------------------
      | Check each unwanted category
      |--------------------------------------------------------------------------
      */

      for (const category of unwanted) {
        /*
        Check whether products use this category
        */

        const { count, error: productError } =
          await supabase
            .from("products")
            .select("id", {
              count: "exact",
              head: true,
            })
            .or(
              `category.eq.${category.name},category.eq.${category.slug}`
            );

        if (productError) {
          console.error(
            "Product check error:",
            productError
          );

          skippedCount++;
          continue;
        }

        /*
        Do not delete a category that still has products
        */

        if ((count || 0) > 0) {
          skippedCount++;
          continue;
        }

        /*
        Delete category
        */

        const { error: deleteError } =
          await supabase
            .from("categories")
            .delete()
            .eq("id", category.id);

        if (deleteError) {
          console.error(
            "Category delete error:",
            deleteError
          );

          skippedCount++;
          continue;
        }

        deletedCount++;
      }

      await loadCategories();

      if (skippedCount > 0) {
        alert(
          `${deletedCount} unwanted category(s) removed.\n\n${skippedCount} category(s) were kept because they still have products or could not be deleted.`
        );
      } else {
        alert(
          `${deletedCount} unwanted category(s) removed successfully.`
        );
      }
    } catch (error) {
      console.error(
        "Remove other categories error:",
        error
      );

      alert(
        "Could not remove the other categories. Check the browser console for details."
      );
    } finally {
      setCleaning(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Delete individual category
  |--------------------------------------------------------------------------
  */

  async function deleteCategory(category: Category) {
    if (deletingId !== null) return;

    const confirmed = window.confirm(
      `Delete "${category.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(category.id);

      /*
      Check products
      */

      const { count, error: productError } =
        await supabase
          .from("products")
          .select("id", {
            count: "exact",
            head: true,
          })
          .or(
            `category.eq.${category.name},category.eq.${category.slug}`
          );

      if (productError) {
        throw productError;
      }

      if ((count || 0) > 0) {
        alert(
          `Cannot delete "${category.name}" because ${count} product(s) are using this category.`
        );

        return;
      }

      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", category.id);

      if (error) {
        throw error;
      }

      setCategories((previous) =>
        previous.filter(
          (item) => item.id !== category.id
        )
      );

      alert(
        `"${category.name}" deleted successfully.`
      );
    } catch (error) {
      console.error(
        "Delete category error:",
        error
      );

      alert(
        "Could not delete this category."
      );
    } finally {
      setDeletingId(null);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Add category
  |--------------------------------------------------------------------------
  */

  const addCategoryHref =
    "/admin/categories/add";

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

      <section className="px-5 pt-10 pb-8 sm:px-8 lg:px-12">

        <div className="mx-auto max-w-7xl">

          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">

            <div>

              <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-[#d99b00]">
                Management
              </p>

              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                Categories
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-6 text-gray-500">
                Manage your cat product categories,
                images and information.
              </p>

            </div>

            {/* ==========================================================
                HEADER BUTTONS
            ========================================================== */}

            <div className="flex flex-wrap gap-3">

              {/* Remove unwanted categories */}

              <button
                type="button"
                onClick={removeOtherCategories}
                disabled={cleaning}
                className="rounded-full border border-red-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.15em] text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cleaning
                  ? "Removing..."
                  : "Remove Other Categories"}
              </button>

              {/* Add category */}

              <Link
                href={addCategoryHref}
                className="rounded-full bg-black px-6 py-3 text-xs font-black uppercase tracking-[0.15em] text-white transition hover:bg-[#d99b00]"
              >
                + Add Category
              </Link>

            </div>

          </div>

        </div>

      </section>

      {/* ================================================================
          CATEGORY GRID
      ================================================================= */}

      <section className="px-5 pb-24 sm:px-8 lg:px-12">

        <div className="mx-auto max-w-7xl">

          {/* ============================================================
              LOADING
          ============================================================= */}

          {loading ? (

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

              {Array.from({
                length: 6,
              }).map((_, index) => (

                <div
                  key={index}
                  className="overflow-hidden rounded-[28px] bg-white shadow-sm"
                >

                  <div className="h-[240px] animate-pulse bg-gray-200" />

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
               EMPTY
            ============================================================= */

            <div className="rounded-[28px] bg-white px-6 py-24 text-center shadow-sm">

              <div className="text-6xl">
                🐱
              </div>

              <h2 className="mt-5 text-2xl font-black">
                No cat categories found
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Add your cat categories from the admin panel.
              </p>

              <Link
                href={addCategoryHref}
                className="mt-7 inline-flex rounded-full bg-black px-6 py-3 text-xs font-black uppercase tracking-[0.15em] text-white transition hover:bg-[#d99b00]"
              >
                + Add Category
              </Link>

            </div>

          ) : (

            /* ============================================================
               GRID
            ============================================================= */

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

                  <article
                    key={category.id}
                    className="group overflow-hidden rounded-[28px] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(0,0,0,0.10)]"
                  >

                    {/* ==================================================
                        IMAGE
                    ================================================== */}

                    <div className="relative h-[240px] overflow-hidden bg-[#ece9e1]">

                      {image ? (

                        <img
                          src={image}
                          alt={category.name}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                          onError={(event) => {

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
                          ICON
                      ================================================== */}

                      <div className="absolute left-5 top-5 flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-[0_5px_20px_rgba(0,0,0,0.12)]">
                        {icon}
                      </div>

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
                          ACTIONS
                      ================================================== */}

                      <div className="mt-6 flex items-center gap-2">

                        {/* EDIT */}

                        <Link
                          href={`/admin/categories/edit/${encodeURIComponent(
                            slug
                          )}`}
                          className="flex-1 rounded-full bg-black px-4 py-3 text-center text-xs font-black uppercase tracking-[0.15em] text-white transition hover:bg-[#d99b00]"
                        >
                          ✏ Edit
                        </Link>

                        {/* DELETE */}

                        <button
                          type="button"
                          onClick={() =>
                            deleteCategory(category)
                          }
                          disabled={
                            deletingId === category.id
                          }
                          className="rounded-full border border-red-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === category.id
                            ? "..."
                            : "Delete"}
                        </button>

                      </div>

                    </div>

                  </article>

                );

              })}

            </div>

          )}

        </div>

      </section>

    </main>
  );
}
