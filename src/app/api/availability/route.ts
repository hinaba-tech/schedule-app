import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getAvailableSlots } from "@/lib/google-calendar";

// GET /api/availability?linkId=xxx&date=2025-01-15
// 指定日の空き時間スロットを返す
export async function GET(request: NextRequest) {
  const linkId = request.nextUrl.searchParams.get("linkId");
  const date = request.nextUrl.searchParams.get("date");

  if (!linkId || !date) {
    return NextResponse.json(
      { error: "linkId and date are required" },
      { status: 400 }
    );
  }

  try {
    const supabase = createServerClient();

    // スケジューリングリンク情報を取得
    const { data: link, error: linkError } = await supabase
      .from("scheduling_links")
      .select("*, users(*)")
      .eq("id", linkId)
      .eq("is_active", true)
      .single();

    if (linkError || !link) {
      return NextResponse.json(
        { error: "リンクが見つかりません" },
        { status: 404 }
      );
    }

    // 最小通知時間チェック
    const now = new Date();
    const requestedDate = new Date(date);
    const minNoticeDate = new Date(
      now.getTime() + link.min_notice_hours * 60 * 60 * 1000
    );

    if (requestedDate < new Date(now.toISOString().split("T")[0])) {
      return NextResponse.json({ slots: [] });
    }

    // 最大予約可能日チェック
    const maxDate = new Date(
      now.getTime() + link.max_days_ahead * 24 * 60 * 60 * 1000
    );
    if (requestedDate > maxDate) {
      return NextResponse.json({ slots: [] });
    }

    // 空き時間を計算
    const slots = await getAvailableSlots(
      link.user_id,
      date,
      link.duration_minutes,
      link.availability_rules,
      link.buffer_before_minutes,
      link.buffer_after_minutes,
      link.users?.timezone || "Asia/Tokyo"
    );

    // 最小通知時間を過ぎたスロットを除外
    const filteredSlots = slots.filter(
      (slot) => new Date(slot.start) > minNoticeDate
    );

    return NextResponse.json({ slots: filteredSlots });
  } catch (error) {
    console.error("Availability error:", error);
    return NextResponse.json(
      { error: "空き時間の取得に失敗しました" },
      { status: 500 }
    );
  }
}
