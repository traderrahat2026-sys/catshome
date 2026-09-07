"use client";

import {
  ChangeEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Product = {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  image_urls: string[] | null;
  regular_price: number | null;
  discount: number | null;
  offer_price: number | null;
  stock: number | null;
  has_colours: boolean | null;
  colours: string[] | null;
  has_sizes: boolean | null;
  sizes: string[] | null;
  is_gadget: boolean | null;
  is_hot_sale: boolean | null;
  is_offer: boolean | null;
  created_at: string | null;
  updated_at?: string | null;
};

type ProductForm = {
  title: string;
  description: string;
  category: string;
  regular_price: string;
  discount: string;
  stock: string;
  has_colours: boolean;
  colours: string[];
  has_sizes: boolean;
  sizes: string[];
  is_gadget: boolean;
  is_hot_sale: boolean;
  is_offer: boolean;
};

const CATEGORIES = [
  "Gadgets",
  "Fashion",
  "Footwear",
  "Accessories",
  "Watches",
];

const SIZES = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "XXXL",
];

function createEmptyForm(): ProductForm {
  return {
    title: "",
    description: "",
    category: "",
    regular_price: "",
    discount: "",
    stock: "",
    has_colours: false,
    colours: [],
    has_sizes: false,
    sizes: [],
    is_gadget: false,
    is_hot_sale: false,
    is_offer: false,
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (typeof error === "object" && error !== null) {
    const err = error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };

    if (err.message) {
      return err.code
        ? `${err.message} (Code: ${err.code})`
        : err.message;
    }

    if (err.details) return err.details;
    if (err.hint) return err.hint;

    if (err.code) {
      return `Database error (Code: ${err.code})`;
    }
  }

  return "Something went wrong. Please try again.";
}

function formatPrice(value: number | null | undefined) {
  return `৳${Number(value ?? 0).toLocaleString("en-BD")}`;
}

