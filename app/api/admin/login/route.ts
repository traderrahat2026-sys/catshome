import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_USERNAME = "cats home admin";
const ADMIN_EMAIL = "traderrahat2026@gmail.com";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const username = String(body.username ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (username !== ADMIN_USERNAME) {
      return NextResponse.json(
        { error: "Username is incorrect." },
        { status: 401 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: "Password is required." },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password,
    });

    if (error) {
      console.error("ADMIN SUPABASE LOGIN ERROR:", error);

      return NextResponse.json(
        { error: "Invalid login credentials." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);

    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}