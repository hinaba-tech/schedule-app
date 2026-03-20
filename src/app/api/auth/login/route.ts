import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();
    const supabase = createServerClient();

    // 既存ユーザーを検索
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (existingUser) {
      // ログイン成功
      const response = NextResponse.json({ user: existingUser });
      response.cookies.set("user_id", existingUser.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30日
      });
      return response;
    }

    if (!name) {
      return NextResponse.json(
        { error: "アカウントが見つかりません。新規登録してください。" },
        { status: 404 }
      );
    }

    // 新規ユーザー作成
    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        email,
        name,
        timezone: "Asia/Tokyo",
      })
      .select()
      .single();

    if (error) throw error;

    const response = NextResponse.json({ user: newUser });
    response.cookies.set("user_id", newUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "認証に失敗しました" },
      { status: 500 }
    );
  }
}
