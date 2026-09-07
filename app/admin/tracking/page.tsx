"use client";

import Link from "next/link";
import { useState } from "react";

type TrackingStatus =
  | "Order Placed"
  | "Confirmed"
  | "Processing"
  | "Shipped"
  | "Out for Delivery"
  | "Delivered";

type Order = {
  order_id: string;
  customer_name: string;
  phone: string;
  amount: number;
  payment_status: string;
  order_status: string;
};

const trackingSteps: TrackingStatus[] = [
  "Order Placed",
  "Confirmed",
  "Processing",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

async function readApiResponse(response: Response) {
  const text = await response.text();
  if (!text) return { error: `Empty server response (${response.status})` };
  try {
    return JSON.parse(text) as { order?: Order; error?: string };
  } catch {
    return { error: `Server returned HTML instead of JSON. Status: ${response.status}` };
  }
}

export default function AdminTrackingPage() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function searchOrder() {
    const cleanOrderId = orderId.trim().replace(/^#/, "");
    if (!cleanOrderId) {
      setMessage("Please enter an Order ID.");
      setOrder(null);
      return;
    }
    setLoading(true);
    setMessage("");
    setOrder(null);
    try {
      const response = await fetch(`/api/admin/tracking?orderId=${encodeURIComponent(cleanOrderId)}`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      const data = await readApiResponse(response);
      if (!response.ok) setMessage(data.error ?? `Failed to find order. HTTP ${response.status}`);
      else if (!data.order) setMessage("Order not found.");
      else setOrder(data.order);
    } catch {
      setMessage("Unable to connect to the tracking API.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(status: TrackingStatus) {
    if (!order) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/tracking", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ orderId: order.order_id, status }),
      });
      const data = await readApiResponse(response);
      if (!response.ok) setMessage(data.error ?? `Failed to update status. HTTP ${response.status}`);
      else if (data.order) {
        setOrder(data.order);
        setMessage(`Order status updated to "${status}".`);
      }
    } catch {
      setMessage("Unable to connect to the tracking API.");
    } finally {
      setLoading(false);
    }
  }

  const currentStep = order ? trackingSteps.indexOf(order.order_status as TrackingStatus) : -1;

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="sticky top-0 z-30 flex min-h-20 items-center justify-between gap-4 border-b border-black/10 bg-white/90 px-4 py-4 backdrop-blur md:px-8">
        <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40">CATS HOME Admin</p><h1 className="mt-1 text-2xl font-bold">Order Tracking</h1></div>
        <Link href="/admin" className="rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold transition hover:bg-black hover:text-white">Dashboard</Link>
      </header>
      <main className="space-y-6 p-4 md:p-8">
        <section className="rounded-2xl border border-black/10 bg-white p-5 md:p-6">
          <h2 className="text-xl font-bold">Track an Order</h2>
          <p className="mt-1 text-sm text-black/40">Search using Order ID to view and update tracking.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input value={orderId} onChange={(event) => setOrderId(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void searchOrder(); }} placeholder="Enter Order ID e.g. CATS HOME-1001" className="flex-1 rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black" />
            <button type="button" onClick={() => void searchOrder()} disabled={loading} className="rounded-xl bg-black px-6 py-3 text-sm font-bold text-white disabled:opacity-50">{loading ? "Please wait..." : "Search Order"}</button>
          </div>
          {message && <p className="mt-4 rounded-xl border border-black/10 bg-black/[0.03] p-4 text-sm font-semibold">{message}</p>}
        </section>
        {order ? <>
          <section className="rounded-2xl border border-black/10 bg-white p-5 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-black/40">Order ID</p><h2 className="mt-1 break-all text-2xl font-bold">{order.order_id}</h2></div><div className="rounded-xl bg-black px-4 py-3 text-white"><p className="text-xs text-white/50">Order Status</p><p className="mt-1 font-bold">{order.order_status}</p></div></div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4"><Info label="Customer" value={order.customer_name || "-"} /><Info label="Phone" value={order.phone || "-"} /><Info label="Amount" value={`৳${Number(order.amount || 0).toLocaleString()}`} /><Info label="Payment" value={order.payment_status || "-"} /></div>
          </section>
          <section className="rounded-2xl border border-black/10 bg-white"><div className="border-b border-black/10 p-5 md:p-6"><h2 className="text-xl font-bold">Order Status Timeline</h2><p className="mt-1 text-sm text-black/40">Click any step to update the order status.</p></div><div className="space-y-3 p-5 md:p-6">
            {trackingSteps.map((step, index) => { const current = step === order.order_status; const active = currentStep >= 0 && index <= currentStep; return <div key={step} className={`flex flex-col gap-4 rounded-2xl border p-5 md:flex-row md:items-center md:justify-between ${current ? "border-black bg-black text-white" : active ? "border-black/20 bg-black/[0.03]" : "border-black/10"}`}><div className="flex items-center gap-4"><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${current ? "bg-white text-black" : active ? "bg-black text-white" : "bg-black/10 text-black/50"}`}>{index + 1}</div><div><p className="font-bold">{step}</p><p className={`mt-1 text-xs ${current ? "text-white/50" : "text-black/40"}`}>Step {index + 1} of {trackingSteps.length}</p></div></div><button type="button" onClick={() => void updateStatus(step)} disabled={loading || current} className={`rounded-xl px-5 py-3 text-sm font-bold ${current ? "bg-white/10 text-white/50" : "bg-black text-white"}`}>{current ? "Current Status" : loading ? "Updating..." : "Set Status"}</button></div>; })}
          </div></section>
        </> : <div className="rounded-2xl border border-dashed border-black/10 bg-white p-10 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-black text-xl text-white">→</div><h3 className="mt-4 font-bold">No order selected</h3><p className="mt-2 text-sm text-black/40">Enter an Order ID above to manage its tracking.</p></div>}
      </main>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-black/10 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-black/40">{label}</p><p className="mt-2 break-words font-bold">{value}</p></div>;
}

