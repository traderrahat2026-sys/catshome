import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (typeof error === "object" && error !== null) {
    const err = error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };

    return (
      err.message ||
      err.details ||
      err.hint ||
      (err.code ? `Database error (Code: ${err.code})` : "")
    );
  }

  return "Something went wrong.";
}

async function getAuthenticatedSupabase() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("ADMIN USER ERROR:", userError);
  }

  if (!user) {
    return {
      supabase,
      user: null,
    };
  }

  return {
    supabase,
    user,
  };
}

/* =========================
   GET PRODUCTS
========================= */

export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedSupabase();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please login again." },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("PRODUCT GET DATABASE ERROR:", error);

      return NextResponse.json(
        {
          error: getErrorMessage(error),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      products: data ?? [],
    });
  } catch (error) {
    console.error("PRODUCT GET ERROR:", error);

    return NextResponse.json(
      {
        error: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

/* =========================
   CREATE PRODUCT
========================= */

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedSupabase();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please login again." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const title = String(body.title ?? "").trim();

    if (!title) {
      return NextResponse.json(
        { error: "Product title is required." },
        { status: 400 }
      );
    }

    const payload = {
      title,
      description: String(body.description ?? "").trim(),

      category: String(body.category ?? "").trim(),

      image_url: String(body.image_url ?? "").trim(),

      image_urls: Array.isArray(body.image_urls)
        ? body.image_urls
        : [],

      regular_price: Number(body.regular_price ?? 0),

      discount: Number(body.discount ?? 0),

      offer_price: Number(body.offer_price ?? 0),

      stock: Number(body.stock ?? 0),

      has_colours: Boolean(body.has_colours),

      colours: Array.isArray(body.colours)
        ? body.colours
        : [],

      has_sizes: Boolean(body.has_sizes),

      sizes: Array.isArray(body.sizes)
        ? body.sizes
        : [],

      is_gadget: Boolean(body.is_gadget),

      is_hot_sale: Boolean(body.is_hot_sale),

      is_offer: Boolean(body.is_offer),

      created_at: new Date().toISOString(),

      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("products")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      console.error("PRODUCT INSERT DATABASE ERROR:", error);

      return NextResponse.json(
        {
          error: getErrorMessage(error),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      product: data,
    });
  } catch (error) {
    console.error("PRODUCT POST ERROR:", error);

    return NextResponse.json(
      {
        error: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

/* =========================
   UPDATE PRODUCT
========================= */

export async function PATCH(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedSupabase();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please login again." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const id = Number(body.id);

    if (!Number.isInteger(id)) {
      return NextResponse.json(
        { error: "Invalid product ID." },
        { status: 400 }
      );
    }

    const payload = {
      title: String(body.title ?? "").trim(),

      description: String(body.description ?? "").trim(),

      category: String(body.category ?? "").trim(),

      image_url: String(body.image_url ?? "").trim(),

      image_urls: Array.isArray(body.image_urls)
        ? body.image_urls
        : [],

      regular_price: Number(body.regular_price ?? 0),

      discount: Number(body.discount ?? 0),

      offer_price: Number(body.offer_price ?? 0),

      stock: Number(body.stock ?? 0),

      has_colours: Boolean(body.has_colours),

      colours: Array.isArray(body.colours)
        ? body.colours
        : [],

      has_sizes: Boolean(body.has_sizes),

      sizes: Array.isArray(body.sizes)
        ? body.sizes
        : [],

      is_gadget: Boolean(body.is_gadget),

      is_hot_sale: Boolean(body.is_hot_sale),

      is_offer: Boolean(body.is_offer),

      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("PRODUCT UPDATE DATABASE ERROR:", error);

      return NextResponse.json(
        {
          error: getErrorMessage(error),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      product: data,
    });
  } catch (error) {
    console.error("PRODUCT PATCH ERROR:", error);

    return NextResponse.json(
      {
        error: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE PRODUCT
========================= */

export async function DELETE(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedSupabase();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please login again." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const id = Number(searchParams.get("id"));

    if (!Number.isInteger(id)) {
      return NextResponse.json(
        { error: "Invalid product ID." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("PRODUCT DELETE DATABASE ERROR:", error);

      return NextResponse.json(
        {
          error: getErrorMessage(error),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("PRODUCT DELETE ERROR:", error);

    return NextResponse.json(
      {
        error: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
