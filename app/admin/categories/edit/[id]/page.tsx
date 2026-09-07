"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Category = {
  id: number | string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  image_url: string | null;
};

type Product = {
  id: number | string;
  title: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  regular_price: number | null;
  discount: number | null;
};

const PRESET_CATEGORIES = [
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

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getProductImage(product: Product) {
  return product.image_url || "";
}

export default function EditCategoryPage() {
  const params = useParams();
  const router = useRouter();

  const rawId = params?.id;

  const routeValue = Array.isArray(rawId)
    ? rawId[0]
    : String(rawId || "");

  const isAddMode =
    routeValue.toLowerCase() === "add";

  const [category, setCategory] =
    useState<Category | null>(null);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("🐱");
  const [description, setDescription] =
    useState("");

  const [imageUrl, setImageUrl] =
    useState("");

  const [uploadingImage, setUploadingImage] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [
    slugManuallyChanged,
    setSlugManuallyChanged,
  ] = useState(false);

  // =========================================================
  // LOAD CATEGORY
  // =========================================================

  async function loadCategory() {
    setLoading(true);

    try {
      if (isAddMode) {
        setCategory(null);
        setProducts([]);
        setName("");
        setSlug("");
        setIcon("🐱");
        setDescription("");
        setImageUrl("");
        setSlugManuallyChanged(false);
        setLoading(false);
        return;
      }

      if (!routeValue) {
        setCategory(null);
        setProducts([]);
        setLoading(false);
        return;
      }

      let foundCategory: Category | null =
        null;

      // Find by slug
      const {
        data: slugData,
        error: slugError,
      } = await supabase
        .from("categories")
        .select(
          "id,name,slug,icon,description,image_url"
        )
        .eq("slug", routeValue)
        .maybeSingle();

      if (slugError) {
        console.error(
          "CATEGORY SLUG ERROR:",
          slugError
        );
      }

      if (slugData) {
        foundCategory =
          slugData as Category;
      }

      // Find by numeric ID
      if (
        !foundCategory &&
        /^\d+$/.test(routeValue)
      ) {
        const {
          data: idData,
          error: idError,
        } = await supabase
          .from("categories")
          .select(
            "id,name,slug,icon,description,image_url"
          )
          .eq("id", Number(routeValue))
          .maybeSingle();

        if (idError) {
          console.error(
            "CATEGORY ID ERROR:",
            idError
          );
        }

        if (idData) {
          foundCategory =
            idData as Category;
        }
      }

      if (!foundCategory) {
        setCategory(null);
        setProducts([]);
        setLoading(false);
        return;
      }

      setCategory(foundCategory);

      setName(
        foundCategory.name || ""
      );

      setSlug(
        foundCategory.slug || ""
      );

      setIcon(
        foundCategory.icon || "🐱"
      );

      setDescription(
        foundCategory.description || ""
      );

      setImageUrl(
        foundCategory.image_url || ""
      );

      setSlugManuallyChanged(true);

      // Load products
      const possibleCategories =
        Array.from(
          new Set(
            [
              foundCategory.name,
              foundCategory.slug,
            ].filter(Boolean)
          )
        );

      if (possibleCategories.length > 0) {
        const {
          data: productData,
          error: productError,
        } = await supabase
          .from("products")
          .select(
            "id,title,description,category,image_url,regular_price,discount"
          )
          .in(
            "category",
            possibleCategories
          )
          .order("id", {
            ascending: false,
          });

        if (productError) {
          console.error(
            "CATEGORY PRODUCTS ERROR:",
            productError
          );

          setProducts([]);
        } else {
          setProducts(
            (productData ||
              []) as Product[]
          );
        }
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error(
        "LOAD CATEGORY ERROR:",
        error
      );

      setCategory(null);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategory();
  }, [routeValue]);

  // =========================================================
  // NAME
  // =========================================================

  function handleNameChange(
    value: string
  ) {
    setName(value);

    if (!slugManuallyChanged) {
      setSlug(makeSlug(value));
    }
  }

  // =========================================================
  // PRESET
  // =========================================================

  function selectPreset(preset: {
    name: string;
    slug: string;
    icon: string;
  }) {
    setName(preset.name);
    setSlug(preset.slug);
    setIcon(preset.icon);
    setSlugManuallyChanged(true);
  }

  // =========================================================
  // UPLOAD IMAGE + DIRECT DATABASE UPDATE
  // =========================================================

  async function uploadCategoryImage(
    file: File
  ) {
    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert(
        "Please select a JPG, PNG or WebP image."
      );
      return;
    }

    const maxSize =
      5 * 1024 * 1024;

    if (file.size > maxSize) {
      alert(
        "Image size must be less than 5 MB."
      );
      return;
    }

    /*
     * Add mode:
     * image cannot be connected to a category
     * until the category exists.
     */
    if (isAddMode) {
      alert(
        "First create the category, then upload/change its image."
      );
      return;
    }

    if (!category) {
      alert(
        "Category not loaded yet."
      );
      return;
    }

    setUploadingImage(true);

    try {
      // =====================================================
      // 1. CREATE UNIQUE FILE NAME
      // =====================================================

      const fileExtension =
        file.name
          .split(".")
          .pop()
          ?.toLowerCase() || "jpg";

      const safeSlug =
        makeSlug(
          slug ||
            name ||
            category.slug ||
            "category"
        ) || "category";

      const uniqueFileName =
        `${safeSlug}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}.${fileExtension}`;

      const filePath =
        `categories/${uniqueFileName}`;

      console.log(
        "Uploading image:",
        filePath
      );

      // =====================================================
      // 2. UPLOAD TO STORAGE
      // =====================================================

      const {
        error: uploadError,
      } = await supabase.storage
        .from("category-images")
        .upload(
          filePath,
          file,
          {
            cacheControl: "3600",
            upsert: false,
            contentType:
              file.type,
          }
        );

      if (uploadError) {
        console.error(
          "STORAGE UPLOAD ERROR:",
          uploadError
        );

        alert(
          `Image upload failed:\n${uploadError.message}`
        );

        return;
      }

      // =====================================================
      // 3. GET PUBLIC URL
      // =====================================================

      const {
        data: publicUrlData,
      } = supabase.storage
        .from("category-images")
        .getPublicUrl(
          filePath
        );

      const publicUrl =
        publicUrlData?.publicUrl;

      if (!publicUrl) {
        alert(
          "Image uploaded, but public URL could not be created."
        );
        return;
      }

      console.log(
        "PUBLIC IMAGE URL:",
        publicUrl
      );

      // =====================================================
      // 4. IMPORTANT:
      // UPDATE DATABASE IMMEDIATELY
      // =====================================================

      const {
        data: updatedCategory,
        error: dbUpdateError,
      } = await supabase
        .from("categories")
        .update({
          image_url: publicUrl,
        })
        .eq("id", category.id)
        .select(
          "id,name,slug,icon,description,image_url"
        )
        .maybeSingle();

      if (dbUpdateError) {
        console.error(
          "DATABASE IMAGE UPDATE ERROR:",
          dbUpdateError
        );

        alert(
          `Image uploaded to Storage, but database update failed:\n\n${dbUpdateError.message}\n\nCheck your Supabase RLS policy for the categories table.`
        );

        return;
      }

      // =====================================================
      // 5. VERIFY DATABASE REALLY UPDATED
      // =====================================================

      if (!updatedCategory) {
        console.error(
          "DATABASE UPDATE RETURNED NO ROW"
        );

        alert(
          "Image uploaded, but the category database row was NOT updated.\n\nThis usually means your Supabase RLS UPDATE policy is blocking the update."
        );

        return;
      }

      console.log(
        "DATABASE UPDATED:",
        updatedCategory
      );

      // =====================================================
      // 6. UPDATE LOCAL STATE
      // =====================================================

      setImageUrl(
        updatedCategory.image_url ||
          publicUrl
      );

      setCategory(
        updatedCategory as Category
      );

      // =====================================================
      // SUCCESS
      // =====================================================

      alert(
        "✅ Category image changed successfully!"
      );

    } catch (error) {
      console.error(
        "IMAGE CHANGE ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong while changing the image."
      );
    } finally {
      setUploadingImage(false);
    }
  }

  // =========================================================
  // SAVE CATEGORY
  // =========================================================

  async function saveCategory() {
    const cleanName =
      name.trim();

    const cleanSlug =
      makeSlug(slug || name);

    const cleanIcon =
      icon.trim() || "🐱";

    const cleanDescription =
      description.trim();

    const cleanImageUrl =
      imageUrl.trim();

    if (!cleanName) {
      alert(
        "Please enter category name."
      );
      return;
    }

    if (!cleanSlug) {
      alert(
        "Please enter a valid category slug."
      );
      return;
    }

    setSaving(true);

    try {
      // =====================================================
      // ADD MODE
      // =====================================================

      if (isAddMode) {
        const {
          data: slugExists,
          error: slugCheckError,
        } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", cleanSlug)
          .limit(1);

        if (slugCheckError) {
          alert(
            slugCheckError.message
          );
          return;
        }

        if (
          slugExists &&
          slugExists.length > 0
        ) {
          alert(
            `Category slug "${cleanSlug}" already exists.`
          );
          return;
        }

        const {
          data: nameExists,
          error: nameCheckError,
        } = await supabase
          .from("categories")
          .select("id")
          .ilike(
            "name",
            cleanName
          )
          .limit(1);

        if (nameCheckError) {
          alert(
            nameCheckError.message
          );
          return;
        }

        if (
          nameExists &&
          nameExists.length > 0
        ) {
          alert(
            `Category "${cleanName}" already exists.`
          );
          return;
        }

        const {
          data: insertedCategory,
          error: insertError,
        } = await supabase
          .from("categories")
          .insert({
            name: cleanName,
            slug: cleanSlug,
            icon: cleanIcon,
            description:
              cleanDescription ||
              null,
            image_url:
              cleanImageUrl ||
              null,
          })
          .select(
            "id,name,slug,icon,description,image_url"
          )
          .maybeSingle();

        if (insertError) {
          console.error(
            "ADD CATEGORY ERROR:",
            insertError
          );

          alert(
            insertError.message
          );

          return;
        }

        if (!insertedCategory) {
          alert(
            "Category was not created. Check your Supabase INSERT policy."
          );
          return;
        }

        alert(
          "Category added successfully!"
        );

        router.push(
          "/admin/categories"
        );

        router.refresh();

        return;
      }

      // =====================================================
      // EDIT MODE
      // =====================================================

      if (!category) {
        alert(
          "Category not found."
        );
        return;
      }

      // =====================================================
      // DUPLICATE NAME
      // =====================================================

      const {
        data: sameName,
        error: sameNameError,
      } = await supabase
        .from("categories")
        .select("id")
        .ilike(
          "name",
          cleanName
        )
        .neq(
          "id",
          category.id
        )
        .limit(1);

      if (sameNameError) {
        alert(
          sameNameError.message
        );
        return;
      }

      if (
        sameName &&
        sameName.length > 0
      ) {
        alert(
          `Another category already uses "${cleanName}".`
        );
        return;
      }

      // =====================================================
      // DUPLICATE SLUG
      // =====================================================

      if (
        cleanSlug !== category.slug
      ) {
        const {
          data: sameSlug,
          error: sameSlugError,
        } = await supabase
          .from("categories")
          .select("id")
          .eq(
            "slug",
            cleanSlug
          )
          .neq(
            "id",
            category.id
          )
          .limit(1);

        if (sameSlugError) {
          alert(
            sameSlugError.message
          );
          return;
        }

        if (
          sameSlug &&
          sameSlug.length > 0
        ) {
          alert(
            `Another category already uses "${cleanSlug}".`
          );
          return;
        }
      }

      // =====================================================
      // UPDATE CATEGORY
      // =====================================================

      const {
        data: updatedCategory,
        error: updateError,
      } = await supabase
        .from("categories")
        .update({
          name: cleanName,
          slug: cleanSlug,
          icon: cleanIcon,
          description:
            cleanDescription ||
            null,
          image_url:
            cleanImageUrl ||
            null,
        })
        .eq(
          "id",
          category.id
        )
        .select(
          "id,name,slug,icon,description,image_url"
        )
        .maybeSingle();

      if (updateError) {
        console.error(
          "UPDATE CATEGORY ERROR:",
          updateError
        );

        alert(
          `Category update failed:\n\n${updateError.message}`
        );

        return;
      }

      // VERY IMPORTANT
      if (!updatedCategory) {
        alert(
          "Category update returned no row.\n\nYour Supabase RLS UPDATE policy is probably blocking this update."
        );

        return;
      }

      // =====================================================
      // UPDATE PRODUCTS
      // =====================================================

      const oldCategoryValues =
        Array.from(
          new Set(
            [
              category.name,
              category.slug,
            ].filter(Boolean)
          )
        );

      if (
        oldCategoryValues.length >
          0 &&
        (
          cleanName !==
            category.name ||
          cleanSlug !==
            category.slug
        )
      ) {
        const {
          error:
            productUpdateError,
        } = await supabase
          .from("products")
          .update({
            category: cleanName,
          })
          .in(
            "category",
            oldCategoryValues
          );

        if (productUpdateError) {
          console.error(
            "PRODUCT CATEGORY UPDATE ERROR:",
            productUpdateError
          );

          alert(
            `Category updated, but product categories could not be updated.\n\n${productUpdateError.message}`
          );
        }
      }

      setCategory(
        updatedCategory as Category
      );

      setName(
        updatedCategory.name
      );

      setSlug(
        updatedCategory.slug
      );

      setIcon(
        updatedCategory.icon ||
          "🐱"
      );

      setDescription(
        updatedCategory.description ||
          ""
      );

      setImageUrl(
        updatedCategory.image_url ||
          ""
      );

      alert(
        "✅ Category updated successfully!"
      );

      router.push(
        "/admin/categories"
      );

      router.refresh();

    } catch (error) {
      console.error(
        "SAVE CATEGORY ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  // =========================================================
  // DELETE
  // =========================================================

  async function deleteCategory() {
    if (!category) return;

    if (products.length > 0) {
      alert(
        `You cannot delete "${category.name}" because it has ${products.length} product(s).`
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${category.name}"?`
      );

    if (!confirmed) return;

    setDeleting(true);

    try {
      const {
        error: deleteError,
      } = await supabase
        .from("categories")
        .delete()
        .eq(
          "id",
          category.id
        );

      if (deleteError) {
        alert(
          deleteError.message
        );
        return;
      }

      alert(
        "Category deleted successfully."
      );

      router.push(
        "/admin/categories"
      );

      router.refresh();

    } catch (error) {
      console.error(
        "DELETE CATEGORY ERROR:",
        error
      );

      alert(
        "Something went wrong."
      );
    } finally {
      setDeleting(false);
    }
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-black/10 border-t-[#d4a017]" />

          <p className="mt-4 text-sm font-bold text-black/50">
            Loading category...
          </p>
        </div>
      </main>
    );
  }

  // =========================================================
  // NOT FOUND
  // =========================================================

  if (
    !isAddMode &&
    !category
  ) {
    return (
      <main className="min-h-screen bg-[#f7f7f5] text-zinc-950">
        <header className="border-b border-black/10 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#d4a017]">
                CATS HOME. Admin
              </p>

              <h1 className="mt-1 text-3xl font-black">
                Category
              </h1>
            </div>

            <Link
              href="/admin/categories"
              className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-bold transition hover:bg-black hover:text-white"
            >
              ← Categories
            </Link>
          </div>
        </header>

        <section className="mx-auto max-w-3xl px-5 py-16">
          <div className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <div className="text-5xl">
              😿
            </div>

            <h2 className="mt-4 text-2xl font-black">
              Category not found
            </h2>

            <p className="mt-2 text-sm text-black/50">
              Route value:
            </p>

            <p className="mt-1 rounded-xl bg-[#f7f7f5] px-4 py-3 font-mono text-sm">
              {routeValue ||
                "(empty)"}
            </p>

            <Link
              href="/admin/categories"
              className="mt-6 inline-flex rounded-xl bg-black px-5 py-3 text-sm font-black text-white transition hover:bg-[#d4a017]"
            >
              Back to Categories
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // =========================================================
  // MAIN
  // =========================================================

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-zinc-950">

      {/* HEADER */}
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#d4a017]">
              CATS HOME. Admin
            </p>

            <h1 className="mt-1 text-3xl font-black">
              {isAddMode
                ? "Add Category"
                : "Edit Category"}
            </h1>

            <p className="mt-1 text-sm text-black/50">
              {isAddMode
                ? "Create a new category for your cat store."
                : `Manage ${
                    category?.name ||
                    "category"
                  }.`}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/categories"
              className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-bold transition hover:bg-black hover:text-white"
            >
              ← Categories
            </Link>

            {!isAddMode &&
              category && (
                <Link
                  href={`/category/${encodeURIComponent(
                    category.slug
                  )}`}
                  target="_blank"
                  className="rounded-xl bg-black px-4 py-3 text-sm font-black text-white transition hover:bg-[#d4a017]"
                >
                  View Category
                </Link>
              )}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-8 lg:px-8">

        {/* PRESETS */}
        {isAddMode && (
          <div className="mb-6 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black">
              Cat Store Categories
            </h2>

            <p className="mt-1 text-sm text-black/50">
              Select a category to automatically fill the form.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PRESET_CATEGORIES.map(
                (preset) => (
                  <button
                    key={preset.slug}
                    type="button"
                    onClick={() =>
                      selectPreset(
                        preset
                      )
                    }
                    className="flex items-center gap-3 rounded-2xl border border-black/10 p-4 text-left transition hover:-translate-y-0.5 hover:border-[#d4a017] hover:shadow-md"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f7f7f5] text-2xl">
                      {preset.icon}
                    </div>

                    <div>
                      <p className="font-black">
                        {preset.name}
                      </p>

                      <p className="text-xs text-black/40">
                        {preset.slug}
                      </p>
                    </div>
                  </button>
                )
              )}
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">

          {/* =====================================================
              FORM
          ===================================================== */}

          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">

            <h2 className="text-xl font-black">
              Category Information
            </h2>

            <div className="mt-6 space-y-5">

              {/* NAME */}
              <div>
                <label className="mb-2 block text-sm font-bold">
                  Category Name
                </label>

                <input
                  value={name}
                  onChange={(e) =>
                    handleNameChange(
                      e.target.value
                    )
                  }
                  placeholder="Cat Food"
                  className="w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 outline-none transition focus:border-[#d4a017]"
                />
              </div>

              {/* SLUG */}
              <div>
                <label className="mb-2 block text-sm font-bold">
                  Slug
                </label>

                <input
                  value={slug}
                  onChange={(e) => {
                    setSlug(
                      makeSlug(
                        e.target.value
                      )
                    );

                    setSlugManuallyChanged(
                      true
                    );
                  }}
                  placeholder="cat-food"
                  className="w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 font-mono outline-none transition focus:border-[#d4a017]"
                />

                <p className="mt-2 text-xs text-black/40">
                  URL: /category/
                  {slug ||
                    "category-slug"}
                </p>
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="mb-2 block text-sm font-bold">
                  Category Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(
                      e.target.value
                    )
                  }
                  rows={4}
                  placeholder="Nutritious everyday food for happy and healthy cats."
                  className="w-full resize-none rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#d4a017]"
                />
              </div>

              {/* =================================================
                  IMAGE
              ================================================= */}

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Category Picture
                </label>

                <label
                  className={`flex cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-black/10 bg-[#fafafa] px-5 py-6 text-center transition ${
                    uploadingImage
                      ? "cursor-not-allowed opacity-60"
                      : "hover:border-[#d4a017] hover:bg-[#fffaf0]"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    className="hidden"
                    disabled={
                      uploadingImage ||
                      isAddMode
                    }
                    onChange={(e) => {
                      const file =
                        e.target.files?.[0];

                      if (file) {
                        uploadCategoryImage(
                          file
                        );
                      }

                      e.currentTarget.value =
                        "";
                    }}
                  />

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-xl text-white">
                    {uploadingImage
                      ? "⏳"
                      : "📤"}
                  </div>

                  <div className="text-left">
                    <p className="font-black">
                      {uploadingImage
                        ? "Uploading & Saving..."
                        : isAddMode
                        ? "Save Category First"
                        : "Upload / Change Image"}
                    </p>

                    <p className="mt-1 text-xs text-black/40">
                      JPG, PNG or WebP • Max 5 MB
                    </p>
                  </div>
                </label>

                {imageUrl && (
                  <div className="mt-3 rounded-xl bg-[#f7f7f5] px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-black/40">
                      Current Image URL
                    </p>

                    <p className="mt-1 truncate font-mono text-xs text-black/50">
                      {imageUrl}
                    </p>
                  </div>
                )}

                {/* PREVIEW */}
                <div className="mt-4 overflow-hidden rounded-2xl border border-black/10 bg-[#f7f7f5]">
                  {imageUrl.trim() ? (
                    <img
                      key={imageUrl}
                      src={imageUrl}
                      alt={
                        name ||
                        "Category preview"
                      }
                      className="h-64 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-64 items-center justify-center">
                      <div className="text-center">
                        <div className="text-6xl">
                          {icon ||
                            "🐱"}
                        </div>

                        <p className="mt-3 text-sm font-bold text-black/40">
                          No category image added
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ICON */}
              <div>
                <label className="mb-2 block text-sm font-bold">
                  Icon
                </label>

                <div className="flex flex-wrap gap-2">
                  {[
                    "🐱",
                    "🥫",
                    "🪣",
                    "🧶",
                    "🎀",
                    "🪮",
                  ].map(
                    (emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() =>
                          setIcon(
                            emoji
                          )
                        }
                        className={`flex h-12 w-12 items-center justify-center rounded-xl border text-xl transition ${
                          icon === emoji
                            ? "border-[#d4a017] bg-[#fff8df]"
                            : "border-black/10 bg-white hover:border-[#d4a017]"
                        }`}
                      >
                        {emoji}
                      </button>
                    )
                  )}
                </div>

                <input
                  value={icon}
                  onChange={(e) =>
                    setIcon(
                      e.target.value
                    )
                  }
                  placeholder="🐱"
                  maxLength={4}
                  className="mt-3 w-24 rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 text-center text-2xl outline-none focus:border-[#d4a017]"
                />
              </div>

              {/* PREVIEW */}
              <div className="rounded-2xl border border-black/10 bg-[#f7f7f5] p-5">
                <p className="text-xs font-black uppercase tracking-wider text-black/40">
                  Category Preview
                </p>

                <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm">

                  <div className="h-48 bg-[#eeeae1]">
                    {imageUrl.trim() ? (
                      <img
                        key={imageUrl}
                        src={imageUrl}
                        alt={
                          name ||
                          "Category"
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-6xl">
                        {icon ||
                          "🐱"}
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f7f7f5] text-xl">
                        {icon ||
                          "🐱"}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-black">
                          {name ||
                            "Category Name"}
                        </h3>

                        <p className="text-xs text-black/40">
                          /category/
                          {slug ||
                            "category-slug"}
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-black/50">
                      {description ||
                        "Premium essentials for your cat."}
                    </p>
                  </div>
                </div>
              </div>

              {/* SAVE */}
              <div className="flex flex-col gap-3 pt-2 sm:flex-row">

                <button
                  type="button"
                  onClick={
                    saveCategory
                  }
                  disabled={
                    saving ||
                    deleting ||
                    uploadingImage
                  }
                  className="flex-1 rounded-xl bg-black px-5 py-4 text-sm font-black text-white transition hover:bg-[#d4a017] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : isAddMode
                    ? "✓ Add Category"
                    : "✓ Save Changes"}
                </button>

                <Link
                  href="/admin/categories"
                  className="flex items-center justify-center rounded-xl border border-black/10 bg-white px-6 py-4 text-sm font-bold transition hover:bg-black hover:text-white"
                >
                  Cancel
                </Link>

              </div>

              {/* DELETE */}
              {!isAddMode &&
                category && (
                  <div className="mt-8 border-t border-black/10 pt-6">
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-5">

                      <h3 className="font-black text-red-700">
                        Delete Category
                      </h3>

                      <p className="mt-1 text-sm text-red-600/70">
                        You can only delete a category when it has no products.
                      </p>

                      <button
                        type="button"
                        onClick={
                          deleteCategory
                        }
                        disabled={
                          deleting ||
                          saving ||
                          uploadingImage ||
                          products.length >
                            0
                        }
                        className="mt-4 rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {deleting
                          ? "Deleting..."
                          : products.length >
                            0
                          ? `Delete Disabled (${products.length} Products)`
                          : "Delete Category"}
                      </button>

                    </div>
                  </div>
                )}

            </div>
          </div>

          {/* =====================================================
              RIGHT SIDE
          ===================================================== */}

          <div className="space-y-6">

            {/* IMAGE SUMMARY */}
            <div className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">

              <div className="h-56 bg-[#eeeae1]">
                {imageUrl.trim() ? (
                  <img
                    key={imageUrl}
                    src={imageUrl}
                    alt={
                      name ||
                      "Category image"
                    }
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-7xl">
                    {icon ||
                      "🐱"}
                  </div>
                )}
              </div>

              <div className="p-6">

                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#d4a017]">
                  Category Picture
                </p>

                <h3 className="mt-2 text-xl font-black">
                  {name ||
                    "New Category"}
                </h3>

                <p className="mt-1 text-sm text-black/40">
                  Upload a new image to change this category picture.
                </p>

              </div>
            </div>

            {/* SUMMARY */}
            <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">

              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#d4a017]">
                Category
              </p>

              <div className="mt-5 flex items-center gap-4">

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f7f7f5] text-3xl">
                  {icon ||
                    "🐱"}
                </div>

                <div className="min-w-0">
                  <h3 className="truncate text-xl font-black">
                    {name ||
                      "New Category"}
                  </h3>

                  <p className="truncate text-sm text-black/40">
                    {slug ||
                      "category-slug"}
                  </p>
                </div>

              </div>

              {!isAddMode && (
                <div className="mt-5 rounded-2xl bg-[#f7f7f5] p-4">

                  <p className="text-xs font-bold uppercase tracking-wider text-black/40">
                    Products
                  </p>

                  <p className="mt-1 text-3xl font-black">
                    {
                      products.length
                    }
                  </p>

                </div>
              )}

            </div>

            {/* PRODUCTS */}
            {!isAddMode && (
              <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>
                    <h2 className="text-lg font-black">
                      Products
                    </h2>

                    <p className="text-xs text-black/40">
                      Products in this category
                    </p>
                  </div>

                  <span className="rounded-full bg-[#f7f7f5] px-3 py-1 text-xs font-black">
                    {
                      products.length
                    }
                  </span>

                </div>

                {products.length ===
                0 ? (
                  <div className="mt-5 rounded-2xl bg-[#f7f7f5] p-5 text-center">

                    <div className="text-3xl">
                      📦
                    </div>

                    <p className="mt-2 text-sm font-bold">
                      No products found
                    </p>

                    <p className="mt-1 text-xs text-black/40">
                      Products assigned to this category will appear here.
                    </p>

                  </div>
                ) : (
                  <div className="mt-5 space-y-3">

                    {products.map(
                      (product) => {
                        const image =
                          getProductImage(
                            product
                          );

                        return (
                          <div
                            key={
                              product.id
                            }
                            className="flex items-center gap-3 rounded-2xl border border-black/10 p-3"
                          >

                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#f7f7f5]">

                              {image ? (
                                <img
                                  src={
                                    image
                                  }
                                  alt={
                                    product.title
                                  }
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xl">
                                  🐱
                                </div>
                              )}

                            </div>

                            <div className="min-w-0 flex-1">

                              <p className="truncate text-sm font-black">
                                {
                                  product.title
                                }
                              </p>

                              <p className="mt-1 text-xs text-black/40">
                                {
                                  product.category
                                }
                              </p>

                              {product.regular_price !=
                                null && (
                                <p className="mt-1 text-xs font-bold">
                                  ৳
                                  {Number(
                                    product.regular_price
                                  ).toLocaleString()}
                                </p>
                              )}

                              {product.discount !=
                                null &&
                                Number(
                                  product.discount
                                ) >
                                  0 && (
                                  <p className="text-[11px] text-green-600">
                                    {
                                      product.discount
                                    }
                                    % discount
                                  </p>
                                )}

                            </div>

                            <Link
                              href={`/admin/products/edit/${product.id}?from=category&category=${encodeURIComponent(
                                category?.slug ||
                                  ""
                              )}`}
                              className="shrink-0 rounded-lg border border-black/10 px-3 py-2 text-xs font-black transition hover:bg-black hover:text-white"
                            >
                              Edit
                            </Link>

                          </div>
                        );
                      }
                    )}

                  </div>
                )}

              </div>
            )}

          </div>

        </div>
      </section>
    </main>
  );
}