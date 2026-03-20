import { google } from "googleapis";
import { createServerClient } from "./supabase";
import type { AvailableSlot, CalendarEvent } from "@/types";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
);

// Google OAuth認証URLを生成
export function getGoogleAuthUrl(userId: string): string {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/calendar.events",
      "openid",
      "email",
      "profile",
    ],
    state: userId,
  });
}

// アクセストークンをリフレッシュ
async function getValidToken(userId: string): Promise<string> {
  const supabase = createServerClient();
  const { data: user } = await supabase
    .from("users")
    .select("google_access_token, google_refresh_token")
    .eq("id", userId)
    .single();

  if (!user?.google_refresh_token) {
    throw new Error("Google Calendar未連携です");
  }

  oauth2Client.setCredentials({
    access_token: user.google_access_token,
    refresh_token: user.google_refresh_token,
  });

  // トークンリフレッシュ
  const { credentials } = await oauth2Client.refreshAccessToken();

  if (credentials.access_token !== user.google_access_token) {
    await supabase
      .from("users")
      .update({ google_access_token: credentials.access_token })
      .eq("id", userId);
  }

  return credentials.access_token!;
}

// Googleカレンダーからイベント一覧を取得
export async function getCalendarEvents(
  userId: string,
  timeMin: string,
  timeMax: string
): Promise<CalendarEvent[]> {
  await getValidToken(userId);

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  const supabase = createServerClient();
  const { data: user } = await supabase
    .from("users")
    .select("google_calendar_id")
    .eq("id", userId)
    .single();

  const res = await calendar.events.list({
    calendarId: user?.google_calendar_id || "primary",
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
  });

  return (res.data.items || [])
    .filter((event) => event.status !== "cancelled")
    .map((event) => ({
      id: event.id!,
      summary: event.summary || "(タイトルなし)",
      start: event.start?.dateTime || event.start?.date || "",
      end: event.end?.dateTime || event.end?.date || "",
    }));
}

// 空き時間スロットを計算
export async function getAvailableSlots(
  userId: string,
  dateStr: string, // "2025-01-15"
  durationMinutes: number,
  availabilityRules: { day_of_week: number; start_time: string; end_time: string; is_available: boolean }[],
  bufferBefore: number,
  bufferAfter: number,
  timezone: string = "Asia/Tokyo"
): Promise<AvailableSlot[]> {
  const date = new Date(dateStr + "T00:00:00");
  const dayOfWeek = date.getDay();

  // その曜日のルールを取得
  const rule = availabilityRules.find(
    (r) => r.day_of_week === dayOfWeek && r.is_available
  );
  if (!rule) return [];

  // 日付範囲を設定
  const timeMin = `${dateStr}T00:00:00+09:00`;
  const timeMax = `${dateStr}T23:59:59+09:00`;

  // 既存のイベントを取得
  let events: CalendarEvent[] = [];
  try {
    events = await getCalendarEvents(userId, timeMin, timeMax);
  } catch {
    // カレンダー連携なしの場合は空で続行
  }

  // 既存の予約も取得
  const supabase = createServerClient();
  const { data: bookings } = await supabase
    .from("bookings")
    .select("start_time, end_time")
    .gte("start_time", timeMin)
    .lte("end_time", timeMax)
    .eq("status", "confirmed");

  // すべてのブロック時間を統合
  const blockedSlots = [
    ...events.map((e) => ({
      start: new Date(e.start).getTime(),
      end: new Date(e.end).getTime(),
    })),
    ...(bookings || []).map((b: { start_time: string; end_time: string }) => ({
      start: new Date(b.start_time).getTime(),
      end: new Date(b.end_time).getTime(),
    })),
  ].sort((a, b) => a.start - b.start);

  // 利用可能時間内でスロットを生成
  const [startHour, startMin] = rule.start_time.split(":").map(Number);
  const [endHour, endMin] = rule.end_time.split(":").map(Number);

  const dayStart = new Date(dateStr + `T${rule.start_time}:00+09:00`).getTime();
  const dayEnd = new Date(dateStr + `T${rule.end_time}:00+09:00`).getTime();

  const slots: AvailableSlot[] = [];
  const slotDuration = durationMinutes * 60 * 1000;
  const bufferBeforeMs = bufferBefore * 60 * 1000;
  const bufferAfterMs = bufferAfter * 60 * 1000;

  let cursor = dayStart;

  while (cursor + slotDuration <= dayEnd) {
    const slotStart = cursor;
    const slotEnd = cursor + slotDuration;

    // バッファ含めた時間でチェック
    const checkStart = slotStart - bufferBeforeMs;
    const checkEnd = slotEnd + bufferAfterMs;

    const isBlocked = blockedSlots.some(
      (blocked) => checkStart < blocked.end && checkEnd > blocked.start
    );

    if (!isBlocked) {
      slots.push({
        start: new Date(slotStart).toISOString(),
        end: new Date(slotEnd).toISOString(),
      });
    }

    cursor += 30 * 60 * 1000; // 30分刻みで次へ
  }

  return slots;
}

// Googleカレンダーにイベントを作成
export async function createCalendarEvent(
  userId: string,
  summary: string,
  description: string,
  startTime: string,
  endTime: string,
  attendeeEmail?: string,
  createMeetLink: boolean = true
): Promise<{ eventId: string; meetUrl?: string }> {
  await getValidToken(userId);

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  const supabase = createServerClient();
  const { data: user } = await supabase
    .from("users")
    .select("google_calendar_id")
    .eq("id", userId)
    .single();

  const event: any = {
    summary,
    description,
    start: { dateTime: startTime, timeZone: "Asia/Tokyo" },
    end: { dateTime: endTime, timeZone: "Asia/Tokyo" },
  };

  if (attendeeEmail) {
    event.attendees = [{ email: attendeeEmail }];
  }

  if (createMeetLink) {
    event.conferenceData = {
      createRequest: {
        requestId: `meet-${Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
  }

  const res = await calendar.events.insert({
    calendarId: user?.google_calendar_id || "primary",
    requestBody: event,
    conferenceDataVersion: createMeetLink ? 1 : 0,
    sendUpdates: "all",
  });

  return {
    eventId: res.data.id!,
    meetUrl: res.data.hangoutLink || undefined,
  };
}

// Googleカレンダーのイベントを削除
export async function deleteCalendarEvent(
  userId: string,
  eventId: string
): Promise<void> {
  await getValidToken(userId);

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  const supabase = createServerClient();
  const { data: user } = await supabase
    .from("users")
    .select("google_calendar_id")
    .eq("id", userId)
    .single();

  await calendar.events.delete({
    calendarId: user?.google_calendar_id || "primary",
    eventId,
    sendUpdates: "all",
  });
}

export { oauth2Client };
