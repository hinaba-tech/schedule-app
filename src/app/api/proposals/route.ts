import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// POST /api/proposals - 候補提案を作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, title, description, duration_minutes, location_type, location_detail, type, candidates, deadline } = body;

    const supabase = createServerClient();

    // 提案を作成
    const { data: proposal, error: proposalError } = await supabase
      .from("schedule_proposals")
      .insert({
        user_id,
        title,
        description,
        duration_minutes: duration_minutes || 60,
        location_type: location_type || "google_meet",
        location_detail,
        type: type || "confirmation",
        deadline,
        status: "open",
      })
      .select()
      .single();

    if (proposalError) throw proposalError;

    // 候補日時を作成
    if (candidates && candidates.length > 0) {
      const candidateRows = candidates.map((c: any) => ({
        proposal_id: proposal.id,
        start_time: c.start_time,
        end_time: c.end_time,
      }));

      const { error: candidateError } = await supabase
        .from("proposal_candidates")
        .insert(candidateRows);

      if (candidateError) throw candidateError;
    }

    return NextResponse.json({ proposal });
  } catch (error) {
    console.error("Proposal creation error:", error);
    return NextResponse.json(
      { error: "提案の作成に失敗しました" },
      { status: 500 }
    );
  }
}

// GET /api/proposals?id=xxx - 提案情報を取得
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  try {
    const supabase = createServerClient();

    const { data: proposal } = await supabase
      .from("schedule_proposals")
      .select("*, users(name, email)")
      .eq("id", id)
      .single();

    if (!proposal) {
      return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    }

    const { data: candidates } = await supabase
      .from("proposal_candidates")
      .select("*")
      .eq("proposal_id", id)
      .order("start_time");

    const { data: responses } = await supabase
      .from("proposal_responses")
      .select("*, proposal_votes(*)")
      .eq("proposal_id", id);

    return NextResponse.json({ proposal, candidates, responses });
  } catch (error) {
    return NextResponse.json(
      { error: "取得に失敗しました" },
      { status: 500 }
    );
  }
}
