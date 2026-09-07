"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

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

export default function AdminOrdersPage() {
  const searchParams = useSearchParams();
  const customerPhone =
    searchParams.get("customer")?.trim() ?? "";

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function loadOrders() {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/orders", {
        method: "GET",
        cache: "no-store",
      });

      const responseText = await response.text();

      let data: {
        orders?: Order[];
        error?: string;
      } = {};

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {};
      } catch {
        console.error(
          "INVALID ORDERS API RESPONSE:",
          responseText
        );
        setOrders([]);
        return;
      }

      if (!response.ok) {
        console.error(
          "Orders load error:",
          data.error ?? `HTTP ${response.status}`
        );

        setOrders([]);
        return;
      }

      setOrders(
        Array.isArray(data.orders)
          ? data.orders
          : []
      );
    } catch (error) {
      console.error("Orders load error:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOrders();
  }, []);

  const normalizePhone = (value: string) => {
    const digits = value.replace(/\D/g, "");

    if (digits.startsWith("880")) {
      return "0" + digits.slice(3);
    }

    return digits;
  };

  const filteredOrders = orders.filter((order) => {
    const matchesCustomer = customerPhone
      ? normalizePhone(order.phone) ===
        normalizePhone(customerPhone)
      : true;

    const keyword = search.toLowerCase().trim();

    const matchesSearch = keyword
      ? order.order_id
          .toLowerCase()
          .includes(keyword) ||
        order.customer_name
          .toLowerCase()
          .includes(keyword) ||
        order.phone
          .toLowerCase()
          .includes(keyword)
      : true;

    return matchesCustomer && matchesSearch;
  });

  const pendingOrders = filteredOrders.filter(
    (order) =>
      order.order_status === "Pending" ||
      order.order_status === "Order Placed"
  ).length;

  const processingOrders = filteredOrders.filter(
    (order) =>
      order.order_status === "Processing" ||
      order.order_status === "Confirmed"
  ).length;

  const deliveredOrders = filteredOrders.filter(
    (order) =>
      order.order_status === "Delivered"
  ).length;

  const customerName =
    filteredOrders[0]?.customer_name ??
    customerPhone;

  return (
    <div className="min-h-screen bg-[#f5f5f5]">

      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-black/10 bg-white/90 px-8 backdrop-blur">

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40">
            CATS HOME Admin
          </p>

          <h1 className="mt-1 text-2xl font-bold">
            Orders
          </h1>

          {customerPhone && (
            <p className="mt-1 text-sm text-black/50">
              Showing orders for{" "}
              <span className="font-semibold text-black">
                {customerName}
              </span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">

          {customerPhone && (
            <Link
              href="/admin/orders"
              className="rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold transition hover:bg-black hover:text-white"
            >
              All Orders
            </Link>
          )}

          <Link
            href="/admin"
            className="rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold transition hover:bg-black hover:text-white"
          >
            Dashboard
          </Link>

        </div>
      </header>

      <main className="space-y-6 p-8">

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <SummaryCard
            title="Total Orders"
            value={filteredOrders.length}
          />

          <SummaryCard
            title="Pending"
            value={pendingOrders}
          />

          <SummaryCard
            title="Processing"
            value={processingOrders}
          />

          <SummaryCard
            title="Delivered"
            value={deliveredOrders}
          />

        </section>

        <section className="overflow-hidden rounded-2xl border border-black/10 bg-white">

          <div className="flex flex-col gap-4 border-b border-black/10 p-6 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-xl font-bold">
                {customerPhone
                  ? "Customer Orders"
                  : "All Orders"}
              </h2>

              <p className="mt-1 text-sm text-black/40">
                Manage customer orders and payments
              </p>
            </div>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search Order ID, Customer or Phone..."
              className="rounded-xl border border-black/10 px-4 py-2 text-sm outline-none focus:border-black"
            />

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1000px] text-left">

              <thead className="border-b border-black/10 bg-black/[0.02]">

                <tr>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">
                    Order
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">
                    Customer
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">
                    Amount
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">
                    Payment
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">
                    Status
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">
                    Date
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {loading ? (

                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-10 text-center text-sm text-black/40"
                    >
                      Loading orders...
                    </td>
                  </tr>

                ) : filteredOrders.length === 0 ? (

                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-10 text-center text-sm text-black/40"
                    >
                      {customerPhone
                        ? "No orders found for this customer."
                        : "No orders found."}
                    </td>
                  </tr>

                ) : (

                  filteredOrders.map((order) => (

                    <tr
                      key={order.id}
                      className="border-b border-black/10 last:border-0 hover:bg-black/[0.02]"
                    >

                      <td className="px-6 py-5">
                        <span className="font-bold">
                          #{order.order_id}
                        </span>
                      </td>

                      <td className="px-6 py-5">

                        <p className="font-semibold">
                          {order.customer_name}
                        </p>

                        <p className="mt-1 text-xs text-black/40">
                          {order.phone}
                        </p>

                      </td>

                      <td className="px-6 py-5 font-bold">
                        ৳
                        {Number(
                          order.amount
                        ).toLocaleString()}
                      </td>

                      <td className="px-6 py-5">

                        <PaymentBadge
                          status={
                            order.payment_status
                          }
                        />

                      </td>

                      <td className="px-6 py-5">

                        <StatusBadge
                          status={
                            order.order_status
                          }
                        />

                      </td>

                      <td className="px-6 py-5 text-sm text-black/50">

                        {order.created_at
                          ? new Date(
                              order.created_at
                            ).toLocaleString()
                          : "—"}

                      </td>

                      <td className="px-6 py-5">

                        <Link
                          href={`/admin/tracking?order=${encodeURIComponent(
                            order.order_id
                          )}`}
                          className="inline-flex rounded-lg border border-black/10 px-3 py-2 text-xs font-semibold transition hover:bg-black hover:text-white"
                        >
                          Track
                        </Link>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        </section>

      </main>
    </div>
  );
}

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5">

      <p className="text-sm text-black/50">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold">
        {value}
      </p>

    </div>
  );
}

function PaymentBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    String(status || "")
      .trim()
      .toLowerCase();

  /*
   * Payment Verification থেকে Approve করলে
   * orders table-এ "Paid" save হচ্ছে।
   * এখানে সেটাকে customer/admin-এর জন্য
   * "Approved" হিসেবে দেখানো হচ্ছে।
   */

  const displayStatus =
    normalized === "paid" ||
    normalized === "approved"
      ? "Approved"
      : normalized === "rejected"
      ? "Rejected"
      : normalized === "pending"
      ? "Pending"
      : status || "Pending";

  const className =
    displayStatus === "Approved"
      ? "bg-green-100 text-green-700"
      : displayStatus === "Rejected"
      ? "bg-red-100 text-red-700"
      : "bg-yellow-100 text-yellow-700";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${className}`}
    >
      {displayStatus}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    String(status || "").trim();

  const className =
    normalized === "Delivered"
      ? "bg-green-100 text-green-700"
      : normalized === "Shipped" ||
        normalized === "Out for Delivery"
      ? "bg-blue-100 text-blue-700"
      : normalized === "Processing" ||
        normalized === "Confirmed" ||
        normalized === "Packed" ||
        normalized === "Ready to Ship"
      ? "bg-purple-100 text-purple-700"
      : normalized === "Cancelled" ||
        normalized === "Delivery Failed" ||
        normalized === "Returned"
      ? "bg-red-100 text-red-700"
      : "bg-yellow-100 text-yellow-700";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${className}`}
    >
      {status || "Order Placed"}
    </span>
  );
}
