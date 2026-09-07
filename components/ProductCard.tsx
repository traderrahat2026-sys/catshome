"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/products";
import { useCart } from "@/components/CartProvider";

export default function ProductCard({
  product,
}: {
  product: Product;
}) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  function handleAddToCart() {
    addToCart(product);

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 1200);
  }

  const discount = Math.round(
    ((product.oldPrice - product.price) /
      product.oldPrice) *
      100
  );

  return (
    <article className="group overflow-hidden rounded-3xl border border-zinc-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Product Image */}
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-square overflow-hidden bg-zinc-100">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Discount */}
          {discount > 0 && (
            <span className="absolute left-3 top-3 rounded-full bg-black px-3 py-1 text-xs font-bold text-white">
              -{discount}%
            </span>
          )}

          {/* Hot Sale */}
          {product.isHotSale && (
            <span className="absolute right-3 top-3 rounded-full bg-[#d4af37] px-3 py-1 text-xs font-bold text-black">
              HOT
            </span>
          )}
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-4">
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500">
          {product.category}
        </p>

        <Link href={`/products/${product.id}`}>
          <h3 className="line-clamp-2 min-h-[48px] text-base font-bold text-zinc-900 transition hover:text-[#a78624]">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xl font-black text-zinc-950">
            ৳{product.price.toLocaleString()}
          </span>

          <span className="text-sm text-zinc-400 line-through">
            ৳{product.oldPrice.toLocaleString()}
          </span>
        </div>

        {/* Buttons */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleAddToCart}
            className="flex-1 rounded-xl bg-black px-3 py-3 text-sm font-bold text-white transition hover:bg-zinc-800 active:scale-95"
          >
            {added ? "✓ Added" : "Add to Cart"}
          </button>

          <Link
            href={`/products/${product.id}`}
            className="rounded-xl border border-zinc-300 px-4 py-3 text-sm font-bold text-zinc-900 transition hover:border-black hover:bg-zinc-50"
          >
            Buy
          </Link>
        </div>
      </div>
    </article>
  );
}
