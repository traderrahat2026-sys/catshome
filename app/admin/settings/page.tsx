"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type OrderStatus = "Pending" | "Confirmed" | "Processing";

export default function AdminSettingsPage() {
  const [storeName, setStoreName] = useState("CATS HOME");
  const [email, setEmail] = useState("admin@CATS HOMEcom");
  const [phone, setPhone] = useState("+880 1XXXXXXXXX");
  const [address, setAddress] = useState("Dhaka, Bangladesh");

  const [cod, setCod] = useState(true);
  const [bkash, setBkash] = useState(true);
  const [nagad, setNagad] = useState(true);

  const [currency, setCurrency] = useState("BDT");
  const [defaultOrderStatus, setDefaultOrderStatus] =
    useState<OrderStatus>("Pending");

  const [metaPixelId, setMetaPixelId] = useState("");
  const [pixelEnabled, setPixelEnabled] = useState(false);

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Actual settings row ID from Supabase
  const [settingsId, setSettingsId] = useState<number | string | null>(null);

  // Load settings from Supabase
  useEffect(() => {
    async function loadSettings() {
      setLoading(true);

      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Settings load error:", error);
        alert(`Could not load settings:\n${error.message}`);
        setLoading(false);
        return;
      }

      if (data) {
        // IMPORTANT:
        // Save using the real database ID instead of assuming id = 1
        setSettingsId(data.id);

        setStoreName(data.store_name ?? "CATS HOME");
        setEmail(data.email ?? "admin@CATS HOMEcom");
        setPhone(data.phone ?? "+880 1XXXXXXXXX");
        setAddress(data.address ?? "Dhaka, Bangladesh");

        setCod(data.cod_enabled ?? true);
        setBkash(data.bkash_enabled ?? true);
        setNagad(data.nagad_enabled ?? true);

        setCurrency(data.currency ?? "BDT");

        setDefaultOrderStatus(
          data.default_order_status ?? "Pending"
        );

        setMetaPixelId(data.meta_pixel_id ?? "");
        setPixelEnabled(Boolean(data.meta_pixel_id));
      }

      setLoading(false);
    }

    loadSettings();
  }, []);

  async function handleSave() {
    if (saving) return;

    setSaved(false);
    setSaving(true);

    const settingsData = {
      store_name: storeName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),

      cod_enabled: cod,
      bkash_enabled: bkash,
      nagad_enabled: nagad,

      currency,
      default_order_status: defaultOrderStatus,

      meta_pixel_id: pixelEnabled
        ? metaPixelId.trim()
        : "",

      updated_at: new Date().toISOString(),
    };

    try {
      // --------------------------------------------------
      // UPDATE EXISTING SETTINGS
      // --------------------------------------------------
      if (settingsId !== null) {
        const { data, error } = await supabase
          .from("settings")
          .update(settingsData)
          .eq("id", settingsId)
          .select("*")
          .single();

        if (error) {
          console.error("Settings update error:", error);

          alert(
            `Could not save settings:\n\n${error.message}`
          );

          return;
        }

        if (!data) {
          alert(
            "Settings could not be saved because the settings record was not found."
          );

          return;
        }

        // Update local state with the actual database values
        setSettingsId(data.id);

        setStoreName(data.store_name ?? "");
        setEmail(data.email ?? "");
        setPhone(data.phone ?? "");
        setAddress(data.address ?? "");

        setCod(data.cod_enabled ?? true);
        setBkash(data.bkash_enabled ?? true);
        setNagad(data.nagad_enabled ?? true);

        setCurrency(data.currency ?? "BDT");

        setDefaultOrderStatus(
          data.default_order_status ?? "Pending"
        );

        setMetaPixelId(data.meta_pixel_id ?? "");
        setPixelEnabled(Boolean(data.meta_pixel_id));

        setSaved(true);

        setTimeout(() => {
          setSaved(false);
        }, 2500);

        return;
      }

      // --------------------------------------------------
      // CREATE SETTINGS IF NO SETTINGS ROW EXISTS
      // --------------------------------------------------
      const { data, error } = await supabase
        .from("settings")
        .insert(settingsData)
        .select("*")
        .single();

      if (error) {
        console.error("Settings insert error:", error);

        alert(
          `Could not create settings:\n\n${error.message}`
        );

        return;
      }

      if (!data) {
        alert("Settings were not created.");
        return;
      }

      // Store the newly created database ID
      setSettingsId(data.id);

      setStoreName(data.store_name ?? "");
      setEmail(data.email ?? "");
      setPhone(data.phone ?? "");
      setAddress(data.address ?? "");

      setCod(data.cod_enabled ?? true);
      setBkash(data.bkash_enabled ?? true);
      setNagad(data.nagad_enabled ?? true);

      setCurrency(data.currency ?? "BDT");

      setDefaultOrderStatus(
        data.default_order_status ?? "Pending"
      );

      setMetaPixelId(data.meta_pixel_id ?? "");
      setPixelEnabled(Boolean(data.meta_pixel_id));

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch (error) {
      console.error("Unexpected settings save error:", error);

      alert(
        "Something went wrong while saving settings."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5]">
        <p className="text-sm font-semibold text-black/50">
          Loading settings...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-black/10 bg-white/90 px-8 backdrop-blur">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40">
            CATS HOME Admin
          </p>

          <h1 className="mt-1 text-2xl font-bold">
            Settings
          </h1>
        </div>

        <Link
          href="/admin"
          className="rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold transition hover:bg-black hover:text-white"
        >
          Dashboard
        </Link>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 p-8">
        {/* Store Information */}
        <section className="rounded-2xl border border-black/10 bg-white">
          <div className="border-b border-black/10 p-6">
            <h2 className="text-xl font-bold">
              Store Information
            </h2>

            <p className="mt-1 text-sm text-black/40">
              Basic information about your CATS HOME store.
            </p>
          </div>

          <div className="grid gap-5 p-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Store Name
              </label>

              <input
                value={storeName}
                onChange={(e) =>
                  setStoreName(e.target.value)
                }
                className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Phone
              </label>

              <input
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Address
              </label>

              <input
                value={address}
                onChange={(e) =>
                  setAddress(e.target.value)
                }
                className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black"
              />
            </div>
          </div>
        </section>

        {/* Payment Methods */}
        <section className="rounded-2xl border border-black/10 bg-white">
          <div className="border-b border-black/10 p-6">
            <h2 className="text-xl font-bold">
              Payment Methods
            </h2>

            <p className="mt-1 text-sm text-black/40">
              Enable or disable payment methods for customers.
            </p>
          </div>

          <div className="divide-y divide-black/10">
            <PaymentToggle
              name="Cash on Delivery"
              description="Allow customers to pay when the order is delivered."
              enabled={cod}
              onChange={setCod}
            />

            <PaymentToggle
              name="bKash"
              description="Accept bKash payments."
              enabled={bkash}
              onChange={setBkash}
            />

            <PaymentToggle
              name="Nagad"
              description="Accept Nagad payments."
              enabled={nagad}
              onChange={setNagad}
            />
          </div>
        </section>

        {/* Meta Pixel */}
        <section className="rounded-2xl border border-black/10 bg-white">
          <div className="border-b border-black/10 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">
                  Meta Pixel
                </h2>

                <p className="mt-1 text-sm text-black/40">
                  Connect your Meta Pixel for website tracking,
                  ads and conversion events.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setPixelEnabled(!pixelEnabled)
                }
                className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                  pixelEnabled
                    ? "bg-black"
                    : "bg-black/20"
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                    pixelEnabled
                      ? "left-6"
                      : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="p-6">
            <label className="mb-2 block text-sm font-semibold">
              Meta Pixel ID
            </label>

            <input
              type="text"
              value={metaPixelId}
              onChange={(e) =>
                setMetaPixelId(e.target.value)
              }
              placeholder="Enter your Meta Pixel ID"
              className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black"
            />

            <p className="mt-2 text-xs text-black/40">
              Example: 123456789012345
            </p>

            <div className="mt-4 rounded-xl bg-black/[0.03] p-4">
              <p className="text-sm font-semibold">
                {pixelEnabled
                  ? "✓ Meta Pixel is enabled"
                  : "○ Meta Pixel is disabled"}
              </p>

              <p className="mt-1 text-xs text-black/40">
                Save your settings after entering the Pixel ID.
              </p>
            </div>
          </div>
        </section>

        {/* Order Settings */}
        <section className="rounded-2xl border border-black/10 bg-white">
          <div className="border-b border-black/10 p-6">
            <h2 className="text-xl font-bold">
              Order Settings
            </h2>

            <p className="mt-1 text-sm text-black/40">
              Configure basic order behavior.
            </p>
          </div>

          <div className="grid gap-5 p-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Currency
              </label>

              <select
                value={currency}
                onChange={(e) =>
                  setCurrency(e.target.value)
                }
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-black"
              >
                <option value="BDT">
                  BDT — ৳
                </option>

                <option value="USD">
                  USD — $
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Default Order Status
              </label>

              <select
                value={defaultOrderStatus}
                onChange={(e) =>
                  setDefaultOrderStatus(
                    e.target.value as OrderStatus
                  )
                }
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-black"
              >
                <option value="Pending">
                  Pending
                </option>

                <option value="Confirmed">
                  Confirmed
                </option>

                <option value="Processing">
                  Processing
                </option>
              </select>
            </div>
          </div>
        </section>

        {/* Save */}
        <div className="flex items-center justify-end gap-4">
          {saved && (
            <span className="text-sm font-semibold text-green-600">
              ✓ Settings saved successfully
            </span>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-black px-6 py-3 text-sm font-bold text-white transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </main>
    </div>
  );
}

function PaymentToggle({
  name,
  description,
  enabled,
  onChange,
}: {
  name: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-5 p-6">
      <div>
        <h3 className="font-bold">
          {name}
        </h3>

        <p className="mt-1 text-sm text-black/40">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          enabled
            ? "bg-black"
            : "bg-black/20"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
            enabled
              ? "left-6"
              : "left-1"
          }`}
        />
      </button>
    </div>
  );
}
