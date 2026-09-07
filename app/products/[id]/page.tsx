"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

import { getProductById } from "@/lib/products";
import { useCart } from "@/components/CartProvider";

export default function ProductDetailsPage() {
  const router = useRouter();
  const params = useParams();

  const { addToCart } = useCart();

  const productId = Number(params.id);
  const product = getProductById(productId);

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-black text-zinc-900">
            Product Not Found
          </h1>

          <p className="mt-3 text-zinc-500">
            Sorry, this product does not exist.
          </p>

          <Link
            href="/"
            className="mt-6 inline-block rounded-xl bg-black px-6 py-3 font-bold text-white"
          >
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  const discount = Math.round(
    ((product.oldPrice - product.price) /
      product.oldPrice) *
      100
  );

function handleAddToCart() {
  if (!product) return;

  addToCart(product, quantity);

  setAdded(true);

  setTimeout(() => {
    setAdded(false);
  }, 1500);
}

function handleBuyNow() {
  if (!product) return;

  addToCart(product, quantity);
  router.push("/cart");
}

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Back Button */}
        <Link
          href="/"
          className="mb-6 inline-flex text-sm font-semibold text-zinc-500 transition hover:text-black"
        >
          ← Back to Shopping
        </Link>

        <div className="grid gap-8 rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 lg:grid-cols-2 lg:p-8">

          {/* Product Image */}
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-zinc-100">

            <Image
              src={product.image}
              alt={product.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />

            {/* Discount Badge */}
            {discount > 0 && (
              <span className="absolute left-4 top-4 rounded-full bg-black px-4 py-2 text-sm font-bold text-white">
                {discount}% OFF
              </span>
            )}

            {/* Hot Sale Badge */}
            {product.isHotSale && (
              <span className="absolute right-4 top-4 rounded-full bg-[#d4af37] px-4 py-2 text-sm font-black text-black">
                🔥 HOT SALE
              </span>
            )}
          </div>

          {/* Product Details */}
          <div className="flex flex-col justify-center">

            {/* Category */}
            <p className="text-sm font-bold uppercase tracking-widest text-[#a78624]">
              {product.category}
            </p>

            {/* Product Name */}
            <h1 className="mt-3 text-3xl font-black leading-tight text-zinc-950 sm:text-4xl">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[#d4af37]">
                ★★★★★
              </span>

              <span className="text-sm text-zinc-500">
                4.8 (120+ reviews)
              </span>
            </div>

            {/* Price */}
            <div className="mt-6 flex flex-wrap items-center gap-3">

              <span className="text-4xl font-black text-zinc-950">
                ৳{product.price.toLocaleString()}
              </span>

              <span className="text-lg text-zinc-400 line-through">
                ৳{product.oldPrice.toLocaleString()}
              </span>

              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700">
                Save ৳
                {(product.oldPrice - product.price).toLocaleString()}
              </span>

            </div>

            {/* Description */}
            <p className="mt-6 text-base leading-7 text-zinc-600">
              {product.description}
            </p>

            {/* Quantity */}
            <div className="mt-8">

              <p className="mb-3 text-sm font-bold text-zinc-900">
                Quantity
              </p>

              <div className="flex w-fit items-center rounded-xl border border-zinc-200 bg-white">

                <button
                  type="button"
                  onClick={() =>
                    setQuantity((current) =>
                      Math.max(1, current - 1)
                    )
                  }
                  className="flex h-12 w-12 items-center justify-center text-xl font-bold transition hover:bg-zinc-100"
                >
                  −
                </button>

                <span className="flex h-12 min-w-14 items-center justify-center border-x border-zinc-200 font-bold">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setQuantity((current) => current + 1)
                  }
                  className="flex h-12 w-12 items-center justify-center text-xl font-bold transition hover:bg-zinc-100"
                >
                  +
                </button>

              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">

              <button
                type="button"
                onClick={handleAddToCart}
                className="rounded-xl border-2 border-black px-5 py-4 font-bold text-black transition hover:bg-black hover:text-white active:scale-[0.98]"
              >
                {added
                  ? "✓ Added to Cart"
                  : "🛒 Add to Cart"}
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                className="rounded-xl bg-black px-5 py-4 font-bold text-white transition hover:bg-zinc-800 active:scale-[0.98]"
              >
                ⚡ Buy Now
              </button>

            </div>

            {/* Benefits */}
            <div className="mt-8 grid grid-cols-2 gap-3 border-t border-zinc-200 pt-6">

              <div className="rounded-xl bg-zinc-50 p-4">
                <p className="text-lg">🚚</p>

                <p className="mt-2 text-sm font-bold">
                  Fast Delivery
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Across Bangladesh
                </p>
              </div>

              <div className="rounded-xl bg-zinc-50 p-4">
                <p className="text-lg">💵</p>

                <p className="mt-2 text-sm font-bold">
                  Cash on Delivery
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Pay when you receive
                </p>
              </div>

            </div>

          </div>
        </div>
      </div>
    </main>
  );
}