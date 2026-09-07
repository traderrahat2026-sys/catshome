"use client";

import { useState } from "react";

type Order = {
  id: number;
  order_id: string;
  customer_name: string;
  phone: string;
  amount: number;
  payment_status: string;
  order_status: string;
  created_at: string;
  updated_at: string;
};

function formatDate(date: string) {
  if (!date) return "N/A";

  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(date: string) {
  if (!date) return "N/A";

  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getDaysAgo(date: string) {
  if (!date) return 0;

  const created = new Date(date).getTime();
  const now = Date.now();

  return Math.max(
    0,
    Math.floor((now - created) / (1000 * 60 * 60 * 24))
  );
}

function getStatusClass(status: string) {
  const value = status.toLowerCase();

  if (
    value.includes("deliver") ||
    value.includes("paid") ||
    value.includes("approved")
  ) {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (
    value.includes("cancel") ||
    value.includes("reject") ||
    value.includes("fail")
  ) {
    return "border-red-400/20 bg-red-400/10 text-red-300";
  }

  return "border-yellow-400/20 bg-yellow-400/10 text-yellow-300";
}

export default function CustomerReceiptPage() {
  const [customerId, setCustomerId] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function searchCustomer() {
    const id = customerId.trim().replace(/^#/, "");

    if (!id) {
      setError("Please enter a Customer ID or Order ID.");
      setOrder(null);
      return;
    }

    setLoading(true);
    setError("");
    setOrder(null);
    setCopied(false);

    try {
      const response = await fetch(
        `/api/admin/tracking?orderId=${encodeURIComponent(id)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const text = await response.text();

      let data: any = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        throw new Error(
          `Server returned an invalid response. Status: ${response.status}`
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            `Unable to find customer. Status: ${response.status}`
        );
      }

      if (!data?.order) {
        throw new Error("Customer/order information was not found.");
      }

      setOrder(data.order);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Enter") {
      void searchCustomer();
    }
  }

  async function copyCustomerDetails() {
    if (!order) return;

    const days = getDaysAgo(order.created_at);

    const details = `
CATS HOME — Customer Order Details

Customer Name: ${order.customer_name || "N/A"}
Customer ID: ${order.order_id || "N/A"}
Phone: ${order.phone || "N/A"}

Order Date: ${formatDateTime(order.created_at)}
Days Since Order: ${days} day${days === 1 ? "" : "s"}

Total Bill: ৳${Number(order.amount || 0).toLocaleString("en-BD")}

Payment Status: ${order.payment_status || "N/A"}
Order Status: ${order.order_status || "N/A"}

Thank you for shopping with CATS HOME
`.trim();

    try {
      await navigator.clipboard.writeText(details);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setError("Unable to copy the customer details.");
    }
  }

  return (
    <main className="fixed inset-0 overflow-y-auto bg-black text-white">
      {/* CONTENT AREA */}
      <div className="min-h-screen bg-black px-6 py-8 pl-[calc(16rem+1.5rem)]">
        <div className="mx-auto max-w-6xl">

          {/* HEADER */}
          <div className="mb-8">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/30">
              Customer Service
            </div>

            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Customer Receipt
                </h1>

                <p className="mt-2 text-sm text-white/45">
                  Search customer information and create a
                  customer-ready receipt.
                </p>
              </div>

              <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/40">
                View Only
              </div>
            </div>
          </div>

          {/* SEARCH */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl">
            <div className="mb-3">
              <label
                htmlFor="customer-id"
                className="text-sm font-medium text-white/80"
              >
                Customer ID
              </label>

              <p className="mt-1 text-xs text-white/35">
                Paste Customer ID or Order ID to find the customer.
              </p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <input
                id="customer-id"
                value={customerId}
                onChange={(event) =>
                  setCustomerId(event.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder="Paste Customer ID..."
                className="h-12 flex-1 rounded-xl border border-white/10 bg-black px-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/30"
              />

              <button
                type="button"
                onClick={() => void searchCustomer()}
                disabled={loading}
                className="h-12 rounded-xl bg-white px-7 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Searching..." : "Search Customer"}
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}
          </section>

          {/* EMPTY */}
          {!order && !loading && !error && (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 px-6 py-20 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-2xl">
                ▣
              </div>

              <h2 className="text-lg font-semibold">
                No Customer Selected
              </h2>

              <p className="mt-2 text-sm text-white/35">
                Paste a Customer ID above to view the complete
                customer information.
              </p>
            </div>
          )}

          {/* RECEIPT */}
          {order && (
            <section className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">

              {/* RECEIPT HEADER */}
              <div className="border-b border-white/10 px-6 py-6 md:px-8">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-white/30">
                      Customer Receipt
                    </div>

                    <h2 className="mt-2 text-2xl font-bold">
                      {order.customer_name || "Customer"}
                    </h2>

                    <p className="mt-1 text-sm text-white/40">
                      Order #{order.order_id}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void copyCustomerDetails()}
                    className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
                  >
                    {copied
                      ? "✓ Copied"
                      : "Copy Customer Details"}
                  </button>
                </div>
              </div>

              {/* CUSTOMER INFORMATION */}
              <div className="grid gap-px border-b border-white/10 bg-white/10 md:grid-cols-3">

                <div className="bg-black p-6">
                  <div className="text-xs uppercase tracking-wider text-white/30">
                    Customer Name
                  </div>

                  <div className="mt-2 text-sm font-semibold">
                    {order.customer_name || "N/A"}
                  </div>
                </div>

                <div className="bg-black p-6">
                  <div className="text-xs uppercase tracking-wider text-white/30">
                    Customer ID
                  </div>

                  <div className="mt-2 break-all text-sm font-semibold">
                    {order.order_id || "N/A"}
                  </div>
                </div>

                <div className="bg-black p-6">
                  <div className="text-xs uppercase tracking-wider text-white/30">
                    Phone
                  </div>

                  <div className="mt-2 text-sm font-semibold">
                    {order.phone || "N/A"}
                  </div>
                </div>

              </div>

              {/* ORDER INFORMATION */}
              <div className="p-6 md:p-8">
                <div className="mb-5">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/30">
                    Order Information
                  </div>

                  <h3 className="mt-1 text-lg font-semibold">
                    Order Summary
                  </h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                  <div className="rounded-xl border border-white/10 bg-black p-4">
                    <div className="text-xs text-white/30">
                      Order Date
                    </div>

                    <div className="mt-2 text-sm font-medium">
                      {formatDate(order.created_at)}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black p-4">
                    <div className="text-xs text-white/30">
                      Days Since Order
                    </div>

                    <div className="mt-2 text-sm font-medium">
                      {getDaysAgo(order.created_at)} day
                      {getDaysAgo(order.created_at) === 1
                        ? ""
                        : "s"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black p-4">
                    <div className="text-xs text-white/30">
                      Total Bill
                    </div>

                    <div className="mt-2 text-lg font-bold">
                      ৳
                      {Number(order.amount || 0).toLocaleString(
                        "en-BD"
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black p-4">
                    <div className="text-xs text-white/30">
                      Last Updated
                    </div>

                    <div className="mt-2 text-sm font-medium">
                      {formatDate(order.updated_at)}
                    </div>
                  </div>

                </div>
              </div>

              {/* STATUS */}
              <div className="border-t border-white/10 p-6 md:p-8">
                <div className="mb-5">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/30">
                    Current Status
                  </div>

                  <h3 className="mt-1 text-lg font-semibold">
                    Payment & Delivery
                  </h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2">

                  <div className="rounded-xl border border-white/10 bg-black p-5">
                    <div className="mb-3 text-xs text-white/30">
                      Payment Status
                    </div>

                    <span
                      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-medium ${getStatusClass(
                        order.payment_status
                      )}`}
                    >
                      {order.payment_status || "N/A"}
                    </span>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black p-5">
                    <div className="mb-3 text-xs text-white/30">
                      Order / Delivery Status
                    </div>

                    <span
                      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-medium ${getStatusClass(
                        order.order_status
                      )}`}
                    >
                      {order.order_status || "N/A"}
                    </span>
                  </div>

                </div>
              </div>

              {/* COPY PREVIEW */}
              <div className="border-t border-white/10 bg-white/[0.02] p-6 md:p-8">

                <div className="mb-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/30">
                    Customer Message
                  </div>

                  <h3 className="mt-1 text-lg font-semibold">
                    Copy-ready Information
                  </h3>
                </div>

                <div className="rounded-xl border border-white/10 bg-black p-5 font-mono text-xs leading-6 text-white/60">

                  <div className="mb-3 font-bold text-white">
                    CATS HOME — Customer Order Details
                  </div>

                  <div>
                    Customer Name:{" "}
                    {order.customer_name || "N/A"}
                  </div>

                  <div>
                    Customer ID:{" "}
                    {order.order_id || "N/A"}
                  </div>

                  <div>
                    Phone: {order.phone || "N/A"}
                  </div>

                  <div className="mt-2">
                    Order Date:{" "}
                    {formatDateTime(order.created_at)}
                  </div>

                  <div>
                    Days Since Order:{" "}
                    {getDaysAgo(order.created_at)} day
                    {getDaysAgo(order.created_at) === 1
                      ? ""
                      : "s"}
                  </div>

                  <div>
                    Total Bill: ৳
                    {Number(order.amount || 0).toLocaleString(
                      "en-BD"
                    )}
                  </div>

                  <div>
                    Payment Status:{" "}
                    {order.payment_status || "N/A"}
                  </div>

                  <div>
                    Order Status:{" "}
                    {order.order_status || "N/A"}
                  </div>

                  <div className="mt-3 text-white/40">
                    Thank you for shopping with CATS HOME
                  </div>

                </div>

                <button
                  type="button"
                  onClick={() => void copyCustomerDetails()}
                  className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  {copied
                    ? "✓ Customer Details Copied"
                    : "Copy Customer Details"}
                </button>

              </div>

            </section>
          )}

        </div>
      </div>
    </main>
  );
}
