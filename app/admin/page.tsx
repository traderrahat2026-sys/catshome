"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Order = {
  id?: number;
  order_id?: string;
  customer_name?: string;
  phone?: string;
  amount?: number | string;
  payment_status?: string;
  order_status?: string;
  payment_method?: string;
  created_at?: string;
  updated_at?: string;
};

type OrdersResponse =
  | Order[]
  | {
      orders?: Order[];
      data?: Order[];
      error?: string;
    };

function getOrdersFromResponse(data: OrdersResponse): Order[] {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data.orders)) return data.orders;

  if (Array.isArray(data.data)) return data.data;

  return [];
}

function getAmount(order: Order) {
  const amount = Number(order.amount);

  return Number.isFinite(amount) ? amount : 0;
}

function normalizeStatus(status?: string) {
  return String(status || "")
    .trim()
    .toLowerCase();
}

function formatMoney(amount: number) {
  return `৳${Math.round(amount).toLocaleString()}`;
}

function formatDate(date?: string) {
  if (!date) return "—";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) return "—";

  return value.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [salesPeriod, setSalesPeriod] = useState<
    "month" | "last-month" | "year"
  >("month");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/orders", {
        method: "GET",
        cache: "no-store",
      });

      const text = await response.text();

      let data: OrdersResponse = [];

      try {
        data = text ? JSON.parse(text) : [];
      } catch {
        throw new Error("Invalid response from orders API.");
      }

      if (!response.ok) {
        throw new Error(
          typeof data === "object" &&
            !Array.isArray(data) &&
            "error" in data
            ? String(
                (data as { error?: string }).error ||
                  "Failed to load orders."
              )
            : "Failed to load orders."
        );
      }

      setOrders(getOrdersFromResponse(data));
    } catch (err) {
      console.error("DASHBOARD LOAD ERROR:", err);

      setOrders([]);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();

    const interval = setInterval(() => {
      loadDashboard();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const now = new Date();

    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyOrders = orders.filter((order) => {
      if (!order.created_at) return false;

      const date = new Date(order.created_at);

      return (
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      );
    });

    const monthlySales = monthlyOrders.reduce(
      (total, order) => total + getAmount(order),
      0
    );

    const customers = new Set(
      orders
        .map((order) => order.phone?.trim())
        .filter(Boolean)
    );

    return {
      monthlySales,
      totalOrders: orders.length,
      customers: customers.size,
    };
  }, [orders]);

  const orderStats = useMemo(() => {
    return {
      pending: orders.filter((order) => {
        const status = normalizeStatus(order.order_status);

        return (
          status === "order placed" ||
          status === "pending" ||
          status === "confirmed"
        );
      }).length,

      processing: orders.filter((order) => {
        const status = normalizeStatus(order.order_status);

        return (
          status === "processing" ||
          status === "packed" ||
          status === "ready to ship"
        );
      }).length,

      shipped: orders.filter((order) => {
        const status = normalizeStatus(order.order_status);

        return (
          status === "shipped" ||
          status === "out for delivery"
        );
      }).length,

      delivered: orders.filter((order) => {
        return (
          normalizeStatus(order.order_status) ===
          "delivered"
        );
      }).length,
    };
  }, [orders]);

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => {
        const first = new Date(
          a.created_at || 0
        ).getTime();

        const second = new Date(
          b.created_at || 0
        ).getTime();

        return second - first;
      })
      .slice(0, 5);
  }, [orders]);

  const salesData = useMemo(() => {
    const now = new Date();

    if (salesPeriod === "year") {
      const months = Array.from(
        { length: 12 },
        (_, index) => {
          const total = orders
            .filter((order) => {
              if (!order.created_at) return false;

              const date = new Date(
                order.created_at
              );

              return (
                date.getFullYear() ===
                  now.getFullYear() &&
                date.getMonth() === index
              );
            })
            .reduce(
              (sum, order) =>
                sum + getAmount(order),
              0
            );

          return {
            label: new Date(
              now.getFullYear(),
              index,
              1
            ).toLocaleDateString("en-US", {
              month: "short",
            }),
            value: total,
          };
        }
      );

      return months;
    }

    const baseDate = new Date(now);

    if (salesPeriod === "last-month") {
      baseDate.setMonth(
        baseDate.getMonth() - 1
      );
    }

    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();

    const daysInMonth = new Date(
      year,
      month + 1,
      0
    ).getDate();

    const days = Array.from(
      { length: daysInMonth },
      (_, index) => {
        const day = index + 1;

        const total = orders
          .filter((order) => {
            if (!order.created_at) return false;

            const date = new Date(
              order.created_at
            );

            return (
              date.getFullYear() === year &&
              date.getMonth() === month &&
              date.getDate() === day
            );
          })
          .reduce(
            (sum, order) =>
              sum + getAmount(order),
            0
          );

        return {
          label: String(day),
          value: total,
        };
      }
    );

    return days;
  }, [orders, salesPeriod]);

  const maxSales = Math.max(
    ...salesData.map((item) => item.value),
    1
  );

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      {/* HEADER */}
      <header className="sticky top-0 z-30 flex min-h-20 items-center justify-between gap-4 border-b border-black/10 bg-white/90 px-8 py-3 backdrop-blur">
        <div className="flex items-center gap-4">
          {/* CATS HOME LOGO */}
          <Link
            href="/"
            className="shrink-0"
          >
            <Image
              src="/cats-home-logo.png"
              alt="CATS HOME"
              width={150}
              height={65}
              priority
              className="h-14 w-auto object-contain"
            />
          </Link>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40">
              CATS HOME Admin
            </p>

            <div className="mt-1 flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                Dashboard
              </h1>

              {!loading && (
                <span className="rounded-full bg-black px-2.5 py-1 text-[10px] font-bold text-white">
                  LIVE
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadDashboard}
            disabled={loading}
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold transition hover:bg-black hover:text-white disabled:opacity-50"
          >
            {loading
              ? "Refreshing..."
              : "Refresh"}
          </button>

          <Link
            href="/"
            className="rounded-xl border border-black/10 px-4 py-2 text-sm font-medium transition hover:bg-black hover:text-white"
          >
            View Store
          </Link>
        </div>
      </header>

      {/* CONTENT */}
      <div className="space-y-8 p-8">
        {/* WELCOME */}
        <section>
          <h2 className="text-3xl font-bold tracking-tight">
            Welcome back 👋
          </h2>

          <p className="mt-2 text-sm text-black/50">
            Manage your CATS HOME store from one place.
          </p>
        </section>

        {/* ERROR */}
        {error && (
          <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
            <div>
              <p className="font-bold text-red-700">
                Dashboard data could not be loaded
              </p>

              <p className="mt-1 text-sm text-red-600">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={loadDashboard}
              className="rounded-xl bg-black px-4 py-2 text-sm font-bold text-white"
            >
              Try Again
            </button>
          </div>
        )}

        {/* MAIN STATS */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Monthly Sales"
            value={
              loading
                ? "..."
                : formatMoney(
                    stats.monthlySales
                  )
            }
            description="This month"
          />

          <StatCard
            title="Monthly Net Profit"
            value="৳0"
            description="Add expense tracking to calculate"
          />

          <StatCard
            title="Total Orders"
            value={
              loading
                ? "..."
                : orders.length.toLocaleString()
            }
            description="All orders"
          />

          <StatCard
            title="Customers"
            value={
              loading
                ? "..."
                : stats.customers.toLocaleString()
            }
            description="Unique customers"
          />
        </section>

        {/* ORDER OVERVIEW */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">
                Order Overview
              </h2>

              <p className="mt-1 text-sm text-black/40">
                Current order status
              </p>
            </div>

            <Link
              href="/admin/orders"
              className="text-sm font-semibold underline underline-offset-4"
            >
              View Orders
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <OrderStatCard
              title="Pending Orders"
              value={orderStats.pending}
            />

            <OrderStatCard
              title="Processing"
              value={orderStats.processing}
            />

            <OrderStatCard
              title="Shipped"
              value={orderStats.shipped}
            />

            <OrderStatCard
              title="Delivered"
              value={orderStats.delivered}
            />
          </div>
        </section>

        {/* SALES OVERVIEW */}
        <section className="rounded-2xl border border-black/10 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">
                Sales Overview
              </h2>

              <p className="mt-1 text-sm text-black/40">
                Sales performance
              </p>
            </div>

            <select
              value={salesPeriod}
              onChange={(event) =>
                setSalesPeriod(
                  event.target.value as
                    | "month"
                    | "last-month"
                    | "year"
                )
              }
              className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none"
            >
              <option value="month">
                This Month
              </option>

              <option value="last-month">
                Last Month
              </option>

              <option value="year">
                This Year
              </option>
            </select>
          </div>

          {loading ? (
            <div className="mt-6 flex h-64 items-center justify-center rounded-xl bg-black/[0.02]">
              <p className="text-sm text-black/40">
                Loading sales data...
              </p>
            </div>
          ) : salesData.some(
              (item) => item.value > 0
            ) ? (
            <div className="mt-6">
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
                    Total
                  </p>

                  <p className="mt-1 text-2xl font-black">
                    {formatMoney(
                      salesData.reduce(
                        (sum, item) =>
                          sum + item.value,
                        0
                      )
                    )}
                  </p>
                </div>
              </div>

              <div className="flex h-64 items-end gap-1 overflow-hidden rounded-xl border border-black/5 bg-[#fafafa] px-3 pb-3 pt-6">
                {salesData.map(
                  (item, index) => {
                    const height =
                      item.value > 0
                        ? Math.max(
                            6,
                            (item.value /
                              maxSales) *
                              100
                          )
                        : 2;

                    return (
                      <div
                        key={`${item.label}-${index}`}
                        className="group flex h-full flex-1 items-end"
                      >
                        <div className="relative flex h-full w-full items-end justify-center">
                          <div
                            className="w-full max-w-6 rounded-t-md bg-black transition-all duration-300 group-hover:bg-[#d4a017]"
                            style={{
                              height: `${height}%`,
                            }}
                            title={`${item.label}: ${formatMoney(
                              item.value
                            )}`}
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              <div className="mt-3 flex justify-between text-[10px] text-black/40">
                {salesPeriod === "year" ? (
                  <>
                    {salesData.map(
                      (item) => (
                        <span
                          key={item.label}
                          className="hidden first:inline last:inline sm:inline"
                        >
                          {item.label}
                        </span>
                      )
                    )}

                    <span className="sm:hidden">
                      Year
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      {salesData[0]?.label}
                    </span>

                    <span>
                      {
                        salesData[
                          salesData.length - 1
                        ]?.label
                      }
                    </span>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-6 flex h-64 items-center justify-center rounded-xl border border-dashed border-black/10 bg-black/[0.02]">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
                  ৳
                </div>

                <p className="mt-4 font-semibold">
                  No sales data yet
                </p>

                <p className="mt-1 text-sm text-black/40">
                  Sales analytics will appear here
                  automatically.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* BOTTOM GRID */}
        <section className="grid gap-6 xl:grid-cols-2">
          {/* RECENT ORDERS */}
          <div className="rounded-2xl border border-black/10 bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Recent Orders
                </h2>

                <p className="mt-1 text-sm text-black/40">
                  Latest customer orders
                </p>
              </div>

              <Link
                href="/admin/orders"
                className="text-sm font-semibold underline underline-offset-4"
              >
                See all
              </Link>
            </div>

            {loading ? (
              <div className="mt-6 flex h-40 items-center justify-center rounded-xl bg-black/[0.02]">
                <p className="text-sm text-black/40">
                  Loading orders...
                </p>
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="mt-6 flex h-40 items-center justify-center rounded-xl bg-black/[0.02]">
                <p className="text-sm text-black/40">
                  No orders yet.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {recentOrders.map(
                  (order, index) => (
                    <div
                      key={
                        order.order_id ||
                        order.id ||
                        index
                      }
                      className="rounded-xl border border-black/5 bg-[#fafafa] p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black">
                            {order.order_id ||
                              `Order #${
                                order.id || "—"
                              }`}
                          </p>

                          <p className="mt-1 truncate text-xs text-black/50">
                            {order.customer_name ||
                              "Unknown Customer"}
                          </p>

                          <p className="mt-1 text-[11px] text-black/40">
                            {formatDate(
                              order.created_at
                            )}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="font-black">
                            {formatMoney(
                              getAmount(order)
                            )}
                          </p>

                          <span
                            className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
                              normalizeStatus(
                                order.order_status
                              ) === "delivered"
                                ? "bg-green-100 text-green-700"
                                : normalizeStatus(
                                      order.order_status
                                    ) ===
                                    "cancelled"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-black text-white"
                            }`}
                          >
                            {order.order_status ||
                              "Order Placed"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* PAYMENT OVERVIEW */}
          <div className="rounded-2xl border border-black/10 bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Payment Overview
                </h2>

                <p className="mt-1 text-sm text-black/40">
                  Current payment status
                </p>
              </div>

              <Link
                href="/admin/payment-verification"
                className="text-sm font-semibold underline underline-offset-4"
              >
                Verify
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              <PaymentRow
                label="Paid"
                count={orders.filter(
                  (order) =>
                    normalizeStatus(
                      order.payment_status
                    ) === "paid"
                ).length}
              />

              <PaymentRow
                label="Pending"
                count={orders.filter(
                  (order) =>
                    normalizeStatus(
                      order.payment_status
                    ) === "pending"
                ).length}
              />

              <PaymentRow
                label="Rejected"
                count={orders.filter(
                  (order) =>
                    normalizeStatus(
                      order.payment_status
                    ) === "rejected"
                ).length}
              />

              <PaymentRow
                label="Other"
                count={orders.filter(
                  (order) => {
                    const status =
                      normalizeStatus(
                        order.payment_status
                      );

                    return (
                      status !== "paid" &&
                      status !== "pending" &&
                      status !== "rejected"
                    );
                  }
                ).length}
              />
            </div>

            <div className="mt-6 rounded-xl bg-black p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
                Total Order Value
              </p>

              <p className="mt-2 text-3xl font-black text-[#d4a017]">
                {formatMoney(
                  orders.reduce(
                    (sum, order) =>
                      sum + getAmount(order),
                    0
                  )
                )}
              </p>

              <p className="mt-1 text-xs text-white/40">
                Based on all orders
              </p>
            </div>
          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section>
          <h2 className="mb-4 text-xl font-bold">
            Quick Actions
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/admin/products"
              className="rounded-2xl bg-black p-5 text-white transition hover:scale-[1.02]"
            >
              <p className="text-lg font-bold">
                + Add Product
              </p>

              <p className="mt-1 text-sm text-white/50">
                Create a new product
              </p>
            </Link>

            <Link
              href="/admin/categories"
              className="rounded-2xl border border-black/10 bg-white p-5 transition hover:bg-black hover:text-white"
            >
              <p className="text-lg font-bold">
                + Add Category
              </p>

              <p className="mt-1 text-sm opacity-50">
                Create a new category
              </p>
            </Link>

            <Link
              href="/admin/payment-verification"
              className="rounded-2xl border border-black/10 bg-white p-5 transition hover:bg-black hover:text-white"
            >
              <p className="text-lg font-bold">
                Verify Payment
              </p>

              <p className="mt-1 text-sm opacity-50">
                Check Transaction ID
              </p>
            </Link>

            <Link
              href="/admin/orders"
              className="rounded-2xl border border-black/10 bg-white p-5 transition hover:bg-black hover:text-white"
            >
              <p className="text-lg font-bold">
                Manage Orders
              </p>

              <p className="mt-1 text-sm opacity-50">
                View customer orders
              </p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <p className="text-sm font-medium text-black/50">
        {title}
      </p>

      <p className="mt-4 text-3xl font-bold">
        {value}
      </p>

      <p className="mt-2 text-xs text-black/40">
        {description}
      </p>
    </div>
  );
}

function OrderStatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-black/50">
          {title}
        </p>

        <span className="h-2 w-2 rounded-full bg-black" />
      </div>

      <p className="mt-4 text-2xl font-bold">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function PaymentRow({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-[#fafafa] px-4 py-3">
      <span className="text-sm font-semibold">
        {label}
      </span>

      <span className="rounded-full bg-black px-3 py-1 text-xs font-bold text-white">
        {count}
      </span>
    </div>
  );
}
