import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        title,
        description,
        category,
        image_url,
        image_urls,
        regular_price,
        discount,
        offer_price,
        stock,
        has_colours,
        colours,
        has_sizes,
        sizes,
        is_gadget,
        is_hot_sale,
        is_offer,
        created_at
      `)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("PUBLIC PRODUCTS DATABASE ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      products: data ?? [],
    });
  } catch (error) {
    console.error("PUBLIC PRODUCTS API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Server error.",
      },
      { status: 500 }
    );
  }
}
