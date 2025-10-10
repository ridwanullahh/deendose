"use client"

import { useState } from "react"
import Navigation from "@/components/navigation"
import HijriCalendar from "@/components/hijri-calendar"
import { getCurrentHijriDate, getTodaysIslamicEvents, type HijriDate } from "@/lib/hijri-calendar"

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<HijriDate | null>(null)
  const currentHijriDate = getCurrentHijriDate()
  const todaysEvents = getTodaysIslamicEvents()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navigation />

      {/* Header */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Islamic Calendar</h1>
          <p className="text-xl text-gray-600 mb-8">Stay connected with important Islamic dates and events</p>
          <div className="bg-white rounded-lg p-6 inline-block shadow-md">
            <p className="text-sm text-gray-500 mb-2">Today's Hijri Date</p>
            <p className="text-2xl font-bold text-green-800">{currentHijriDate.formatted}</p>
            <p className="text-lg text-gray-600 mt-1">{currentHijriDate.formattedArabic}</p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <HijriCalendar onDateSelect={setSelectedDate} showEvents={true} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Today's Events */}
            {todaysEvents.length > 0 && (
              <div className="bg-white rounded-xl shadow-md border border-green-100 overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-green-800 to-green-700 text-white">
                  <h3 className="font-semibold">Today's Events</h3>
                </div>
                <div className="p-4 space-y-3">
                  {todaysEvents.map((event, index) => (
                    <div key={index} className="p-3 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-800">{event.name}</h4>
                      <p className="text-sm text-green-600">{event.nameArabic}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Date Info */}
            {selectedDate && (
              <div className="bg-white rounded-xl shadow-md border border-blue-100 overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-blue-800 to-blue-700 text-white">
                  <h3 className="font-semibold">Selected Date</h3>
                </div>
                <div className="p-4">
                  <p className="text-lg font-medium text-gray-800">{selectedDate.formatted}</p>
                  <p className="text-gray-600">{selectedDate.formattedArabic}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {selectedDate.dayName} • {selectedDate.dayNameArabic}
                  </p>
                </div>
              </div>
            )}

            {/* Islamic Calendar Info */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-gray-800 to-gray-700 text-white">
                <h3 className="font-semibold">About Islamic Calendar</h3>
              </div>
              <div className="p-4 space-y-3 text-sm text-gray-700">
                <p>The Islamic calendar is a lunar calendar consisting of 12 months in a year of 354 or 355 days.</p>
                <p>
                  It is used to determine the proper days of Islamic holidays and rituals, such as the annual period of
                  fasting and the proper time for the Hajj.
                </p>
                <p>
                  The calendar started in the year 622 CE, marking the Hijra (migration) of Prophet Muhammad (PBUH) from
                  Mecca to Medina.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
