"use client";

import { useEffect, useState } from "react";

type Transaction = {
  id: number;
  transaction_id: string | null;
  order_id: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export default function Page() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<number | null>(null);

  async function fetchTransactions(transactionId = "") {
    try {
      setLoading(true);
      setError("");

      const value = transactionId
        .trim()
        .replace(/\s+/g, "");

      const url = value
        ? `/api/admin/transactions?transaction_id=${encodeURIComponent(
            value
          )}`
        : "/api/admin/transactions";

      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to load transactions"
        );
      }

      setTransactions(
        Array.isArray(result.transactions)
          ? result.transactions
          : []
      );
    } catch (err) {
      console.error(
        "PAYMENT VERIFICATION ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load transactions"
      );

      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function changeStatus(
    id: number,
    status: "Approved" | "Rejected" | "Pending"
  ) {
    try {
      setUpdating(id);
      setError("");

      const response = await fetch(
        "/api/admin/transactions",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
            status,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Failed to update transaction"
        );
      }

      setTransactions((items) =>
        items.map((item) =>
          item.id === id
            ? {
                ...item,
                status,
                updated_at:
                  new Date().toISOString(),
              }
            : item
        )
      );
    } catch (err) {
      console.error(
        "STATUS UPDATE ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update transaction"
      );
    } finally {
      setUpdating(null);
    }
  }

  function statusClass(status: string | null) {
    if (status === "Approved") {
      return "bg-green-100 text-green-700 border-green-200";
    }

    if (status === "Rejected") {
      return "bg-red-100 text-red-700 border-red-200";
    }

    if (status === "Pending") {
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }

    return "bg-gray-100 text-gray-700 border-gray-200";
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Payment Verification
          </h1>

          <p className="mt-2 text-gray-500">
            Review and verify customer payment
            transactions.
          </p>
        </div>

        <div className="mb-6 flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm md:flex-row">

          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                fetchTransactions(search);
              }
            }}
            placeholder="Search transaction ID..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
          />

          <button
            type="button"
            onClick={() =>
              fetchTransactions(search)
            }
            className="rounded-lg bg-black px-6 py-3 font-medium text-white hover:bg-gray-800"
          >
            Search
          </button>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              fetchTransactions();
            }}
            className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-100"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={() =>
              fetchTransactions(search)
            }
            className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-100"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border bg-white p-12 text-center shadow-sm">
            <p className="text-gray-500">
              Loading transactions...
            </p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-xl border bg-white p-12 text-center shadow-sm">

            <h2 className="text-xl font-semibold text-gray-900">
              No transactions found
            </h2>

            <p className="mt-2 text-gray-500">
              {search
                ? `No transaction found for "${search}".`
                : "There are currently no payment transactions."}
            </p>

          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="border-b bg-gray-50">
                  <tr>

                    <th className="px-5 py-4 text-left text-sm font-semibold">
                      ID
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold">
                      Transaction ID
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold">
                      Order ID
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold">
                      Status
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold">
                      Created
                    </th>

                    <th className="px-5 py-4 text-right text-sm font-semibold">
                      Actions
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y">

                  {transactions.map(
                    (transaction) => (
                      <tr
                        key={transaction.id}
                        className="hover:bg-gray-50"
                      >

                        <td className="px-5 py-4">
                          #{transaction.id}
                        </td>

                        <td className="px-5 py-4 font-mono text-sm font-semibold">
                          {transaction.transaction_id ||
                            "—"}
                        </td>

                        <td className="px-5 py-4">
                          {transaction.order_id ||
                            "—"}
                        </td>

                        <td className="px-5 py-4">

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(
                              transaction.status
                            )}`}
                          >
                            {transaction.status ||
                              "Unknown"}
                          </span>

                        </td>

                        <td className="px-5 py-4 text-sm text-gray-500">
                          {transaction.created_at
                            ? new Date(
                                transaction.created_at
                              ).toLocaleString()
                            : "—"}
                        </td>

                        <td className="px-5 py-4">

                          <div className="flex justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                changeStatus(
                                  transaction.id,
                                  "Approved"
                                )
                              }
                              disabled={
                                updating ===
                                transaction.id
                              }
                              className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              {updating ===
                              transaction.id
                                ? "Updating..."
                                : "Approve"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                changeStatus(
                                  transaction.id,
                                  "Rejected"
                                )
                              }
                              disabled={
                                updating ===
                                transaction.id
                              }
                              className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              Reject
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                changeStatus(
                                  transaction.id,
                                  "Pending"
                                )
                              }
                              disabled={
                                updating ===
                                transaction.id
                              }
                              className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                            >
                              Pending
                            </button>

                          </div>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>

          </div>
        )}

      </div>
    </main>
  );
}
