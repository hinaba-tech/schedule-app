// ========================================
// データベース型定義
// ========================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  timezone: string;
  google_access_token?: string;
  google_refresh_token?: string;
  google_calendar_id?: string;
  slack_webhook_url?: string;
  zoom_access_token?: string;
  created_at: string;
  updated_at: string;
}

export interface SchedulingLink {
  id: string;
  user_id: string;
  slug: string; // URL用スラッグ（例: "30min-meeting"）
  title: string;
  description?: string;
  duration_minutes: number;
  location_type: "google_meet" | "zoom" | "phone" | "in_person" | "custom";
  location_detail?: string;
  color: string;
  // 利用可能時間の設定
  availability_rules: AvailabilityRule[];
  // バッファ時間
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  // 予約可能期間
  min_notice_hours: number; // 最短何時間前まで予約可能
  max_days_ahead: number; // 最大何日先まで予約可能
  // ステータス
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityRule {
  day_of_week: number; // 0=日, 1=月, ..., 6=土
  start_time: string; // "09:00"
  end_time: string; // "18:00"
  is_available: boolean;
}

export interface Booking {
  id: string;
  scheduling_link_id: string;
  guest_name: string;
  guest_email: string;
  guest_company?: string;
  guest_phone?: string;
  notes?: string;
  start_time: string; // ISO 8601
  end_time: string; // ISO 8601
  status: "confirmed" | "cancelled" | "pending";
  google_event_id?: string;
  meeting_url?: string;
  created_at: string;
}

// 候補提案型調整
export interface ScheduleProposal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  duration_minutes: number;
  location_type: "google_meet" | "zoom" | "phone" | "in_person" | "custom";
  location_detail?: string;
  type: "confirmation" | "voting"; // 確認型 or 投票型
  candidates: ProposalCandidate[];
  deadline?: string; // 回答期限
  status: "open" | "confirmed" | "expired" | "cancelled";
  confirmed_candidate_id?: string;
  created_at: string;
}

export interface ProposalCandidate {
  id: string;
  proposal_id: string;
  start_time: string;
  end_time: string;
}

export interface ProposalResponse {
  id: string;
  proposal_id: string;
  respondent_name: string;
  respondent_email: string;
  votes: ProposalVote[];
  comment?: string;
  created_at: string;
}

export interface ProposalVote {
  candidate_id: string;
  availability: "available" | "maybe" | "unavailable";
}

// ========================================
// API リクエスト/レスポンス型
// ========================================

export interface CreateBookingRequest {
  scheduling_link_id: string;
  guest_name: string;
  guest_email: string;
  guest_company?: string;
  guest_phone?: string;
  notes?: string;
  start_time: string;
  end_time: string;
}

export interface AvailableSlot {
  start: string;
  end: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
}