function normalizeProduct(product: Product): Product {
  const imageUrls =
    Array.isArray(product.image_urls) &&
    product.image_urls.length > 0
      ? product.image_urls
      : product.image_url
        ? [product.image_url]
        : [];

  return {
    ...product,

    id: Number(product.id),

    title: product.title ?? "",
    description: product.description ?? "",
    category: product.category ?? "",

    regular_price: Number(product.regular_price ?? 0),
    discount: Number(product.discount ?? 0),
    offer_price: Number(product.offer_price ?? 0),
    stock: Number(product.stock ?? 0),

    has_colours: Boolean(product.has_colours),
    has_sizes: Boolean(product.has_sizes),

    is_gadget: Boolean(product.is_gadget),
    is_hot_sale: Boolean(product.is_hot_sale),
    is_offer: Boolean(product.is_offer),

    colours: Array.isArray(product.colours)
      ? [...product.colours]
      : [],

    sizes: Array.isArray(product.sizes)
      ? [...product.sizes]
      : [],

    image_urls: imageUrls,
  };
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);

  /*
   * IMPORTANT:
   * Keep editing ID separately.
   * This makes Add/Edit state reliable.
   */
  const [editingProductId, setEditingProductId] =
    useState<number | null>(null);

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [form, setForm] = useState<ProductForm>(
    createEmptyForm()
  );

  const [selectedFiles, setSelectedFiles] =
    useState<File[]>([]);

  const [previewImages, setPreviewImages] =
    useState<string[]>([]);

  const [existingImages, setExistingImages] =
    useState<string[]>([]);

  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [uploadingImages, setUploadingImages] =
    useState(false);

  const [search, setSearch] = useState("");

  const [categoryFilter, setCategoryFilter] =
    useState("All");

  const [message, setMessage] = useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [colourInput, setColourInput] =
    useState("");

  const isEditing =
    editingProductId !== null;

  const calculatedOfferPrice = useMemo(() => {
    const regular = Number(form.regular_price || 0);
    const discount = Number(form.discount || 0);

    if (regular <= 0) {
      return 0;
    }

    if (discount <= 0) {
      return regular;
    }

    return Math.max(
      0,
      regular - (regular * discount) / 100
    );
  }, [
    form.regular_price,
    form.discount,
  ]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const title =
        String(product.title ?? "").toLowerCase();

      const category =
        String(product.category ?? "").toLowerCase();

      const id = String(product.id);

      const matchesSearch =
        !query ||
        title.includes(query) ||
        category.includes(query) ||
        id.includes(query);

      const categories = String(
        product.category ?? ""
      )
        .split(/[,|/;\n]+/)
        .map((item) =>
          item.trim().toLowerCase()
        )
        .filter(Boolean);

      const matchesCategory =
        categoryFilter === "All" ||
        categories.includes(
          categoryFilter.toLowerCase()
        );

      return (
        matchesSearch &&
        matchesCategory
      );
    });
  }, [
    products,
    search,
    categoryFilter,
  ]);

  async function loadProducts() {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        "/api/admin/products",
        {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        }
      );

      const result =
        await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result?.error ||
            `Failed to load products. (${response.status})`
        );
      }

      const formatted: Product[] =
        Array.isArray(result?.products)
          ? result.products.map(
              (product: Product) =>
                normalizeProduct(product)
            )
          : [];

      setProducts(formatted);
    } catch (error: unknown) {
      console.error(
        "PRODUCT LOAD ERROR:",
        error
      );

      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function clearForm() {
    setForm(createEmptyForm());

    setSelectedFiles([]);
    setPreviewImages([]);
    setExistingImages([]);
    setColourInput("");
  }

  function openAddModal() {
    setEditingProductId(null);
    setEditingProduct(null);

    clearForm();

    setMessage("");
    setErrorMessage("");

    setModalOpen(true);
  }

  /*
   * ============================================================
   * EDIT MODAL
   * ============================================================
   */
  function openEditModal(product: Product) {
    console.log(
      "EDIT BUTTON CLICKED:",
      product
    );

    const normalized =
      normalizeProduct(product);

    const productId =
      Number(normalized.id);

    setMessage("");
    setErrorMessage("");

    /*
     * Set ID first.
     */
    setEditingProductId(productId);

    /*
     * Keep complete product object.
     */
    setEditingProduct({
      ...normalized,
    });

    /*
     * Load all fields into form.
     */
    setForm({
      title:
        normalized.title ?? "",

      description:
        normalized.description ?? "",

      category:
        normalized.category ?? "",

      regular_price:
        normalized.regular_price !== null &&
        normalized.regular_price !== undefined
          ? String(
              normalized.regular_price
            )
          : "",

      discount:
        normalized.discount !== null &&
        normalized.discount !== undefined
          ? String(
              normalized.discount
            )
          : "",

      stock:
        normalized.stock !== null &&
        normalized.stock !== undefined
          ? String(
              normalized.stock
            )
          : "",

      has_colours:
        Boolean(
          normalized.has_colours
        ),

      colours:
        Array.isArray(
          normalized.colours
        )
          ? [...normalized.colours]
          : [],

      has_sizes:
        Boolean(
          normalized.has_sizes
        ),

      sizes:
        Array.isArray(
          normalized.sizes
        )
          ? [...normalized.sizes]
          : [],

      is_gadget:
        Boolean(
          normalized.is_gadget
        ),

      is_hot_sale:
        Boolean(
          normalized.is_hot_sale
        ),

      is_offer:
        Boolean(
          normalized.is_offer
        ),
    });

    /*
     * Existing images.
     */
    const images =
      Array.isArray(
        normalized.image_urls
      )
        ? [...normalized.image_urls]
        : normalized.image_url
          ? [normalized.image_url]
          : [];

    setExistingImages(images);

    /*
     * New image selection starts empty.
     */
    setSelectedFiles([]);
    setPreviewImages([]);
    setColourInput("");

    /*
     * MOST IMPORTANT:
     * Open modal after setting edit state.
     */
    setModalOpen(true);
  }

  function closeModal() {
    if (
      saving ||
      uploadingImages
    ) {
      return;
    }

    setModalOpen(false);

    setEditingProductId(null);
    setEditingProduct(null);

    clearForm();
  }

  function updateField<
    K extends keyof ProductForm
  >(
    field: K,
    value: ProductForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(
      event.target.files ?? []
    );

    if (!files.length) {
      return;
    }

    setSelectedFiles((current) => [
      ...current,
      ...files,
    ]);

    const urls = files.map((file) =>
      URL.createObjectURL(file)
    );

    setPreviewImages((current) => [
      ...current,
      ...urls,
    ]);

    event.target.value = "";
  }

  function removeNewImage(index: number) {
    setPreviewImages((current) =>
      current.filter(
        (_, i) => i !== index
      )
    );

    setSelectedFiles((current) =>
      current.filter(
        (_, i) => i !== index
      )
    );
  }

  function removeExistingImage(index: number) {
    setExistingImages((current) =>
      current.filter(
        (_, i) => i !== index
      )
    );
  }

  async function uploadImages(
    files: File[]
  ): Promise<string[]> {
    if (!files.length) {
      return [];
    }

    setUploadingImages(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const extension =
          file.name.split(".").pop() ||
          "jpg";

        const safeName =
          file.name
            .replace(/\s+/g, "-")
            .replace(
              /[^a-zA-Z0-9._-]/g,
              ""
            );

        const fileName =
          `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 10)}-${safeName || `image.${extension}`}`;

        const filePath =
          `products/${fileName}`;

        const { error } =
          await supabase.storage
            .from("product-images")
            .upload(
              filePath,
              file,
              {
                cacheControl: "3600",
                upsert: false,
              }
            );

        if (error) {
          throw new Error(
            error.message ||
              "Product image upload failed."
          );
        }

        const { data } =
          supabase.storage
            .from("product-images")
            .getPublicUrl(
              filePath
            );

        if (!data?.publicUrl) {
          throw new Error(
            "Could not get public image URL."
          );
        }

        uploadedUrls.push(
          data.publicUrl
        );
      }

      return uploadedUrls;
    } finally {
      setUploadingImages(false);
    }
  }

  function addColour() {
    const value =
      colourInput.trim();

    if (!value) {
      return;
    }

    const alreadyExists =
      form.colours.some(
        (colour) =>
          colour.toLowerCase() ===
          value.toLowerCase()
      );

    if (alreadyExists) {
      setColourInput("");
      return;
    }

    setForm((current) => ({
      ...current,
      colours: [
        ...current.colours,
        value,
      ],
    }));

    setColourInput("");
  }

  function removeColour(
    colour: string
  ) {
    setForm((current) => ({
      ...current,
      colours:
        current.colours.filter(
          (item) =>
            item !== colour
        ),
    }));
  }

  function toggleSize(size: string) {
    setForm((current) => {
      const exists =
        current.sizes.includes(size);

      return {
        ...current,
        sizes: exists
          ? current.sizes.filter(
              (item) =>
                item !== size
            )
          : [
              ...current.sizes,
              size,
            ],
      };
    });
  }

  async function handleSave() {
    setMessage("");
    setErrorMessage("");

    const title =
      form.title.trim();

    const description =
      form.description.trim();

    const category =
      form.category.trim();

    const regularPrice =
      Number(
        form.regular_price
      );

    const discount =
      Number(
        form.discount || 0
      );

    const stock =
      Number(
        form.stock || 0
      );

    if (!title) {
      setErrorMessage(
        "Product title is required."
      );
      return;
    }

    if (!category) {
      setErrorMessage(
        "Please select a category."
      );
      return;
    }

    if (
      !Number.isFinite(
        regularPrice
      ) ||
      regularPrice <= 0
    ) {
      setErrorMessage(
        "Please enter a valid regular price."
      );
      return;
    }

    if (
      !Number.isFinite(
        discount
      ) ||
      discount < 0 ||
      discount > 100
    ) {
      setErrorMessage(
        "Discount must be between 0 and 100."
      );
      return;
    }

    if (
      !Number.isFinite(
        stock
      ) ||
      stock < 0
    ) {
      setErrorMessage(
        "Please enter a valid stock quantity."
      );
      return;
    }

    if (
      form.has_colours &&
      form.colours.length === 0
    ) {
      setErrorMessage(
        "Please add at least one colour."
      );
      return;
    }

    if (
      form.has_sizes &&
      form.sizes.length === 0
    ) {
      setErrorMessage(
        "Please select at least one size."
      );
      return;
    }

    /*
     * IMPORTANT:
     * Capture edit ID before async operations.
     */
    const editingId =
      editingProductId;

    setSaving(true);

    try {
      const calculatedPrice =
        Math.max(
          0,
          regularPrice -
            (regularPrice *
              discount) /
              100
        );

      /*
       * Upload newly selected images.
       */
      const newImageUrls =
        await uploadImages(
          selectedFiles
        );

      /*
       * Keep existing images + new images.
       */
      const finalImageUrls = [
        ...existingImages,
        ...newImageUrls,
      ];

      const mainImage =
        finalImageUrls[0] ?? "";

      const payload = {
        title,
        description,
        category,

        image_url:
          mainImage,

        image_urls:
          finalImageUrls,

        regular_price:
          regularPrice,

        discount,

        offer_price:
          calculatedPrice,

        stock,

        has_colours:
          Boolean(
            form.has_colours
          ),

        colours:
          form.has_colours
            ? [...form.colours]
            : [],

        has_sizes:
          Boolean(
            form.has_sizes
          ),

        sizes:
          form.has_sizes
            ? [...form.sizes]
            : [],

        is_gadget:
          Boolean(
            form.is_gadget
          ),

        is_hot_sale:
          Boolean(
            form.is_hot_sale
          ),

        is_offer:
          Boolean(
            form.is_offer
          ),

        updated_at:
          new Date().toISOString(),
      };

      /*
       * ==========================================================
       * UPDATE PRODUCT
       * ==========================================================
       */
      if (
        editingId !== null
      ) {
        console.log(
          "UPDATING PRODUCT ID:",
          editingId
        );

        const response =
          await fetch(
            "/api/admin/products",
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              credentials:
                "include",

              body: JSON.stringify({
                id: editingId,
                ...payload,
              }),
            }
          );

        const result =
          await response
            .json()
            .catch(
              () => ({})
            );

        if (!response.ok) {
          console.error(
            "PRODUCT UPDATE ERROR:",
            result
          );

          throw new Error(
            result?.error ||
              `Product update failed. (${response.status})`
          );
        }

        /*
         * Get fresh database data.
         */
        await loadProducts();

        setMessage(
          "Product updated successfully."
        );
      }

      /*
       * ==========================================================
       * ADD PRODUCT
       * ==========================================================
       */
      else {
        const response =
          await fetch(
            "/api/admin/products",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              credentials:
                "include",

              body: JSON.stringify(
                payload
              ),
            }
          );

        const result =
          await response
            .json()
            .catch(
              () => ({})
            );

        if (!response.ok) {
          console.error(
            "PRODUCT INSERT ERROR:",
            result
          );

          throw new Error(
            result?.error ||
              `Product save failed. (${response.status})`
          );
        }

        await loadProducts();

        setMessage(
          "Product added successfully."
        );
      }

      /*
       * Close after successful operation.
       */
      setModalOpen(false);
      setEditingProductId(null);
      setEditingProduct(null);

      clearForm();
    } catch (error: unknown) {
      console.error(
        "PRODUCT SAVE ERROR:",
        error
      );

      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(
    product: Product
  ) {
    const confirmed =
      window.confirm(
        `Delete "${product.title}"?\n\nThis action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(
      product.id
    );

    setMessage("");
    setErrorMessage("");

    try {
      const response =
        await fetch(
          `/api/admin/products?id=${product.id}`,
          {
            method: "DELETE",
            credentials:
              "include",
          }
        );

      const result =
        await response
          .json()
          .catch(
            () => ({})
          );

      if (!response.ok) {
        throw new Error(
          result?.error ||
            `Product delete failed. (${response.status})`
        );
      }

      setProducts(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              product.id
          )
      );

      setMessage(
        "Product deleted successfully."
      );
    } catch (error: unknown) {
      console.error(
        "PRODUCT DELETE ERROR:",
        error
      );

      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setDeletingId(null);
    }
  }

  const totalProducts =
    products.length;

  const totalStock =
    products.reduce(
      (sum, product) =>
        sum +
        Number(
          product.stock ?? 0
        ),
      0
    );

  const offerProducts =
    products.filter(
      (product) =>
        Boolean(
          product.is_offer
        )
    ).length;

  const hotSaleProducts =
    products.filter(
      (product) =>
        Boolean(
          product.is_hot_sale
        )
    ).length;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">

        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-zinc-500">
              <Link
                href="/admin"
                className="transition hover:text-white"
              >
                Admin
              </Link>

              <span>/</span>

              <span className="text-zinc-300">
                Products
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Products
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              Manage your CATS HOME store products,
              pricing, stock and product options.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-zinc-200 active:scale-[0.98]"
          >
            <span className="text-lg leading-none">
              +
            </span>
            Add Product
          </button>
        </div>

        {/* ALERTS */}
        {message && (
          <div className="mb-5 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm font-medium text-green-300">
            {message}
          </div>
        )}

        {errorMessage && !modalOpen && (
          <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">
            {errorMessage}
          </div>
        )}

        {/* STATS */}
        <div className="mb-7 grid grid-cols-2 gap-4 lg:grid-cols-4">

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Total Products
            </p>

            <p className="mt-2 text-3xl font-bold">
              {totalProducts}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Total Stock
            </p>

            <p className="mt-2 text-3xl font-bold">
              {totalStock}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Offers
            </p>

            <p className="mt-2 text-3xl font-bold">
              {offerProducts}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Hot Sale
            </p>

            <p className="mt-2 text-3xl font-bold">
              {hotSaleProducts}
            </p>
          </div>
        </div>

        {/* FILTERS */}
        <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="flex flex-col gap-3 md:flex-row">

            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                ⌕
              </span>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search by product name, category or ID..."
                className="h-12 w-full rounded-xl border border-zinc-800 bg-black pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-500"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(
                  event.target.value
                )
              }
              className="h-12 rounded-xl border border-zinc-800 bg-black px-4 text-sm text-white outline-none focus:border-zinc-500 md:w-56"
            >
              <option value="All">
                All Categories
              </option>

              {CATEGORIES.map(
                (category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                )
              )}
            </select>

            <button
              type="button"
              onClick={loadProducts}
              disabled={loading}
              className="h-12 rounded-xl border border-zinc-800 bg-zinc-900 px-5 text-sm font-semibold transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Loading..."
                : "Refresh"}
            </button>
          </div>
        </div>

        {/* PRODUCT LIST */}
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
                Loading products...
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">

              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-black text-2xl">
                □
              </div>

              <h2 className="text-lg font-semibold">
                No products found
              </h2>

              <p className="mt-2 max-w-md text-sm text-zinc-500">
                {search ||
                categoryFilter !==
                  "All"
                  ? "Try changing your search or category filter."
                  : "Add your first product to start building your store catalog."}
              </p>

              {!search &&
                categoryFilter ===
                  "All" && (
                  <button
                    type="button"
                    onClick={
                      openAddModal
                    }
                    className="mt-5 rounded-xl bg-white px-5 py-3 text-sm font-bold text-black hover:bg-zinc-200"
                  >
                    Add Product
                  </button>
                )}
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1100px] text-left">

                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/40">

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Product
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Category
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Price
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Stock
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Labels
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Actions
                      </th>

                    </tr>
                  </thead>

                  <tbody className="divide-y divide-zinc-900">

                    {filteredProducts.map(
                      (product) => {
                        const images =
                          Array.isArray(
                            product.image_urls
                          ) &&
                          product.image_urls.length
                            ? product.image_urls
                            : product.image_url
                              ? [
                                  product.image_url,
                                ]
                              : [];

                        return (
                          <tr
                            key={
                              product.id
                            }
                            className="transition hover:bg-zinc-900/30"
                          >

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-4">

                                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-zinc-800 bg-black">
                                  {images[0] ? (
                                    <img
                                      src={
                                        images[0]
                                      }
                                      alt={
                                        product.title
                                      }
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-xs text-zinc-600">
                                      No image
                                    </div>
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-white">
                                    {
                                      product.title
                                    }
                                  </p>

                                  <p className="mt-1 text-xs text-zinc-500">
                                    ID: #
                                    {
                                      product.id
                                    }
                                  </p>
                                </div>

                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <span className="rounded-lg border border-zinc-800 bg-black px-3 py-1.5 text-xs font-medium text-zinc-300">
                                {product.category ||
                                  "—"}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <div>
                                <p className="font-semibold text-white">
                                  {formatPrice(
                                    product.offer_price
                                  )}
                                </p>

                                {Number(
                                  product.discount ??
                                    0
                                ) > 0 && (
                                  <p className="mt-1 text-xs text-zinc-600 line-through">
                                    {formatPrice(
                                      product.regular_price
                                    )}
                                  </p>
                                )}
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={
                                  Number(
                                    product.stock ??
                                      0
                                  ) <= 0
                                    ? "rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400"
                                    : Number(
                                          product.stock ??
                                            0
                                        ) <= 5
                                      ? "rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-400"
                                      : "rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400"
                                }
                              >
                                {Number(
                                  product.stock ??
                                    0
                                ) <= 0
                                  ? "Out of stock"
                                  : `${Number(
                                      product.stock ??
                                        0
                                    )} in stock`}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex flex-wrap gap-1.5">

                                {product.is_hot_sale && (
                                  <span className="rounded-full bg-orange-500/10 px-2.5 py-1 text-[11px] font-semibold text-orange-400">
                                    Hot Sale
                                  </span>
                                )}

                                {product.is_offer && (
                                  <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-400">
                                    Offer
                                  </span>
                                )}

                                {product.is_gadget && (
                                  <span className="rounded-full bg-purple-500/10 px-2.5 py-1 text-[11px] font-semibold text-purple-400">
                                    Gadget
                                  </span>
                                )}

                                {!product.is_hot_sale &&
                                  !product.is_offer &&
                                  !product.is_gadget && (
                                    <span className="text-xs text-zinc-700">
                                      —
                                    </span>
                                  )}

                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex justify-end gap-2">

                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    openEditModal(
                                      product
                                    );
                                  }}
                                  onMouseDown={(event) => {
                                    event.stopPropagation();
                                  }}
                                  className="relative z-10 rounded-lg border border-zinc-800 bg-black px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-900 hover:text-white"
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    handleDelete(
                                      product
                                    );
                                  }}
                                  disabled={
                                    deletingId ===
                                    product.id
                                  }
                                  className="relative z-10 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {deletingId ===
                                  product.id
                                    ? "Deleting..."
                                    : "Delete"}
                                </button>

                              </div>
                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>
                </table>
              </div>

              {/* MOBILE */}
              <div className="grid gap-4 p-4 lg:hidden">

                {filteredProducts.map(
                  (product) => {
                    const images =
                      Array.isArray(
                        product.image_urls
                      ) &&
                      product.image_urls.length
                        ? product.image_urls
                        : product.image_url
                          ? [
                              product.image_url,
                            ]
                          : [];

                    return (
                      <div
                        key={
                          product.id
                        }
                        className="rounded-2xl border border-zinc-800 bg-black p-4"
                      >

                        <div className="flex gap-4">

                          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
                            {images[0] ? (
                              <img
                                src={
                                  images[0]
                                }
                                alt={
                                  product.title
                                }
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-zinc-600">
                                No image
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">

                            <div className="flex items-start justify-between gap-3">

                              <div className="min-w-0">
                                <h3 className="truncate font-semibold">
                                  {
                                    product.title
                                  }
                                </h3>

                                <p className="mt-1 text-xs text-zinc-600">
                                  ID: #
                                  {
                                    product.id
                                  }
                                </p>
                              </div>

                              <span className="shrink-0 rounded-lg border border-zinc-800 px-2 py-1 text-[10px] text-zinc-400">
                                {product.category ||
                                  "—"}
                              </span>

                            </div>

                            <div className="mt-3 flex items-end justify-between">

                              <div>
                                <p className="font-bold">
                                  {formatPrice(
                                    product.offer_price
                                  )}
                                </p>

                                {Number(
                                  product.discount ??
                                    0
                                ) > 0 && (
                                  <p className="text-xs text-zinc-600 line-through">
                                    {formatPrice(
                                      product.regular_price
                                    )}
                                  </p>
                                )}
                              </div>

                              <span
                                className={
                                  Number(
                                    product.stock ??
                                      0
                                  ) <= 0
                                    ? "text-xs font-semibold text-red-400"
                                    : "text-xs font-semibold text-green-400"
                                }
                              >
                                Stock:{" "}
                                {Number(
                                  product.stock ??
                                    0
                                )}
                              </span>

                            </div>

                          </div>

                        </div>

                        <div className="mt-4 flex flex-wrap gap-1.5">

                          {product.is_hot_sale && (
                            <span className="rounded-full bg-orange-500/10 px-2.5 py-1 text-[11px] font-semibold text-orange-400">
                              Hot Sale
                            </span>
                          )}

                          {product.is_offer && (
                            <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-400">
                              Offer
                            </span>
                          )}

                          {product.is_gadget && (
                            <span className="rounded-full bg-purple-500/10 px-2.5 py-1 text-[11px] font-semibold text-purple-400">
                              Gadget
                            </span>
                          )}

                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">

                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              openEditModal(
                                product
                              );
                            }}
                            onMouseDown={(event) => {
                              event.stopPropagation();
                            }}
                            className="relative z-10 rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-white"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              handleDelete(
                                product
                              );
                            }}
                            disabled={
                              deletingId ===
                              product.id
                            }
                            className="relative z-10 rounded-xl border border-red-500/20 bg-red-500/5 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                          >
                            {deletingId ===
                            product.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>
            </>
          )}
        </div>
      </div>

      {/* =========================================================
          ADD / EDIT MODAL
          ========================================================= */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[9999] overflow-y-auto bg-black/80 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >

          <div
            className="mx-auto my-4 w-full max-w-4xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl sm:my-8"
            onMouseDown={(event) => {
              event.stopPropagation();
            }}
          >

            {/* MODAL HEADER */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-5 py-4 sm:px-6">

              <div>
                <h2 className="text-xl font-bold">
                  {isEditing
                    ? "Edit Product"
                    : "Add Product"}
                </h2>

                <p className="mt-1 text-xs text-zinc-500">
                  {isEditing
                    ? `Editing product #${editingProductId}`
                    : "Create a new product for your CATS HOME store."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={
                  saving ||
                  uploadingImages
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 text-xl text-zinc-500 transition hover:bg-zinc-900 hover:text-white disabled:opacity-50"
              >
                ×
              </button>

            </div>

            {/* MODAL BODY */}
            <div className="space-y-7 p-5 sm:p-6">

              {errorMessage && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {errorMessage}
                </div>
              )}

              {/* IMAGES */}
              <section>

                <div className="mb-3">
                  <h3 className="font-semibold">
                    Product Images
                  </h3>

                  <p className="mt-1 text-xs text-zinc-500">
                    Add one or more product images.
                    The first image will be used as
                    the main image.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

                  {existingImages.map(
                    (image, index) => (
                      <div
                        key={`${image}-${index}`}
                        className="group relative aspect-square overflow-hidden rounded-xl border border-zinc-800 bg-black"
                      >

                        <img
                          src={image}
                          alt={`Product ${index + 1}`}
                          className="h-full w-full object-cover"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            removeExistingImage(
                              index
                            )
                          }
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/80 text-sm text-white opacity-0 transition group-hover:opacity-100"
                        >
                          ×
                        </button>

                        {index === 0 && (
                          <span className="absolute bottom-2 left-2 rounded-full bg-white px-2 py-1 text-[10px] font-bold text-black">
                            Main
                          </span>
                        )}

                      </div>
                    )
                  )}

                  {previewImages.map(
                    (image, index) => (
                      <div
                        key={`${image}-${index}`}
                        className="group relative aspect-square overflow-hidden rounded-xl border border-zinc-800 bg-black"
                      >

                        <img
                          src={image}
                          alt={`New product ${index + 1}`}
                          className="h-full w-full object-cover"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            removeNewImage(
                              index
                            )
                          }
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/80 text-sm text-white opacity-0 transition group-hover:opacity-100"
                        >
                          ×
                        </button>

                        <span className="absolute bottom-2 left-2 rounded-full bg-white px-2 py-1 text-[10px] font-bold text-black">
                          New
                        </span>

                      </div>
                    )
                  )}

                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-black text-center transition hover:border-zinc-500 hover:bg-zinc-900">

                    <span className="text-2xl text-zinc-500">
                      +
                    </span>

                    <span className="mt-2 text-xs font-semibold text-zinc-400">
                      Add Image
                    </span>

                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={
                        handleImageChange
                      }
                      className="hidden"
                    />

                  </label>

                </div>
              </section>

              {/* BASIC INFO */}
              <section>

                <div className="mb-4">
                  <h3 className="font-semibold">
                    Basic Information
                  </h3>
                </div>

                <div className="grid gap-4">

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Product Title
                    </label>

                    <input
                      value={form.title}
                      onChange={(event) =>
                        updateField(
                          "title",
                          event.target.value
                        )
                      }
                      placeholder="Enter product title"
                      className="h-12 w-full rounded-xl border border-zinc-800 bg-black px-4 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-zinc-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Description
                    </label>

                    <textarea
                      value={form.description}
                      onChange={(event) =>
                        updateField(
                          "description",
                          event.target.value
                        )
                      }
                      placeholder="Enter product description"
                      rows={5}
                      className="w-full resize-none rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-zinc-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Category
                    </label>

                    <select
                      value={form.category}
                      onChange={(event) =>
                        updateField(
                          "category",
                          event.target.value
                        )
                      }
                      className="h-12 w-full rounded-xl border border-zinc-800 bg-black px-4 text-sm text-white outline-none focus:border-zinc-500"
                    >

                      <option value="">
                        Select category
                      </option>

                      {CATEGORIES.map(
                        (category) => (
                          <option
                            key={category}
                            value={category}
                          >
                            {category}
                          </option>
                        )
                      )}

                    </select>
                  </div>

                </div>
              </section>

              {/* PRICING */}
              <section>

                <div className="mb-4">
                  <h3 className="font-semibold">
                    Pricing & Inventory
                  </h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Regular Price
                    </label>

                    <div className="relative">

                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                        ৳
                      </span>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          form.regular_price
                        }
                        onChange={(event) =>
                          updateField(
                            "regular_price",
                            event.target.value
                          )
                        }
                        placeholder="0"
                        className="h-12 w-full rounded-xl border border-zinc-800 bg-black pl-9 pr-4 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-zinc-500"
                      />

                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Discount %
                    </label>

                    <div className="relative">

                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={
                          form.discount
                        }
                        onChange={(event) =>
                          updateField(
                            "discount",
                            event.target.value
                          )
                        }
                        placeholder="0"
                        className="h-12 w-full rounded-xl border border-zinc-800 bg-black px-4 pr-10 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-zinc-500"
                      />

                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                        %
                      </span>

                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Stock
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.stock}
                      onChange={(event) =>
                        updateField(
                          "stock",
                          event.target.value
                        )
                      }
                      placeholder="0"
                      className="h-12 w-full rounded-xl border border-zinc-800 bg-black px-4 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-zinc-500"
                    />
                  </div>

                </div>

                <div className="mt-4 rounded-xl border border-zinc-800 bg-black p-4">

                  <div className="flex items-center justify-between gap-4">

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Calculated Offer Price
                      </p>

                      <p className="mt-1 text-xs text-zinc-600">
                        Automatically calculated
                        from regular price and
                        discount.
                      </p>
                    </div>

                    <p className="text-xl font-bold">
                      {formatPrice(
                        calculatedOfferPrice
                      )}
                    </p>

                  </div>

                </div>
              </section>

              {/* COLOURS */}
              <section>

                <div className="mb-4 flex items-center justify-between gap-4">

                  <div>
                    <h3 className="font-semibold">
                      Colours
                    </h3>

                    <p className="mt-1 text-xs text-zinc-500">
                      Enable if this product has
                      different colours.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      updateField(
                        "has_colours",
                        !form.has_colours
                      )
                    }
                    className={`relative h-7 w-12 rounded-full transition ${
                      form.has_colours
                        ? "bg-white"
                        : "bg-zinc-800"
                    }`}
                  >

                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full transition ${
                        form.has_colours
                          ? "left-6 bg-black"
                          : "left-1 bg-zinc-500"
                      }`}
                    />

                  </button>

                </div>

                {form.has_colours && (
                  <div className="rounded-xl border border-zinc-800 bg-black p-4">

                    <div className="flex gap-2">

                      <input
                        value={
                          colourInput
                        }
                        onChange={(event) =>
                          setColourInput(
                            event.target.value
                          )
                        }
                        onKeyDown={(event) => {
                          if (
                            event.key ===
                            "Enter"
                          ) {
                            event.preventDefault();
                            addColour();
                          }
                        }}
                        placeholder="e.g. Black"
                        className="h-11 min-w-0 flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-zinc-500"
                      />

                      <button
                        type="button"
                        onClick={
                          addColour
                        }
                        className="rounded-xl bg-white px-5 text-sm font-bold text-black hover:bg-zinc-200"
                      >
                        Add
                      </button>

                    </div>

                    {form.colours.length >
                      0 && (
                      <div className="mt-4 flex flex-wrap gap-2">

                        {form.colours.map(
                          (colour) => (
                            <span
                              key={
                                colour
                              }
                              className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-300"
                            >

                              {colour}

                              <button
                                type="button"
                                onClick={() =>
                                  removeColour(
                                    colour
                                  )
                                }
                                className="text-zinc-600 hover:text-red-400"
                              >
                                ×
                              </button>

                            </span>
                          )
                        )}

                      </div>
                    )}

                  </div>
                )}
              </section>

              {/* SIZES */}
              <section>

                <div className="mb-4 flex items-center justify-between gap-4">

                  <div>
                    <h3 className="font-semibold">
                      Sizes
                    </h3>

                    <p className="mt-1 text-xs text-zinc-500">
                      Enable if this product has
                      different sizes.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      updateField(
                        "has_sizes",
                        !form.has_sizes
                      )
                    }
                    className={`relative h-7 w-12 rounded-full transition ${
                      form.has_sizes
                        ? "bg-white"
                        : "bg-zinc-800"
                    }`}
                  >

                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full transition ${
                        form.has_sizes
                          ? "left-6 bg-black"
                          : "left-1 bg-zinc-500"
                      }`}
                    />

                  </button>

                </div>

                {form.has_sizes && (
                  <div className="grid grid-cols-4 gap-2 rounded-xl border border-zinc-800 bg-black p-4 sm:grid-cols-7">

                    {SIZES.map(
                      (size) => {
                        const selected =
                          form.sizes.includes(
                            size
                          );

                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() =>
                              toggleSize(
                                size
                              )
                            }
                            className={`rounded-xl border py-3 text-xs font-bold transition ${
                              selected
                                ? "border-white bg-white text-black"
                                : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-600 hover:text-white"
                            }`}
                          >
                            {size}
                          </button>
                        );
                      }
                    )}

                  </div>
                )}
              </section>

              {/* LABELS */}
              <section>

                <div className="mb-4">

                  <h3 className="font-semibold">
                    Product Labels
                  </h3>

                  <p className="mt-1 text-xs text-zinc-500">
                    Choose how this product should
                    appear across your store.
                  </p>

                </div>

                <div className="grid gap-3 sm:grid-cols-3">

                  {/* GADGET */}
                  <button
                    type="button"
                    onClick={() =>
                      updateField(
                        "is_gadget",
                        !form.is_gadget
                      )
                    }
                    className={`rounded-xl border p-4 text-left transition ${
                      form.is_gadget
                        ? "border-purple-400/40 bg-purple-500/10"
                        : "border-zinc-800 bg-black hover:border-zinc-700"
                    }`}
                  >

                    <div className="flex items-center justify-between">

                      <span className="font-semibold">
                        Gadget
                      </span>

                      <span
                        className={
                          form.is_gadget
                            ? "text-purple-400"
                            : "text-zinc-700"
                        }
                      >
                        {form.is_gadget
                          ? "✓"
                          : "○"}
                      </span>

                    </div>

                    <p className="mt-1 text-xs text-zinc-600">
                      Mark as gadget product.
                    </p>

                  </button>

                  {/* HOT SALE */}
                  <button
                    type="button"
                    onClick={() =>
                      updateField(
                        "is_hot_sale",
                        !form.is_hot_sale
                      )
                    }
                    className={`rounded-xl border p-4 text-left transition ${
                      form.is_hot_sale
                        ? "border-orange-400/40 bg-orange-500/10"
                        : "border-zinc-800 bg-black hover:border-zinc-700"
                    }`}
                  >

                    <div className="flex items-center justify-between">

                      <span className="font-semibold">
                        Hot Sale
                      </span>

                      <span
                        className={
                          form.is_hot_sale
                            ? "text-orange-400"
                            : "text-zinc-700"
                        }
                      >
                        {form.is_hot_sale
                          ? "✓"
                          : "○"}
                      </span>

                    </div>

                    <p className="mt-1 text-xs text-zinc-600">
                      Highlight as hot sale.
                    </p>

                  </button>

                  {/* OFFER */}
                  <button
                    type="button"
                    onClick={() =>
                      updateField(
                        "is_offer",
                        !form.is_offer
                      )
                    }
                    className={`rounded-xl border p-4 text-left transition ${
                      form.is_offer
                        ? "border-blue-400/40 bg-blue-500/10"
                        : "border-zinc-800 bg-black hover:border-zinc-700"
                    }`}
                  >

                    <div className="flex items-center justify-between">

                      <span className="font-semibold">
                        Offer
                      </span>

                      <span
                        className={
                          form.is_offer
                            ? "text-blue-400"
                            : "text-zinc-700"
                        }
                      >
                        {form.is_offer
                          ? "✓"
                          : "○"}
                      </span>

                    </div>

                    <p className="mt-1 text-xs text-zinc-600">
                      Highlight as an offer.
                    </p>

                  </button>

                </div>
              </section>
            </div>

            {/* MODAL FOOTER */}
            <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-zinc-800 bg-zinc-950 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">

              <button
                type="button"
                onClick={closeModal}
                disabled={
                  saving ||
                  uploadingImages
                }
                className="h-12 rounded-xl border border-zinc-800 bg-black px-6 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-900 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={
                  saving ||
                  uploadingImages
                }
                className="h-12 rounded-xl bg-white px-7 text-sm font-bold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploadingImages
                  ? "Uploading Images..."
                  : saving
                    ? isEditing
                      ? "Updating..."
                      : "Saving..."
                    : isEditing
                      ? "Update Product"
                      : "Save Product"}
              </button>

            </div>

          </div>
        </div>
      )}
    </main>
  );
}
