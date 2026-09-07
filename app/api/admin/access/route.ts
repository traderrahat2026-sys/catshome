import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAIL = "traderrahat2026@gmail.com";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const code = String(body.code || "").trim();

    const correctCode = process.env.ADMIN_ACCESS_CODE;
    const adminPassword = process.env.SUPABASE_ADMIN_PASSWORD;

    if (!correctCode || !adminPassword) {
      return NextResponse.json(
        { error: "Admin access is not configured." },
        { status: 500 }
      );
    }

    if (code !== correctCode) {
      return NextResponse.json(
        { error: "Invalid access code." },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: adminPassword,
    });

    if (error) {
      console.error("ADMIN SUPABASE LOGIN ERROR:", error);

      return NextResponse.json(
        { error: "Admin login failed." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("ADMIN ACCESS ERROR:", error);

    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}