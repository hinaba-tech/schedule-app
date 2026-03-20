"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import type { AvailableSlot } from "@/types";

interface BookingFormProps {
  slot: AvailableSlot;
  linkId: string;
  linkTitle: string;
  hostName: string;
  durationMinutes: number;
  onBack: () => void;
  onComplete: () => void;
}

export default function BookingForm({
  slot,
  linkId,
  linkTitle,
  hostName,
  durationMinutes,
  onBack,
  onComplete,
}: BookingFormProps) {
  const [formData, setFormData] = useState({
    guest_name: "",
    guest_email: "",
    guest_company: "",
    guest_phone: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const startDate = new Date(slot.start);
  const endDate = new Date(slot.end);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduling_link_id: linkId,
          ...formData,
          start_time: slot.start,
          end_time: slot.end,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "予約に失敗しました");
      }

      onComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-slideIn">
      {/* 選択した日時の表示 */}
      <div className="bg-blue-50 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            {format(startDate, "d")}
          </div>
          <div>
            <p className="font-bold text-gray-900">
              {format(startDate, "yyyy年M月d日(E)", { locale: ja })}
            </p>
            <p className="text-sm text-gray-600">
              {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}{" "}
              ({durationMinutes}分)
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            お名前 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.guest_name}
            onChange={(e) =>
              setFormData({ ...formData, guest_name: e.target.value })
            }
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
            placeholder="山田 太郎"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            required
            value={formData.guest_email}
            onChange={(e) =>
              setFormData({ ...formData, guest_email: e.target.value })
            }
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
            placeholder="taro@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            会社名
          </label>
          <input
            type="text"
            value={formData.guest_company}
            onChange={(e) =>
              setFormData({ ...formData, guest_company: e.target.value })
            }
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
            placeholder="株式会社〇〇"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            電話番号
          </label>
          <input
            type="tel"
            value={formData.guest_phone}
            onChange={(e) =>
              setFormData({ ...formData, guest_phone: e.target.value })
            }
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
            placeholder="090-1234-5678"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            備考・メッセージ
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm resize-none"
            placeholder="打ち合わせの議題など"
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            戻る
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                予約中...
              </span>
            ) : (
              "予約を確定する"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
