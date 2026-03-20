import { NextRequest, NextResponse } from "next/server";
import { oauth2Client } from "@/lib/google-calendar";
import { createServerClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const userId = request.nextUrl.searchParams.get("state");

  if (!code || !userId) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=missing_params`
    );
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    const supabase = createServerClient();

    await supabase
      .from("users")
      .update({
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
      })
      .eq("id", userId);

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=google_connected`
    );
  } catch (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=oauth_failed`
    );
  }
}
