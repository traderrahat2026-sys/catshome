"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Order = {
  id: number;
  order_id: string;
  customer_name: string;
  phone: string;
  amount: number;
  payment_status: string;
  order_status: string;
  created_at: string;
};

type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  orders: number;
  spent: number;
};

export default function AdminCustomersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function loadCustomers() {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/customers", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Customers load error:", data.error);
        setOrders([]);
        setCustomers([]);
        return;
      }

      setCustomers(data.customers ?? []);
      setOrders(
        Array.from({ length: Number(data.totalOrders ?? 0) }, () => ({
          id: 0,
          order_id: "",
          customer_name: "",
          phone: "",
          amount: 0,
          payment_status: "",
          order_status: "",
          created_at: "",
        }))
      );
    } catch (error) {
      console.error("Customers load error:", error);
      setOrders([]);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCustomers();
  }, []);

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      customer.phone.includes(search)
  );

  const totalSpending = customers.reduce(
    (total, customer) => total + customer.spent,
    0
  );

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-black/10 bg-white/90 px-8 backdrop-blur">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40">
            CATS HOME Admin
          </p>

          <h1 className="mt-1 text-2xl font-bold">
            Customers
          </h1>
        </div>

        <Link
          href="/admin"
          className="rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold transition hover:bg-black hover:text-white"
        >
          Dashboard
        </Link>
      </header>

      <main className="space-y-6 p-8">
        <section className="grid gap-4 sm:grid-cols-3">
          <SummaryCard
            title="Total Customers"
            value={customers.length.toLocaleString()}
          />

          <SummaryCard
            title="Total Orders"
            value={orders.length.toLocaleString()}
          />

          <SummaryCard
            title="Total Customer Spending"
            value={`৳${totalSpending.toLocaleString()}`}
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-black/10 bg-white">
          <div className="flex flex-col gap-4 border-b border-black/10 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">
                All Customers
              </h2>

              <p className="mt-1 text-sm text-black/40">
                View customer information and order history
              </p>
            </div>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer..."
              className="rounded-xl border border-black/10 px-4 py-2 text-sm outline-none focus:border-black"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="border-b border-black/10 bg-black/[0.02]">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">
                    Customer
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">
                    Phone
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">
                    Email
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">
                    Orders
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">
                    Total Spent
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
                      colSpan={6}
                      className="px-6 py-10 text-center text-sm text-black/40"
                    >
                      Loading customers...
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-sm text-black/40"
                    >
                      No customers found.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b border-black/10 last:border-0"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-sm font-bold text-white">
                            {customer.name
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <p className="font-semibold">
                              {customer.name}
                            </p>

                            <p className="text-xs text-black/40">
                              {customer.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-sm">
                        {customer.phone}
                      </td>

                      <td className="px-6 py-5 text-sm">
                        {customer.email}
                      </td>

                      <td className="px-6 py-5 font-semibold">
                        {customer.orders}
                      </td>

                      <td className="px-6 py-5 font-bold">
                        ৳{customer.spent.toLocaleString()}
                      </td>

                      <td className="px-6 py-5">
                        <Link
                          href={`/admin/orders?customer=${encodeURIComponent(
                            customer.phone
                          )}`}
                          className="rounded-lg border border-black/10 px-3 py-2 text-xs font-semibold transition hover:bg-black hover:text-white"
                        >
                          View Orders
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {!loading && customers.length === 0 && (
          <div className="rounded-2xl border border-dashed border-black/10 bg-white p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-black text-xl text-white">
              ♙
            </div>

            <h3 className="mt-4 font-bold">
              No customers yet
            </h3>

            <p className="mt-2 text-sm text-black/40">
              Customer information will appear here when
              customers place orders.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6">
      <p className="text-sm text-black/50">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold">
        {value}
      </p>
    </div>
  );
}
