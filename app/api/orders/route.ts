import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const orderId = String(body.order_id ?? "").trim();
    const customerName = String(body.customer_name ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const amount = Number(body.amount ?? 0);

    const paymentMethod = String(body.payment_method ?? "")
      .trim()
      .toLowerCase();

    const transactionId = String(body.transaction_id ?? "").trim();

    if (
      !orderId ||
      !customerName ||
      !phone ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return NextResponse.json(
        { error: "Invalid order data." },
        { status: 400 }
      );
    }

    if (!["cod", "bkash"].includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method." },
        { status: 400 }
      );
    }

    if (paymentMethod === "bkash" && !transactionId) {
      return NextResponse.json(
        { error: "bKash Transaction ID is required." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_id: orderId,
        customer_name: customerName,
        phone,
        amount,
        payment_status: "Pending",
        order_status: "Order Placed",
      })
      .select()
      .single();

    if (orderError) {
      console.error("ORDER INSERT ERROR:", orderError);

      return NextResponse.json(
        { error: orderError.message },
        { status: 500 }
      );
    }

    if (paymentMethod === "bkash") {
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          transaction_id: transactionId,
          order_id: orderId,
          customer_name: customerName,
          phone,
          amount,
          payment_method: "bKash",
          status: "Pending",
        });

      if (transactionError) {
        console.error(
          "TRANSACTION INSERT ERROR:",
          transactionError
        );

        return NextResponse.json(
          { error: transactionError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("ORDERS API ERROR:", error);

    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}
