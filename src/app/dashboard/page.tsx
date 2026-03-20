"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import Link from "next/link";

// ============================================
// 管理ダッシュボード
// Spir の管理画面を再現
// ============================================

type Tab = "links" | "bookings" | "proposals" | "settings";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("links");
  const [links, setLinks] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateLink, setShowCreateLink] = useState(false);
  const [showCreateProposal, setShowCreateProposal] = useState(false);

  // TODO: 実際のユーザーIDはauth経由で取得
  const userId = "demo-user-id";

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [linksRes, bookingsRes] = await Promise.all([
        fetch("/api/dashboard/links"),
        fetch("/api/dashboard/bookings"),
      ]);
      const linksData = await linksRes.json();
      const bookingsData = await bookingsRes.json();
      setLinks(linksData.links || []);
      setBookings(bookingsData.bookings || []);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "links", label: "空き時間共有", count: links.length },
    { key: "bookings", label: "予約一覧", count: bookings.length },
    { key: "proposals", label: "候補提案", count: proposals.length },
    { key: "settings", label: "設定" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* サイドバー */}
      <div className="flex">
        <aside className="w-64 bg-white border-r border-gray-100 min-h-screen fixed left-0 top-0">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-lg font-bold text-gray-900">Schedule</span>
            </div>

            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    activeTab === tab.key
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      activeTab === tab.key
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Google Calendar 連携ステータス */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
            <a
              href={`/api/auth/google?userId=${userId}`}
              className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-xs text-gray-600 hover:bg-gray-100 transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google Calendar 連携
            </a>
          </div>
        </aside>

        {/+ メインコンテンツ */}
        <main className="ml-64 flex-1 p-8">
          {/* 空き時間共有リンク管理 */}
          {activeTab === "links" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-bold text-gray-900">空き時間共有リンク</h1>
                <button
                  onClick={() => setShowCreateLink(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  新規作成
                </button>
              </div>

              {links.length === 0 ? (
                <EmptyState
                  icon="link"
                  title="空き時間共有リンクがありません"
                  description="新規作成ボタンから、共有リンクを作成しましょう"
                />
              ) : (
                <div className="grid gap-4">
                  {links.map((link) => (
                    <LinkCard key={link.id} link={link} />
                  ))}
                </div>
              )}

              {showCreateLink && (
                <CreateLinkModal
                  userId={userId}
                  onClose={() => setShowCreateLink(false)}
                  onCreated={() => {
                    setShowCreateLink(false);
                    fetchData();
                  }}
                />
              )}
            </div>
          )}

          {/* 予約一覧 */}
          {activeTab === "bookings" && (
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-6">予約一覧</h1>
              {bookings.length === 0 ? (
                <EmptyState
                  icon="calendar"
                  title="予約はまだありません"
                  description="空き時間共有リンクを共有すると、ここに予約が表示されます"
                />
              ) : (
                <div className="space-y-3">
                  {bookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 候補提案 */}
          {activeTab === "proposals" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-bold text-gray-900">候補日提案</h1>
                <button
                  onClick={() => setShowCreateProposal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  候補提案を作成
                </button>
              </div>
              <EmptyState
                icon="vote"
                title="候補提案はまだありません"
                description="候補日を提案して、相手に選んでもらいましょう"
              />
              {showCreateProposal && (
                <CreateProposalModal
                  userId={userId}
                  onClose={() => setShowCreateProposal(false)}
                  onCreated={() => {
                    setShowCreateProposal(false);
                    fetchData();
                  }}
                />
              )}
            </div>
          )}

          {/* 設定 */}
          {activeTab === "settings" && <SettingsPanel userId={userId} />}
        </main>
      </div>
    </div>
  );
}

// ============================================
// サブコンポーネント
// ============================================

function EmptyState({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {icon === "link" && (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          )}
          {icon === "calendar" && (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          )}
          {icon === "vote" && (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          )}
        </svg>
      </div>
      <p className="font-medium text-gray-600 mb-1">{title}</p>
      <p className="text-sm">{description}</p>
    </div>
  );
}

function LinkCard({ link }: { link: any }) {
  const [copied, setCopied] = useState(false);
  const bookingUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/booking/${link.slug}`;

  const copyLink = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div
            className="w-3 h-12 rounded-full flex-shrink-0"
            style={{ backgroundColor: link.color || "#3b82f6" }}
          />
          <div>
            <h3 className="font-bold text-gray-900">{link.title}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{link.duration_minutes}分</p>
            {link.description && (
              <p className="text-xs text-gray-400 mt-1">{link.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyLink}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            {copied ? "コピーしました" : "リンクをコピー"}
          </button>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              link.is_active
                ? "bg-green-50 text-green-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {link.is_active ? "有効" : "無効"}
          </span>
        </div>
      </div>
    </div>
  );
}

function BookingCard({ booking }: { booking: any }) {
  const startDate = new Date(booking.start_time);
  const endDate = new Date(booking.end_time);
  const isPast = startDate < new Date();

  return (
    <div className={`bg-white rounded-xl border border-gray-100 p-4 ${isPast ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-4">
        <div className="text-center flex-shrink-0 w-14">
          <p className="text-2xl font-bold text-blue-600">{format(startDate, "d")}</p>
          <p className="text-xs text-gray-500">{format(startDate, "E", { locale: ja })}</p>
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-900">
            {booking.guest_name}
            {booking.guest_company && (
              <span className="text-gray-400 text-sm ml-1">({booking.guest_company})</span>
            )}
          </p>
          <p className="text-sm text-gray-500">
            {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}
          </p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${
          booking.status === "confirmed"
            ? "bg-green-50 text-green-700"
            : "bg-red-50 text-red-700"
        }`}>
          {booking.status === "confirmed" ? "確定" : "キャンセル"}
        </span>
      </div>
    </div>
  );
}

// ============================================
// 新規リンク作成モーダル
// ============================================
function CreateLinkModal({ userId, onClose, onCreated }: { userId: string; onClose: () => void; onCreated: () => void }) {
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    duration_minutes: 30,
    location_type: "google_meet",
    color: "#3b82f6",
    min_notice_hours: 24,
    max_days_ahead: 60,
    buffer_before_minutes: 0,
    buffer_after_minutes: 0,
  });
  const [availability, setAvailability] = useState(
    [1, 2, 3, 4, 5].map((day) => ({
      day_of_week: day,
      start_time: "09:00",
      end_time: "18:00",
      is_available: true,
    }))
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          user_id: userId,
          availability_rules: [
            ...availability,
            { day_of_week: 0, start_time: "09:00", end_time: "18:00", is_available: false },
            { day_of_week: 6, start_time: "09:00", end_time: "18:00", is_available: false },
          ],
        }),
      });
      if (res.ok) onCreated();
    } catch {
      // error
    } finally {
      setSubmitting(false);
    }
  };

  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
  const colors = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">新しい空き時間共有リンク</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">タイトル *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="30分打合せ"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL スラッグ *</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value.replace(/[^a-z0-9-]/g, "") })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="30min-meeting"
            />
            <p className="text-xs text-gray-400 mt-1">例: /booking/30min-meeting</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">打合せ時間</label>
              <select
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value={15}>15分</option>
                <option value={30}>30分</option>
                <option value={45}>45分</option>
                <option value={60}>60分</option>
                <option value={90}>90分</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">場所</label>
              <select
                value={formData.location_type}
                onChange={(e) => setFormData({ ...formData, location_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="google_meet">Google Meet</option>
                <option value="zoom">Zoom</option>
                <option value="phone">電話</option>
                <option value="in_person">対面</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">カラー</label>
            <div className="flex gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-full transition ${
                    formData.color === color ? "ring-2 ring-offset-2 ring-blue-500" : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">受付可能な曜日・時間</label>
            <div className="space-y-2">
              {availability.map((rule, idx) => (
                <div key={rule.day_of_week} className="flex items-center gap-3">
                  <label className="flex items-center gap-2 w-12">
                    <input
                      type="checkbox"
                      checked={rule.is_available}
                      onChange={(e) => {
                        const updated = [...availability];
                        updated[idx] = { ...rule, is_available: e.target.checked };
                        setAvailability(updated);
                      }}
                      className="rounded text-blue-600"
                    />
                    <span className="text-sm">{dayNames[rule.day_of_week]}</span>
                  </label>
                  <input
                    type="time"
                    value={rule.start_time}
                    onChange={(e) => {
                      const updated = [...availability];
                      updated[idx] = { ...rule, start_time: e.target.value };
                      setAvailability(updated);
                    }}
                    className="px-2 py-1 border border-gray-200 rounded text-sm"
                    disabled={!rule.is_available}
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="time"
                    value={rule.end_time}
                    onChange={(e) => {
                      const updated = [...availability];
                      updated[idx] = { ...rule, end_time: e.target.value };
                      setAvailability(updated);
                    }}
                    className="px-2 py-1 border border-gray-200 rounded text-sm"
                    disabled={!rule.is_available}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最短予約受付（時間前）</label>
              <input
                type="number"
                value={formData.min_notice_hours}
                onChange={(e) => setFormData({ ...formData, min_notice_hours: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">予約可能日数（日先）</label>
              <input
                type="number"
                value={formData.max_days_ahead}
                onChange={(e) => setFormData({ ...formData, max_days_ahead: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formData.title || !formData.slug || submitting}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "作成中..." : "作成"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 候補提案作成モーダル
// ============================================
function CreateProposalModal({ userId, onClose, onCreated }: { userId: string; onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"confirmation" | "voting">("confirmation");
  const [candidates, setCandidates] = useState<{ date: string; startTime: string; endTime: string }[]>([
    { date: "", startTime: "10:00", endTime: "11:00" },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const addCandidate = () => {
    setCandidates([...candidates, { date: "", startTime: "10:00", endTime: "11:00" }]);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const candidateData = candidates
        .filter((c) => c.date)
        .map((c) => ({
          start_time: `${c.date}T${c.startTime}:00+09:00`,
          end_time: `${c.date}T${c.endTime}:00+09:00`,
        }));

      await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          title,
          type,
          candidates: candidateData,
        }),
      });

      onCreated();
    } catch {
      // error
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">候補日提案を作成</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">タイトル *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="プロジェクト定例ミーティング"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">調整タイプ</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setType("confirmation")}
                className={`p-3 rounded-xl border-2 text-left transition ${
                  type === "confirmation" ? "border-blue-500 bg-blue-50" : "border-gray-200"
                }`}
              >
                <p className="text-sm font-bold text-gray-900">確認型</p>
                <p className="text-xs text-gray-500 mt-1">相手が候補から1つ選んで確定</p>
              </button>
              <button
                onClick={() => setType("voting")}
                className={`p-3 rounded-xl border-2 text-left transition ${
                  type === "voting" ? "border-purple-500 bg-purple-50" : "border-gray-200"
                }`}
              >
                <p className="text-sm font-bold text-gray-900">投票型</p>
                <p className="text-xs text-gray-500 mt-1">複数人で投票して決定</p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">候補日時</label>
            <div className="space-y-2">
              {candidates.map((c, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="date"
                    value={c.date}
                    onChange={(e) => {
                      const updated = [...candidates];
                      updated[idx] = { ...c, date: e.target.value };
                      setCandidates(updated);
                    }}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm flex-1"
                  />
                  <input
                    type="time"
                    value={c.startTime}
                    onChange={(e) => {
                      const updated = [...candidates];
                      updated[idx] = { ...c, startTime: e.target.value };
                      setCandidates(updated);
                    }}
                    className="px-2 py-2 border border-gray-200 rounded-lg text-sm w-24"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="time"
                    value={c.endTime}
                    onChange={(e) => {
                      const updated = [...candidates];
                      updated[idx] = { ...c, endTime: e.target.value };
                      setCandidates(updated);
                    }}
                    className="px-2 py-2 border border-gray-200 rounded-lg text-sm w-24"
                  />
                  {candidates.length > 1 && (
                    <button
                      onClick={() => setCandidates(candidates.filter((_, i) => i !== idx))}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addCandidate}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + 候補を追加
            </button>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title || submitting}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "作成中..." : "作成してリンクを取得"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 設定パネル
// ============================================
function SettingsPanel({ userId }: { userId: string }) {
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">設定</h1>
      <div className="space-y-6">
        {/* Google Calendar */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-3">Google Calendar 連携</h3>
          <p className="text-sm text-gray-600 mb-4">
            Google カレンダーと連携して、空き時間の自動抽出とダブルブッキング防止を有効にします。
          </p>
          <a
            href={`/api/auth/google?userId=${userId}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google アカウントを連携
          </a>
        </div>

        {/* Slack */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-3">Slack 通知</h3>
          <p className="text-sm text-gray-600 mb-4">
            予約が入った時にSlackチャンネルに通知を送信します。
          </p>
          <input
            type="url"
            placeholder="https://hooks.slack.com/services/xxx/yyy/zzz"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
            保存
          </button>
        </div>

        {/* タイムゾーン */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-3">タイムゾーン</h3>
          <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="Asia/Tokyo">Asia/Tokyo (JST +09:00)</option>
            <option value="America/New_York">America/New_York (EST -05:00)</option>
            <option value="Europe/London">Europe/London (GMT +00:00)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
