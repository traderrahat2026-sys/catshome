import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_USERNAME = "CATS HOME founder";
const ADMIN_EMAIL = "forbussines0101@gmail.com";

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
      console.error("SUPABASE LOGIN ERROR:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return NextResponse.json(
      { error: "Login server error." },
      { status: 500 }
    );
  }
}
