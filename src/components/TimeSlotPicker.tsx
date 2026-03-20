"use client";

import { format } from "date-fns";
import type { AvailableSlot } from "@/types";

interface TimeSlotPickerProps {
  slots: AvailableSlot[];
  selectedSlot: AvailableSlot | null;
  onSlotSelect: (slot: AvailableSlot) => void;
  loading: boolean;
}

export default function TimeSlotPicker({
  slots,
  selectedSlot,
  onSlotSelect,
  loading,
}: TimeSlotPickerProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />
        <p className="text-sm">空き時間を取得中...</p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm">この日は空き時間がありません</p>
        <p className="text-xs mt-1">他の日を選択してください</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <p className="text-sm text-gray-500 mb-3">
        {slots.length}件の空き時間
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto pr-1">
        {slots.map((slot, i) => {
          const startTime = format(new Date(slot.start), "HH:mm");
          const endTime = format(new Date(slot.end), "HH:mm");
          const isSelected =
            selectedSlot?.start === slot.start && selectedSlot?.end === slot.end;

          return (
            <button
              key={i}
              onClick={() => onSlotSelect(slot)}
              className={`time-slot ${isSelected ? "selected" : ""}`}
            >
              {startTime}
              <span className="text-xs opacity-70 ml-1">- {endTime}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
