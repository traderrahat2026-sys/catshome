import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_STATUSES = ["Approved", "Rejected", "Pending"] as const;

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);

    const transactionId =
      searchParams.get("transaction_id")?.trim() ?? "";

    let query = supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });

    // Search transaction ID
    if (transactionId) {
      query = query.ilike(
        "transaction_id",
        `%${transactionId}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error(
        "ADMIN TRANSACTIONS GET ERROR:",
        error
      );

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      transactions: data ?? [],
    });
  } catch (error) {
    console.error(
      "ADMIN TRANSACTIONS API ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
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

    const body = await request.json();

    const transactionId = Number(body.id);
    const status = String(body.status ?? "").trim();

    if (!Number.isInteger(transactionId)) {
      return NextResponse.json(
        { error: "Invalid transaction ID." },
        { status: 400 }
      );
    }

    if (!ALLOWED_STATUSES.includes(status as any)) {
      return NextResponse.json(
        { error: "Invalid transaction status." },
        { status: 400 }
      );
    }

    const { data: transaction, error: transactionError } =
      await supabase
        .from("transactions")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", transactionId)
        .select()
        .single();

    if (transactionError) {
      console.error(
        "TRANSACTION UPDATE ERROR:",
        transactionError
      );

      return NextResponse.json(
        { error: transactionError.message },
        { status: 500 }
      );
    }

    // Update order payment status
    if (status === "Approved" || status === "Rejected") {
      const orderPaymentStatus =
        status === "Approved" ? "Paid" : "Rejected";

      const { error: orderError } = await supabase
        .from("orders")
        .update({
          payment_status: orderPaymentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", transaction.order_id);

      if (orderError) {
        console.error(
          "ORDER PAYMENT UPDATE ERROR:",
          orderError
        );

        return NextResponse.json(
          { error: orderError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      transaction,
    });
  } catch (error) {
    console.error(
      "ADMIN TRANSACTIONS PATCH ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}
