import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// GET /api/dashboard/bookings - 予約一覧
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    const { data: bookings } = await supabase
      .from("bookings")
      .select("*, scheduling_links(title, color, user_id)")
      .order("start_time", { ascending: false })
      .limit(50);

    return NextResponse.json({ bookings: bookings || [] });
  } catch (error) {
    return NextResponse.json({ bookings: [] });
  }
}
