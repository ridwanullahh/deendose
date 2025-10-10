// Hijri Calendar Utilities
export interface HijriDate {
  year: number
  month: number
  day: number
  monthName: string
  monthNameArabic: string
  dayName: string
  dayNameArabic: string
  formatted: string
  formattedArabic: string
}

export const HIJRI_MONTHS = [
  { en: "Muharram", ar: "مُحَرَّم" },
  { en: "Safar", ar: "صَفَر" },
  { en: "Rabi' al-Awwal", ar: "رَبِيع الأَوَّل" },
  { en: "Rabi' al-Thani", ar: "رَبِيع الثَّانِي" },
  { en: "Jumada al-Awwal", ar: "جُمَادَىٰ الأُولَىٰ" },
  { en: "Jumada al-Thani", ar: "جُمَادَىٰ الثَّانِيَة" },
  { en: "Rajab", ar: "رَجَب" },
  { en: "Sha'ban", ar: "شَعْبَان" },
  { en: "Ramadan", ar: "رَمَضَان" },
  { en: "Shawwal", ar: "شَوَّال" },
  { en: "Dhu al-Qi'dah", ar: "ذُو القِعْدَة" },
  { en: "Dhu al-Hijjah", ar: "ذُو الحِجَّة" },
]

export const HIJRI_DAYS = [
  { en: "Saturday", ar: "السبت" },
  { en: "Sunday", ar: "الأحد" },
  { en: "Monday", ar: "الاثنين" },
  { en: "Tuesday", ar: "الثلاثاء" },
  { en: "Wednesday", ar: "الأربعاء" },
  { en: "Thursday", ar: "الخميس" },
  { en: "Friday", ar: "الجمعة" },
]

// Convert Gregorian to Hijri (simplified algorithm)
export function gregorianToHijri(date: Date): HijriDate {
  // This is a simplified conversion. For production, use a proper library like moment-hijri
  const jd = gregorianToJulian(date)
  const hijriJd = jd - 1948439.5 // Hijri epoch
  const hijriYear = Math.floor(hijriJd / 354.367) + 1
  const remainingDays = hijriJd - (hijriYear - 1) * 354.367
  const hijriMonth = Math.floor(remainingDays / 29.531) + 1
  const hijriDay = Math.floor(remainingDays - (hijriMonth - 1) * 29.531) + 1

  const monthIndex = Math.max(0, Math.min(11, hijriMonth - 1))
  const dayIndex = date.getDay()

  return {
    year: hijriYear,
    month: hijriMonth,
    day: hijriDay,
    monthName: HIJRI_MONTHS[monthIndex].en,
    monthNameArabic: HIJRI_MONTHS[monthIndex].ar,
    dayName: HIJRI_DAYS[dayIndex].en,
    dayNameArabic: HIJRI_DAYS[dayIndex].ar,
    formatted: `${hijriDay} ${HIJRI_MONTHS[monthIndex].en} ${hijriYear} AH`,
    formattedArabic: `${hijriDay} ${HIJRI_MONTHS[monthIndex].ar} ${hijriYear} هـ`,
  }
}

function gregorianToJulian(date: Date): number {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  const a = Math.floor((14 - month) / 12)
  const y = year + 4800 - a
  const m = month + 12 * a - 3

  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  )
}

export function getCurrentHijriDate(): HijriDate {
  return gregorianToHijri(new Date())
}

export function getHijriDateString(date: Date, arabic = false): string {
  const hijriDate = gregorianToHijri(date)
  return arabic ? hijriDate.formattedArabic : hijriDate.formatted
}

// Important Islamic dates
export const ISLAMIC_EVENTS = [
  { month: 1, day: 1, name: "Islamic New Year", nameArabic: "رأس السنة الهجرية" },
  { month: 1, day: 10, name: "Day of Ashura", nameArabic: "يوم عاشوراء" },
  { month: 3, day: 12, name: "Mawlid an-Nabi", nameArabic: "المولد النبوي" },
  { month: 7, day: 27, name: "Isra and Mi'raj", nameArabic: "الإسراء والمعراج" },
  { month: 8, day: 15, name: "Mid-Sha'ban", nameArabic: "ليلة النصف من شعبان" },
  { month: 9, day: 1, name: "First Day of Ramadan", nameArabic: "أول رمضان" },
  { month: 9, day: 27, name: "Laylat al-Qadr", nameArabic: "ليلة القدر" },
  { month: 10, day: 1, name: "Eid al-Fitr", nameArabic: "عيد الفطر" },
  { month: 12, day: 10, name: "Eid al-Adha", nameArabic: "عيد الأضحى" },
]

export function getIslamicEventsForMonth(month: number): typeof ISLAMIC_EVENTS {
  return ISLAMIC_EVENTS.filter((event) => event.month === month)
}

export function getTodaysIslamicEvents(): typeof ISLAMIC_EVENTS {
  const today = getCurrentHijriDate()
  return ISLAMIC_EVENTS.filter((event) => event.month === today.month && event.day === today.day)
}
