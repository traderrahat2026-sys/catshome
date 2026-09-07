"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Transaction = {
  id: number;
  transaction_id: string;
  order_id: string;
  customer_name: string;
  phone: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
};

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function loadTransactions() {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/transactions", {
        method: "GET",
        cache: "no-store",
      });

      const responseText = await response.text();

      let data: {
        transactions?: Transaction[];
        error?: string;
      } = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        console.error(
          "INVALID TRANSACTIONS API RESPONSE:",
          responseText
        );
        setTransactions([]);
        return;
      }

      if (!response.ok) {
        console.error(
          "Transaction load error:",
          data.error ?? `HTTP ${response.status}`
        );
        setTransactions([]);
        return;
      }

      setTransactions(data.transactions ?? []);
    } catch (error) {
      console.error("Transaction load error:", error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTransactions();
  }, []);

  const filteredTransactions = transactions.filter((transaction) => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) return true;

    return (
      transaction.transaction_id.toLowerCase().includes(keyword) ||
      transaction.order_id.toLowerCase().includes(keyword) ||
      transaction.customer_name.toLowerCase().includes(keyword) ||
      transaction.phone.toLowerCase().includes(keyword)
    );
  });

  const approvedTransactions = transactions.filter(
    (transaction) => transaction.status === "Approved"
  );

  const totalRevenue = approvedTransactions.reduce(
    (total, transaction) =>
      total + Number(transaction.amount),
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
            Transactions
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
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Revenue"
            value={`৳${totalRevenue.toLocaleString()}`}
          />

          <SummaryCard
            title="Product Cost"
            value="৳0"
          />

          <SummaryCard
            title="Delivery Cost"
            value="৳0"
          />

          <SummaryCard
            title="Net Profit"
            value={`৳${totalRevenue.toLocaleString()}`}
          />
        </section>

        <section className="rounded-2xl border border-black/10 bg-white p-6">
          <div>
            <h2 className="text-xl font-bold">
              Transaction History
            </h2>

            <p className="mt-1 text-sm text-black/40">
              Track payments, expenses and profit
            </p>
          </div>

          <div className="mt-5">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Transaction ID, Order ID, Customer or Phone..."
              className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black"
            />
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-black/10 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left">
              <thead className="border-b border-black/10 bg-black/[0.02]">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">
                    Transaction ID
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">
                    Order ID
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">
                    Customer
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">
                    Payment Method
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">
                    Amount
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">
                    Status
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">
                    Date
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
                      Loading transactions...
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-10 text-center text-sm text-black/40"
                    >
                      {transactions.length === 0
                        ? "No transactions found."
                        : "No matching transactions found."}
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-black/10 last:border-0"
                    >
                      <td className="px-6 py-5">
                        <span className="font-bold">
                          {transaction.transaction_id}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <span className="font-semibold">
                          #{transaction.order_id}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-sm">
                        <div className="font-semibold">
                          {transaction.customer_name}
                        </div>

                        <div className="mt-1 text-xs text-black/40">
                          {transaction.phone}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold">
                          {transaction.payment_method}
                        </span>
                      </td>

                      <td className="px-6 py-5 font-bold">
                        ৳{Number(transaction.amount).toLocaleString()}
                      </td>

                      <td className="px-6 py-5">
                        <StatusBadge status={transaction.status} />
                      </td>

                      <td className="px-6 py-5 text-sm text-black/40">
                        {new Date(
                          transaction.created_at
                        ).toLocaleString()}
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

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const className =
    status === "Approved"
      ? "bg-green-100 text-green-700"
      : status === "Rejected"
      ? "bg-red-100 text-red-700"
      : "bg-yellow-100 text-yellow-700";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${className}`}
    >
      {status}
    </span>
  );
}
