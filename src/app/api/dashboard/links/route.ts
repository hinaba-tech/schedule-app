import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// GET /api/dashboard/links - ユーザーのリンク一覧
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    // TODO: 実際にはauth経由でuser_idを取得
    const { data: links } = await supabase
      .from("scheduling_links")
      .select("*")
      .order("created_at", { ascending: false });

    return NextResponse.json({ links: links || [] });
  } catch (error) {
    return NextResponse.json({ links: [] });
  }
}

// POST /api/dashboard/links - 新規リンク作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createServerClient();

    const { data: link, error } = await supabase
      .from("scheduling_links")
      .insert({
        user_id: body.user_id,
        slug: body.slug,
        title: body.title,
        description: body.description,
        duration_minutes: body.duration_minutes,
        location_type: body.location_type,
        color: body.color,
        availability_rules: body.availability_rules,
        buffer_before_minutes: body.buffer_before_minutes || 0,
        buffer_after_minutes: body.buffer_after_minutes || 0,
        min_notice_hours: body.min_notice_hours || 24,
        max_days_ahead: body.max_days_ahead || 60,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ link });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "作成に失敗しました" },
      { status: 500 }
    );
  }
}
