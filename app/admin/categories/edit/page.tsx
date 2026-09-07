"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const CAT_CATEGORIES = [
  {
    name: "Cat Food",
    slug: "cat-food",
    icon: "🐱",
  },
  {
    name: "Wet Food",
    slug: "wet-food",
    icon: "🥫",
  },
  {
    name: "Cat Litter",
    slug: "cat-litter",
    icon: "🪣",
  },
  {
    name: "Cat Toys",
    slug: "cat-toys",
    icon: "🧶",
  },
  {
    name: "Accessories",
    slug: "cat-accessories",
    icon: "🎀",
  },
  {
    name: "Grooming",
    slug: "grooming",
    icon: "🪮",
  },
];

export default function AddCategoryPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("🐱");
  const [saving, setSaving] = useState(false);

  function makeSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function handleNameChange(value: string) {
    setName(value);

    if (!slug || slug === makeSlug(name)) {
      setSlug(makeSlug(value));
    }
  }

  function usePreset(category: {
    name: string;
    slug: string;
    icon: string;
  }) {
    setName(category.name);
    setSlug(category.slug);
    setIcon(category.icon);
  }

  async function saveCategory() {
    const cleanName = name.trim();
    const cleanSlug = makeSlug(slug || name);

    if (!cleanName) {
      alert("Please enter category name.");
      return;
    }

    if (!cleanSlug) {
      alert("Please enter a valid category slug.");
      return;
    }

    setSaving(true);

    try {
      const { data: existing, error: checkError } = await supabase
        .from("categories")
        .select("id")
        .or(`name.ilike.${cleanName},slug.eq.${cleanSlug}`)
        .limit(1);

      if (checkError) {
        console.error("CHECK CATEGORY ERROR:", checkError);
        alert(checkError.message);
        return;
      }

      if (existing && existing.length > 0) {
        alert("This category already exists.");
        return;
      }

      const { error } = await supabase.from("categories").insert({
        name: cleanName,
        slug: cleanSlug,
        icon: icon || "🐱",
      });

      if (error) {
        console.error("ADD CATEGORY ERROR:", error);
        alert(error.message);
        return;
      }

      alert("Category added successfully!");

      router.push("/admin/categories");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-zinc-950">
      {/* Header */}
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6 lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#d4a017]">
              CATS HOME. Admin
            </p>

            <h1 className="mt-1 text-3xl font-black">
              Add Category
            </h1>

            <p className="mt-1 text-sm text-black/50">
              Create a new category for your cat store.
            </p>
          </div>

          <Link
            href="/admin/categories"
            className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-bold transition hover:bg-black hover:text-white"
          >
            ← Back to Categories
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 py-8 lg:px-8">
        {/* Preset Categories */}
        <div className="mb-6 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black">
            Cat Store Categories
          </h2>

          <p className="mt-1 text-sm text-black/50">
            Click a category to automatically fill the form.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CAT_CATEGORIES.map((category) => (
              <button
                key={category.slug}
                type="button"
                onClick={() => usePreset(category)}
                className="flex items-center gap-3 rounded-2xl border border-black/10 p-4 text-left transition hover:-translate-y-0.5 hover:border-[#d4a017] hover:shadow-md"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f7f7f5] text-2xl">
                  {category.icon}
                </span>

                <div>
                  <p className="font-black">
                    {category.name}
                  </p>

                  <p className="text-xs text-black/40">
                    {category.slug}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">
            Category Information
          </h2>

          <div className="mt-6 grid gap-5">
            {/* Name */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                Category Name
              </label>

              <input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Cat Food"
                className="w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 outline-none transition focus:border-[#d4a017]"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                Slug
              </label>

              <input
                value={slug}
                onChange={(e) => setSlug(makeSlug(e.target.value))}
                placeholder="cat-food"
                className="w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 outline-none transition focus:border-[#d4a017]"
              />

              <p className="mt-2 text-xs text-black/40">
                Example: /category/cat-food
              </p>
            </div>

            {/* Icon */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                Icon
              </label>

              <div className="flex gap-3">
                <input
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  maxLength={4}
                  className="w-24 rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 text-center text-2xl outline-none focus:border-[#d4a017]"
                />

                <div className="flex flex-wrap gap-2">
                  {["🐱", "🥫", "🪣", "🧶", "🎀", "🪮", "🔥", "🏷️"].map(
                    (emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setIcon(emoji)}
                        className="h-12 w-12 rounded-xl border border-black/10 bg-white text-xl transition hover:border-[#d4a017]"
                      >
                        {emoji}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-2xl border border-black/10 bg-[#f7f7f5] p-5">
              <p className="mb-3 text-xs font-black uppercase tracking-wider text-black/40">
                Preview
              </p>

              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
                  {icon || "🐱"}
                </div>

                <div>
                  <h3 className="text-lg font-black">
                    {name || "Category Name"}
                  </h3>

                  <p className="text-sm text-black/40">
                    /category/{slug || "category-slug"}
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <button
                type="button"
                onClick={saveCategory}
                disabled={saving}
                className="flex-1 rounded-xl bg-black px-5 py-4 text-sm font-black text-white transition hover:bg-[#d4a017] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "✓ Save Category"}
              </button>

              <Link
                href="/admin/categories"
                className="flex items-center justify-center rounded-xl border border-black/10 bg-white px-6 py-4 text-sm font-bold transition hover:bg-black hover:text-white"
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
