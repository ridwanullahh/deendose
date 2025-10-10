"use client"

import { useState } from "react"
import { getCurrentHijriDate, getIslamicEventsForMonth, type HijriDate, HIJRI_MONTHS } from "@/lib/hijri-calendar"

interface HijriCalendarProps {
  onDateSelect?: (date: HijriDate) => void
  showEvents?: boolean
  className?: string
}

export default function HijriCalendar({ onDateSelect, showEvents = true, className = "" }: HijriCalendarProps) {
  const [currentDate, setCurrentDate] = useState<HijriDate>(getCurrentHijriDate())
  const [selectedDate, setSelectedDate] = useState<HijriDate | null>(null)
  const [viewMonth, setViewMonth] = useState(currentDate.month)
  const [viewYear, setViewYear] = useState(currentDate.year)

  const monthEvents = getIslamicEventsForMonth(viewMonth)

  const getDaysInMonth = (month: number, year: number): number => {
    // Simplified: alternating 30/29 days (actual Islamic calendar is more complex)
    return month % 2 === 1 ? 30 : 29
  }

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(viewMonth, viewYear)
    const days = []

    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = day === currentDate.day && viewMonth === currentDate.month && viewYear === currentDate.year
      const hasEvent = monthEvents.some((event) => event.day === day)

      days.push({
        day,
        isToday,
        hasEvent,
        events: monthEvents.filter((event) => event.day === day),
      })
    }

    return days
  }

  const handleDateClick = (day: number) => {
    const hijriDate: HijriDate = {
      year: viewYear,
      month: viewMonth,
      day,
      monthName: HIJRI_MONTHS[viewMonth - 1].en,
      monthNameArabic: HIJRI_MONTHS[viewMonth - 1].ar,
      dayName: "",
      dayNameArabic: "",
      formatted: `${day} ${HIJRI_MONTHS[viewMonth - 1].en} ${viewYear} AH`,
      formattedArabic: `${day} ${HIJRI_MONTHS[viewMonth - 1].ar} ${viewYear} هـ`,
    }

    setSelectedDate(hijriDate)
    onDateSelect?.(hijriDate)
  }

  const navigateMonth = (direction: "prev" | "next") => {
    if (direction === "next") {
      if (viewMonth === 12) {
        setViewMonth(1)
        setViewYear(viewYear + 1)
      } else {
        setViewMonth(viewMonth + 1)
      }
    } else {
      if (viewMonth === 1) {
        setViewMonth(12)
        setViewYear(viewYear - 1)
      } else {
        setViewMonth(viewMonth - 1)
      }
    }
  }

  const calendarDays = generateCalendarDays()

  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-green-800 to-green-700 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigateMonth("prev")} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="text-center">
            <h2 className="text-xl font-bold">
              {HIJRI_MONTHS[viewMonth - 1].en} {viewYear} AH
            </h2>
            <p className="text-green-100 text-sm mt-1">
              {HIJRI_MONTHS[viewMonth - 1].ar} {viewYear} هـ
            </p>
          </div>

          <button onClick={() => navigateMonth("next")} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="text-center">
          <p className="text-green-100 text-sm">Today: {currentDate.formatted}</p>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        <div className="grid grid-cols-7 gap-1 mb-4">
          {["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map(({ day, isToday, hasEvent, events }) => (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              className={`
                relative p-3 text-center rounded-lg transition-all duration-200 hover:bg-green-50
                ${isToday ? "bg-green-800 text-white font-bold" : "text-gray-700"}
                ${selectedDate?.day === day && selectedDate?.month === viewMonth ? "ring-2 ring-green-500" : ""}
                ${hasEvent ? "bg-green-100" : ""}
              `}
            >
              <span className="text-sm">{day}</span>
              {hasEvent && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Events Section */}
      {showEvents && monthEvents.length > 0 && (
        <div className="border-t border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 mb-3">Islamic Events This Month</h3>
          <div className="space-y-2">
            {monthEvents.map((event, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-8 h-8 bg-green-800 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {event.day}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{event.name}</p>
                  <p className="text-sm text-gray-600">{event.nameArabic}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
