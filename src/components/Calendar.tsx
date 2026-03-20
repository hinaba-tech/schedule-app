"use client";

import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
} from "date-fns";
import { ja } from "date-fns/locale";

interface CalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  availableDates?: string[]; // "2025-01-15" 形式
}

export default function Calendar({
  selectedDate,
  onDateSelect,
  minDate,
  maxDate,
  availableDates,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    const result: Date[] = [];
    let day = start;
    while (day <= end) {
      result.push(day);
      day = addDays(day, 1);
    }
    return result;
  }, [currentMonth]);

  const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

  const isDisabled = (date: Date) => {
    if (!isSameMonth(date, currentMonth)) return true;
    if (minDate && isBefore(date, minDate)) return true;
    if (maxDate && date > maxDate) return true;
    if (isBefore(date, new Date(new Date().toDateString()))) return true;
    return false;
  };

  return (
    <div className="select-none">
      {/* ヘッダー：月切り替え */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-bold text-gray-900">
          {format(currentMonth, "yyyy年 M月", { locale: ja })}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 mb-1">
        {weekDays.map((day, i) => (
          <div
            key={day}
            className={`text-center text-xs font-medium py-2 ${
              i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-500"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 日付グリッド */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, i) => {
          const disabled = isDisabled(date);
          const selected = selectedDate && isSameDay(date, selectedDate);
          const today = isToday(date);
          const dateStr = format(date, "yyyy-MM-dd");
          const dayOfWeek = date.getDay();

          return (
            <button
              key={i}
              onClick={() => !disabled && onDateSelect(date)}
              disabled={disabled}
              className={`
                relative aspect-square flex items-center justify-center rounded-lg text-sm transition
                ${disabled ? "text-gray-300 cursor-default" : "hover:bg-blue-50 cursor-pointer"}
                ${selected ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
                ${today && !selected ? "bg-blue-50 font-bold text-blue-600" : ""}
                ${!disabled && !selected && !today ? "text-gray-700" : ""}
                ${dayOfWeek === 0 && !disabled && !selected ? "text-red-500" : ""}
                ${dayOfWeek === 6 && !disabled && !selected ? "text-blue-500" : ""}
              `}
            >
              {isSameMonth(date, currentMonth) ? format(date, "d") : ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}
