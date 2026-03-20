"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import Calendar from "@/components/Calendar";
import TimeSlotPicker from "@/components/TimeSlotPicker";
import BookingForm from "@/components/BookingForm";
import type { AvailableSlot, SchedulingLink } from "@/types";

type Step = "select-date" | "select-time" | "fill-form" | "complete";

export default function BookingPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [link, setLink] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [step, setStep] = useState<Step>("select-date");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);

  // リンク情報を取得
  useEffect(() => {
    async function fetchLink() {
      try {
        const res = await fetch(`/api/links/${slug}`);
        if (!res.ok) throw new Error("リンクが見つかりません");
        const data = await res.json();
        setLink(data.link);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchLink();
  }, [slug]);

  // 日付選択時に空き時間を取得
  const handleDateSelect = useCallback(
    async (date: Date) => {
      setSelectedDate(date);
      setSelectedSlot(null);
      setStep("select-time");
      setSlotsLoading(true);

      try {
        const dateStr = format(date, "yyyy-MM-dd");
        const res = await fetch(
          `/api/availability?linkId=${link.id}&date=${dateStr}`
        );
        const data = await res.json();
        setSlots(data.slots || []);
      } catch {
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    },
    [link]
  );

  const handleSlotSelect = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
    setStep("fill-form");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !link) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-600">このリンクは無効です</p>
        </div>
      </div>
    );
  }

  // 予約完了画面
  if (step === "complete") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center animate-fadeIn">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">予約が確定しました</h2>
          <p className="text-gray-600 text-sm mb-6">
            確認メールをお送りしました。当日はよろしくお願いいたします。
          </p>
          {selectedSlot && (
            <div className="bg-gray-50 rounded-xl p-4 text-left">
              <p className="font-medium text-gray-900">{link.title}</p>
              <p className="text-sm text-gray-600 mt-1">
                {format(new Date(selectedSlot.start), "yyyy年M月d日(E) HH:mm", { locale: ja })}
                {" - "}
                {format(new Date(selectedSlot.end), "HH:mm")}
              </p>
              <p className="text-sm text-gray-500 mt-1">{link.users?.name}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: link.color || "#3b82f6" }}
          >
            {link.users?.name?.charAt(0) || "S"}
          </div>
          <div>
            <p className="font-bold text-gray-900">{link.title}</p>
            <p className="text-xs text-gray-500">
              {link.users?.name} / {link.duration_minutes}分
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {link.description && (
          <p className="text-sm text-gray-600 mb-6">{link.description}</p>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* 左カラム：カレンダー */}
          <div className="lg:w-[360px] flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <Calendar
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                maxDate={
                  new Date(
                    Date.now() + link.max_days_ahead * 24 * 60 * 60 * 1000
                  )
                }
              />
            </div>
          </div>

          {/* 右カラム：時間選択 or フォーム */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              {step === "select-date" && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">カレンダーから日付を選択してください</p>
                </div>
              )}

              {step === "select-time" && selectedDate && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-4">
                    {format(selectedDate, "M月d日(E)", { locale: ja })}の空き時間
                  </h3>
                  <TimeSlotPicker
                    slots={slots}
                    selectedSlot={selectedSlot}
                    onSlotSelect={handleSlotSelect}
                    loading={slotsLoading}
                  />
                </div>
              )}

              {step === "fill-form" && selectedSlot && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-4">予約情報を入力</h3>
                  <BookingForm
                    slot={selectedSlot}
                    linkId={link.id}
                    linkTitle={link.title}
                    hostName={link.users?.name || ""}
                    durationMinutes={link.duration_minutes}
                    onBack={() => {
                      setSelectedSlot(null);
                      setStep("select-time");
                    }}
                    onComplete={() => setStep("complete")}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
