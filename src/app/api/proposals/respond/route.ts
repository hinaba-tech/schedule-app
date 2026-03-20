import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { createCalendarEvent } from "@/lib/google-calendar";
import {
  sendBookingConfirmationToGuest,
  notifyHostViaSlack,
} from "@/lib/notifications";

// POST /api/proposals/respond - 候補提案に回答
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { proposal_id, respondent_name, respondent_email, votes, comment } = body;

    const supabase = createServerClient();

    // 回答を保存
    const { data: response, error: responseError } = await supabase
      .from("proposal_responses")
      .insert({
        proposal_id,
        respondent_name,
        respondent_email,
        comment,
      })
      .select()
      .single();

    if (responseError) throw responseError;

    // 投票を保存
    if (votes && votes.length > 0) {
      const voteRows = votes.map((v: any) => ({
        response_id: response.id,
        candidate_id: v.candidate_id,
        availability: v.availability,
      }));

      const { error: voteError } = await supabase
        .from("proposal_votes")
        .insert(voteRows);

      if (voteError) throw voteError;
    }

    // 確認型の場合：最初のavailableな候補で確定
    const { data: proposal } = await supabase
      .from("schedule_proposals")
      .select("*, users(name, email)")
      .eq("id", proposal_id)
      .single();

    if (proposal?.type === "confirmation" && votes) {
      const confirmedVote = votes.find(
        (v: any) => v.availability === "available"
      );

      if (confirmedVote) {
        const { data: candidate } = await supabase
          .from("proposal_candidates")
          .select("*")
          .eq("id", confirmedVote.candidate_id)
          .single();

        if (candidate) {
          // 提案を確定
          await supabase
            .from("schedule_proposals")
            .update({
              status: "confirmed",
              confirmed_candidate_id: confirmedVote.candidate_id,
            })
            .eq("id", proposal_id);

          // Googleカレンダーにイベント作成
          try {
            const event = await createCalendarEvent(
              proposal.user_id,
              proposal.title,
              `参加者: ${respondent_name} (${respondent_email})`,
              candidate.start_time,
              candidate.end_time,
              respondent_email,
              proposal.location_type === "google_meet"
            );

            // メール・Slack通知
            await Promise.allSettled([
              sendBookingConfirmationToGuest({
                guestEmail: respondent_email,
                guestName: respondent_name,
                hostName: proposal.users.name,
                title: proposal.title,
                startTime: candidate.start_time,
                endTime: candidate.end_time,
                meetingUrl: event.meetUrl,
              }),
              notifyHostViaSlack(proposal.user_id, {
                title: proposal.title,
                guestName: respondent_name,
                guestEmail: respondent_email,
                startTime: candidate.start_time,
                endTime: candidate.end_time,
                meetingUrl: event.meetUrl,
              }),
            ]);
          } catch (err) {
            console.error("Calendar event creation failed:", err);
          }
        }
      }
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Response creation error:", error);
    return NextResponse.json(
      { error: "回答の保存に失敗しました" },
      { status: 500 }
    );
  }
}
