import nodemailer from "nodemailer";
import { createServerClient } from "./supabase";

// ========================================
// メール通知
// ========================================

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailParams) {
  if (!process.env.SMTP_USER) {
    console.log("[Email] SMTP未設定のためスキップ:", subject);
    return;
  }

  await transporter.sendMail({
    from: `"スケジュール調整" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

// 予約確認メール（ゲスト向け）
export async function sendBookingConfirmationToGuest(params: {
  guestEmail: string;
  guestName: string;
  hostName: string;
  title: string;
  startTime: string;
  endTime: string;
  meetingUrl?: string;
}) {
  const startDate = new Date(params.startTime);
  const endDate = new Date(params.endTime);
  const dateStr = startDate.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
  const timeStr = `${startDate.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  })} - ${endDate.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  await sendEmail({
    to: params.guestEmail,
    subject: `【日程確定】${params.title} - ${params.hostName}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3b82f6, #2563eb); padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">日程が確定しました</h1>
        </div>
        <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
          <p>${params.guestName} 様</p>
          <p>以下の日程が確定いたしました。</p>
          <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>件名：</strong>${params.title}</p>
            <p style="margin: 4px 0;"><strong>主催者：</strong>${params.hostName}</p>
            <p style="margin: 4px 0;"><strong>日時：</strong>${dateStr} ${timeStr}</p>
            ${
              params.meetingUrl
                ? `<p style="margin: 4px 0;"><strong>Web会議：</strong><a href="${params.meetingUrl}">${params.meetingUrl}</a></p>`
                : ""
            }
          </div>
          <p style="color: #64748b; font-size: 14px;">当日はよろしくお願いいたします。</p>
        </div>
      </div>
    `,
  });
}

// 予約通知メール（ホスト向け）
export async function sendBookingNotificationToHost(params: {
  hostEmail: string;
  hostName: string;
  guestName: string;
  guestEmail: string;
  guestCompany?: string;
  title: string;
  startTime: string;
  endTime: string;
  notes?: string;
}) {
  const startDate = new Date(params.startTime);
  const endDate = new Date(params.endTime);
  const dateStr = startDate.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
  const timeStr = `${startDate.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  })} - ${endDate.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  await sendEmail({
    to: params.hostEmail,
    subject: `【新規予約】${params.guestName}様 - ${params.title}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">新しい予約が入りました</h1>
        </div>
        <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
          <p>${params.hostName} 様</p>
          <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>件名：</strong>${params.title}</p>
            <p style="margin: 4px 0;"><strong>ゲスト：</strong>${params.guestName}${params.guestCompany ? ` (${params.guestCompany})` : ""}</p>
            <p style="margin: 4px 0;"><strong>メール：</strong>${params.guestEmail}</p>
            <p style="margin: 4px 0;"><strong>日時：</strong>${dateStr} ${timeStr}</p>
            ${params.notes ? `<p style="margin: 4px 0;"><strong>備考：</strong>${params.notes}</p>` : ""}
          </div>
        </div>
      </div>
    `,
  });
}

// ========================================
// Slack通知
// ========================================

export async function sendSlackNotification(
  webhookUrl: string,
  message: {
    title: string;
    guestName: string;
    guestEmail: string;
    startTime: string;
    endTime: string;
    meetingUrl?: string;
  }
) {
  if (!webhookUrl) return;

  const startDate = new Date(message.startTime);
  const endDate = new Date(message.endTime);
  const dateStr = startDate.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
  const timeStr = `${startDate.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  })} - ${endDate.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      blocks: [
        {
          type: "header",
          text: { type: "plain_text", text: "📅 新しい予約が入りました" },
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*件名*\n${message.title}` },
            { type: "mrkdwn", text: `*ゲスト*\n${message.guestName}` },
            { type: "mrkdwn", text: `*日時*\n${dateStr}\n${timeStr}` },
            { type: "mrkdwn", text: `*メール*\n${message.guestEmail}` },
          ],
        },
        ...(message.meetingUrl
          ? [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*Web会議URL*\n<${message.meetingUrl}|参加する>`,
                },
              },
            ]
          : []),
      ],
    }),
  });
}

// ユーザーのSlack Webhook URLを取得して通知
export async function notifyHostViaSlack(
  userId: string,
  message: Parameters<typeof sendSlackNotification>[1]
) {
  const supabase = createServerClient();
  const { data: user } = await supabase
    .from("users")
    .select("slack_webhook_url")
    .eq("id", userId)
    .single();

  if (user?.slack_webhook_url) {
    await sendSlackNotification(user.slack_webhook_url, message);
  }

  // グローバルWebhookも確認
  if (process.env.SLACK_WEBHOOK_URL) {
    await sendSlackNotification(process.env.SLACK_WEBHOOK_URL, message);
  }
}
