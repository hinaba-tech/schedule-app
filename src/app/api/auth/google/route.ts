import { NextRequest, NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const authUrl = getGoogleAuthUrl(userId);
  return NextResponse.redirect(authUrl);
}
