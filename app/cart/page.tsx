"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/components/CartProvider";

export default function CartPage() {
  const {
    cart,
    cartCount,
    cartTotal,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  // Empty cart
  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white text-5xl shadow-sm">
            🛒
          </div>

          <h1 className="text-3xl font-black text-zinc-900">
            Your Cart Is Empty
          </h1>

          <p className="mt-3 text-zinc-500">
            Add some products to your cart and come back here.
          </p>

          <Link
            href="/"
            className="mt-8 inline-flex rounded-xl bg-black px-6 py-3 font-bold text-white transition hover:bg-zinc-800"
          >
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm font-semibold text-zinc-500 hover:text-black"
          >
            ← Continue Shopping
          </Link>

          <h1 className="mt-4 text-3xl font-black text-zinc-950 sm:text-4xl">
            Shopping Cart
          </h1>

          <p className="mt-2 text-zinc-500">
            {cartCount} {cartCount === 1 ? "item" : "items"} in your cart
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">

          {/* Cart Products */}
          <section className="space-y-4">
            {cart.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div className="flex gap-4">

                  {/* Product Image */}
                  <Link
                    href={`/products/${item.id}`}
                    className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-zinc-100 sm:h-32 sm:w-32"
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  </Link>

                  {/* Product Info */}
                  <div className="min-w-0 flex-1">

                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                          {item.category}
                        </p>

                        <Link href={`/products/${item.id}`}>
                          <h2 className="mt-1 line-clamp-2 font-bold text-zinc-900 hover:text-[#a78624]">
                            {item.name}
                          </h2>
                        </Link>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-sm font-semibold text-zinc-400 transition hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">

                      {/* Quantity */}
                      <div className="flex items-center rounded-xl border border-zinc-200">

                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="flex h-9 w-9 items-center justify-center text-lg font-bold hover:bg-zinc-100"
                        >
                          −
                        </button>

                        <span className="flex h-9 min-w-10 items-center justify-center border-x border-zinc-200 text-sm font-bold">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="flex h-9 w-9 items-center justify-center text-lg font-bold hover:bg-zinc-100"
                        >
                          +
                        </button>

                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="text-lg font-black text-zinc-950">
                          ৳{(item.price * item.quantity).toLocaleString()}
                        </p>

                        {item.quantity > 1 && (
                          <p className="text-xs text-zinc-400">
                            ৳{item.price.toLocaleString()} each
                          </p>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Clear Cart */}
            <button
              onClick={clearCart}
              className="text-sm font-semibold text-red-500 hover:text-red-700"
            >
              Clear Cart
            </button>
          </section>

          {/* Order Summary */}
          <aside className="h-fit rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">

            <h2 className="text-xl font-black text-zinc-950">
              Order Summary
            </h2>

            <div className="mt-6 space-y-4">

              <div className="flex justify-between text-sm text-zinc-600">
                <span>Items</span>
                <span>{cartCount}</span>
              </div>

              <div className="flex justify-between text-sm text-zinc-600">
                <span>Subtotal</span>
                <span>৳{cartTotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-sm text-zinc-600">
                <span>Delivery</span>

                <span className="font-semibold text-green-600">
                  Calculated at checkout
                </span>
              </div>

              <div className="border-t border-zinc-200 pt-4">

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-zinc-900">
                    Total
                  </span>

                  <span className="text-2xl font-black text-zinc-950">
                    ৳{cartTotal.toLocaleString()}
                  </span>
                </div>

              </div>
            </div>

            {/* Checkout */}
            <Link
              href="/checkout"
              className="mt-6 flex w-full items-center justify-center rounded-xl bg-black px-5 py-4 font-bold text-white transition hover:bg-zinc-800 active:scale-[0.98]"
            >
              Proceed to Checkout →
            </Link>

            {/* Payment Info */}
            <div className="mt-5 rounded-xl bg-zinc-50 p-4 text-center">
              <p className="text-sm font-bold text-zinc-800">
                🔒 Secure Checkout
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Cash on Delivery & bKash available
              </p>
            </div>

          </aside>
        </div>
      </div>
    </main>
  );
}
