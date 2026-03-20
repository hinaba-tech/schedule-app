import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// GET /api/links/[slug] - スケジューリングリンク情報を取得
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createServerClient();

    const { data: link, error } = await supabase
      .from("scheduling_links")
      .select("*, users(name, email, avatar_url, timezone)")
      .eq("slug", params.slug)
      .eq("is_active", true)
      .single();

    if (error || !link) {
      return NextResponse.json(
        { error: "リンクが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({ link });
  } catch (error) {
    return NextResponse.json(
      { error: "リンク情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}
