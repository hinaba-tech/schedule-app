import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { createCalendarEvent } from "@/lib/google-calendar";
import { createZoomMeeting } from "@/lib/zoom";
import {
  sendBookingConfirmationToGuest,
  sendBookingNotificationToHost,
  notifyHostViaSlack,
} from "@/lib/notifications";

// POST /api/bookings - 予約を作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      scheduling_link_id,
      guest_name,
      guest_email,
      guest_company,
      guest_phone,
      notes,
      start_time,
      end_time,
    } = body;

    if (!scheduling_link_id || !guest_name || !guest_email || !start_time || !end_time) {
      return NextResponse.json(
        { error: "必須項目が不足しています" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // リンク情報とユーザー情報を取得
    const { data: link } = await supabase
      .from("scheduling_links")
      .select("*, users(*)")
      .eq("id", scheduling_link_id)
      .single();

    if (!link) {
      return NextResponse.json(
        { error: "予約リンクが見つかりません" },
        { status: 404 }
      );
    }

    // ダブルブッキングチェック
    const { data: existingBookings } = await supabase
      .from("bookings")
      .select("id")
      .eq("scheduling_link_id", scheduling_link_id)
      .eq("status", "confirmed")
      .lt("start_time", end_time)
      .gt("end_time", start_time);

    if (existingBookings && existingBookings.length > 0) {
      return NextResponse.json(
        { error: "選択された時間帯は既に予約が入っています" },
        { status: 409 }
      );
    }

    // Web会議URL生成
    let meetingUrl: string | undefined;

    if (link.location_type === "google_meet") {
      try {
        const event = await createCalendarEvent(
          link.user_id,
          link.title,
          `ゲスト: ${guest_name} (${guest_email})${notes ? `\n備考: ${notes}` : ""}`,
          start_time,
          end_time,
          guest_email,
          true
        );
        meetingUrl = event.meetUrl;

        // 予約データにGoogle Event IDを含めて保存
        const { data: booking, error } = await supabase
          .from("bookings")
          .insert({
            scheduling_link_id,
            guest_name,
            guest_email,
            guest_company,
            guest_phone,
            notes,
            start_time,
            end_time,
            status: "confirmed",
            google_event_id: event.eventId,
            meeting_url: meetingUrl,
          })
          .select()
          .single();

        if (error) throw error;

        // 通知送信（非同期）
        await Promise.allSettled([
          sendBookingConfirmationToGuest({
            guestEmail: guest_email,
            guestName: guest_name,
            hostName: link.users.name,
            title: link.title,
            startTime: start_time,
            endTime: end_time,
            meetingUrl,
          }),
          sendBookingNotificationToHost({
            hostEmail: link.users.email,
            hostName: link.users.name,
            guestName: guest_name,
            guestEmail: guest_email,
            guestCompany: guest_company,
            title: link.title,
            startTime: start_time,
            endTime: end_time,
            notes,
          }),
          notifyHostViaSlack(link.user_id, {
            title: link.title,
            guestName: guest_name,
            guestEmail: guest_email,
            startTime: start_time,
            endTime: end_time,
            meetingUrl,
          }),
        ]);

        return NextResponse.json({ booking });
      } catch (calendarError) {
        console.error("Calendar event creation failed:", calendarError);
        // カレンダー作成に失敗しても予約自体は作成する
      }
    } else if (link.location_type === "zoom") {
      try {
        const zoomMeeting = await createZoomMeeting({
          topic: link.title,
          startTime: start_time,
          durationMinutes: link.duration_minutes,
        });
        meetingUrl = zoomMeeting?.meetingUrl;
      } catch {
        console.error("Zoom meeting creation failed");
      }
    }

    // 予約データを保存（カレンダー未連携またはZoomの場合）
    const { data: booking, error } = await supabase
      .from("bookings")
      .insert({
        scheduling_link_id,
        guest_name,
        guest_email,
        guest_company,
        guest_phone,
        notes,
        start_time,
        end_time,
        status: "confirmed",
        meeting_url: meetingUrl,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "予約の保存に失敗しました" },
        { status: 500 }
      );
    }

    // 通知送信
    await Promise.allSettled([
      sendBookingConfirmationToGuest({
        guestEmail: guest_email,
        guestName: guest_name,
        hostName: link.users.name,
        title: link.title,
        startTime: start_time,
        endTime: end_time,
        meetingUrl,
      }),
      sendBookingNotificationToHost({
        hostEmail: link.users.email,
        hostName: link.users.name,
        guestName: guest_name,
        guestEmail: guest_email,
        guestCompany: guest_company,
        title: link.title,
        startTime: start_time,
        endTime: end_time,
        notes,
      }),
      notifyHostViaSlack(link.user_id, {
        title: link.title,
        guestName: guest_name,
        guestEmail: guest_email,
        startTime: start_time,
        endTime: end_time,
        meetingUrl,
      }),
    ]);

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Booking creation error:", error);
    return NextResponse.json(
      { error: "予約の作成に失敗しました" },
      { status: 500 }
    );
  }
}
