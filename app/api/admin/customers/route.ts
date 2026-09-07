import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("ADMIN CUSTOMERS ERROR:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const customerMap = new Map<
      string,
      {
        id: string;
        name: string;
        phone: string;
        email: string;
        orders: number;
        spent: number;
      }
    >();

    (data ?? []).forEach((order) => {
      const phone = String(order.phone ?? "").trim();

      if (!phone) return;

      if (!customerMap.has(phone)) {
        customerMap.set(phone, {
          id: `CUS-${String(customerMap.size + 1).padStart(3, "0")}`,
          name: order.customer_name ?? "Unknown Customer",
          phone,
          email: "—",
          orders: 0,
          spent: 0,
        });
      }

      const customer = customerMap.get(phone)!;

      customer.orders += 1;
      customer.spent += Number(order.amount ?? 0);
    });

    return NextResponse.json({
      customers: Array.from(customerMap.values()),
      totalOrders: data?.length ?? 0,
    });
  } catch (error) {
    console.error("ADMIN CUSTOMERS API ERROR:", error);

    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}
