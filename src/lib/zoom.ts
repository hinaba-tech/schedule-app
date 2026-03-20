// ========================================
// Zoom Meeting URL自動生成
// ========================================

interface ZoomMeetingResponse {
  id: number;
  join_url: string;
  start_url: string;
  password: string;
}

// Server-to-Server OAuth でアクセストークン取得
async function getZoomAccessToken(): Promise<string> {
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;
  const accountId = process.env.ZOOM_ACCOUNT_ID;

  if (!clientId || !clientSecret || !accountId) {
    throw new Error("Zoom API credentials not configured");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  const data = await res.json();
  return data.access_token;
}

export async function createZoomMeeting(params: {
  topic: string;
  startTime: string;
  durationMinutes: number;
}): Promise<{ meetingUrl: string; password: string } | null> {
  try {
    const accessToken = await getZoomAccessToken();

    const res = await fetch("https://api.zoom.us/v2/users/me/meetings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: params.topic,
        type: 2, // Scheduled meeting
        start_time: params.startTime,
        duration: params.durationMinutes,
        timezone: "Asia/Tokyo",
        settings: {
          join_before_host: true,
          waiting_room: false,
          auto_recording: "none",
        },
      }),
    });

    const meeting: ZoomMeetingResponse = await res.json();
    return {
      meetingUrl: meeting.join_url,
      password: meeting.password,
    };
  } catch (error) {
    console.error("[Zoom] ミーティング作成エラー:", error);
    return null;
  }
}
