export interface DateFormatConfig {
  calendar: "buddhist" | "gregorian"; // พ.ศ. หรือ ค.ศ.
  dateStyle: "full" | "medium" | "short"; // เต็ม, ย่อ, ตัวเลข
  timeFormat: "24h" | "12h"; // 24 ชม. หรือ 12 ชม.
  showThaiPeriodSuffix: boolean; // มีคำว่า "น." ต่อท้ายเวลา
}

export const defaultDateConfig: DateFormatConfig = {
  calendar: "buddhist",
  dateStyle: "medium",
  timeFormat: "24h",
  showThaiPeriodSuffix: true,
};

const THAI_DAYS_FULL = [
  "วันอาทิตย์",
  "วันจันทร์",
  "วันอังคาร",
  "วันพุธ",
  "วันพฤหัสบดี",
  "วันศุกร์",
  "วันเสาร์",
];

const THAI_DAYS_SHORT = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

const THAI_MONTHS_FULL = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const THAI_MONTHS_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

export function formatCustomDateTime(
  date: Date,
  lang: "th" | "en",
  config: DateFormatConfig = defaultDateConfig
): { dateStr: string; timeStr: string; fullDateStr: string } {
  const dayIndex = date.getDay();
  const dayOfMonth = date.getDate();
  const monthIndex = date.getMonth();
  const yearCE = date.getFullYear();
  const yearBE = yearCE + 543;

  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");

  let dateStr = "";
  let fullDateStr = "";
  let timeStr = "";

  if (lang === "th") {
    const yearDisplay = config.calendar === "buddhist" ? yearBE : yearCE;
    const yearSuffix = config.calendar === "buddhist" ? ` พ.ศ. ${yearDisplay}` : ` ค.ศ. ${yearDisplay}`;

    // Full Date: e.g. วันอังคารที่ 29 กันยายน พ.ศ. 2569
    fullDateStr = `${THAI_DAYS_FULL[dayIndex]}ที่ ${dayOfMonth} ${THAI_MONTHS_FULL[monthIndex]}${yearSuffix}`;

    if (config.dateStyle === "full") {
      dateStr = fullDateStr;
    } else if (config.dateStyle === "short") {
      const monthNumber = (monthIndex + 1).toString().padStart(2, "0");
      const dayNumber = dayOfMonth.toString().padStart(2, "0");
      dateStr = `${dayNumber}/${monthNumber}/${yearDisplay}`;
    } else {
      // Medium: e.g. อ. 29 ก.ย. 2569
      dateStr = `${THAI_DAYS_SHORT[dayIndex]} ${dayOfMonth} ${THAI_MONTHS_SHORT[monthIndex]} ${yearDisplay}`;
    }

    // Time Formatting
    if (config.timeFormat === "12h") {
      const period = hours >= 12 ? "หลังเที่ยง" : "ก่อนเที่ยง";
      const h12 = hours % 12 || 12;
      timeStr = `${h12.toString().padStart(2, "0")}:${minutes} ${period}`;
    } else {
      const suffix = config.showThaiPeriodSuffix ? " น." : "";
      timeStr = `${hours.toString().padStart(2, "0")}:${minutes}${suffix}`;
    }
  } else {
    // English Formatting
    const EN_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const EN_DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const EN_MONTHS = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const EN_MONTHS_SHORT = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    fullDateStr = `${EN_DAYS[dayIndex]}, ${EN_MONTHS[monthIndex]} ${dayOfMonth}, ${yearCE}`;

    if (config.dateStyle === "full") {
      dateStr = fullDateStr;
    } else if (config.dateStyle === "short") {
      const monthNumber = (monthIndex + 1).toString().padStart(2, "0");
      const dayNumber = dayOfMonth.toString().padStart(2, "0");
      dateStr = `${dayNumber}/${monthNumber}/${yearCE}`;
    } else {
      dateStr = `${EN_DAYS_SHORT[dayIndex]} ${dayOfMonth} ${EN_MONTHS_SHORT[monthIndex]} ${yearCE}`;
    }

    if (config.timeFormat === "12h") {
      const period = hours >= 12 ? "PM" : "AM";
      const h12 = hours % 12 || 12;
      timeStr = `${h12.toString().padStart(2, "0")}:${minutes} ${period}`;
    } else {
      timeStr = `${hours.toString().padStart(2, "0")}:${minutes}`;
    }
  }

  return { dateStr, timeStr, fullDateStr };
}

/**
 * แปลง Date | string | number เป็น Date object ที่ปลอดภัย
 */
export function parseSafeDate(input: Date | string | number | null | undefined): Date {
  if (!input) return new Date();
  if (input instanceof Date) return isNaN(input.getTime()) ? new Date() : input;
  const d = new Date(input);
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * ฟอร์แมตวันที่แบบไทยเต็มรูปแบบ (100% Thai Buddhist Era)
 * ตัวอย่าง: วันพฤหัสบดีที่ 1 ตุลาคม 2569 เวลา 13:50:26 น.
 */
export function formatFullThaiDate(
  dateInput: Date | string | number,
  options?: {
    includeWeekday?: boolean;
    includeTime?: boolean;
    includeSeconds?: boolean;
  }
): string {
  try {
    const d = parseSafeDate(dateInput);
    const dayIndex = d.getDay();
    const dayOfMonth = d.getDate();
    const monthIndex = d.getMonth();
    const yearBE = d.getFullYear() + 543;
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const seconds = d.getSeconds().toString().padStart(2, "0");

    const weekday = options?.includeWeekday !== false ? `${THAI_DAYS_FULL[dayIndex]}ที่ ` : "";
    let str = `${weekday}${dayOfMonth} ${THAI_MONTHS_FULL[monthIndex]} ${yearBE}`;

    if (options?.includeTime !== false) {
      if (options?.includeSeconds) {
        str += ` เวลา ${hours}:${minutes}:${seconds} น.`;
      } else {
        str += ` เวลา ${hours}:${minutes} น.`;
      }
    }

    return str;
  } catch {
    return String(dateInput);
  }
}

/**
 * ฟอร์แมตเวลาสัมพัทธ์ภาษาไทย (Relative Time)
 * ตัวอย่าง: เมื่อสักครู่, 5 นาทีที่แล้ว, 2 ชั่วโมงที่แล้ว, เมื่อวานนี้
 */
export function formatRelativeThaiTime(dateInput: Date | string | number): string {
  try {
    const date = parseSafeDate(dateInput);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return "เมื่อสักครู่";
    if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
    if (diffHour < 24) return `${diffHour} ชั่วโมงที่แล้ว`;
    if (diffDay === 1) return "เมื่อวานนี้";
    if (diffDay < 7) return `${diffDay} วันที่แล้ว`;

    const dayOfMonth = date.getDate();
    const monthIndex = date.getMonth();
    const yearShortBE = (date.getFullYear() + 543) % 100;
    return `${dayOfMonth} ${THAI_MONTHS_SHORT[monthIndex]} ${yearShortBE}`;
  } catch {
    return String(dateInput);
  }
}

/**
 * ฟอร์แมตวันที่แบบย่อ/กลางภาษาไทย (Medium / Short Thai Date)
 * ตัวอย่าง: 1 ต.ค. 2569 13:50 น.
 */
export function formatThaiDateTime(
  dateInput: Date | string | number,
  style: "short" | "medium" | "full" = "medium"
): string {
  const d = parseSafeDate(dateInput);
  const dayOfMonth = d.getDate();
  const monthIndex = d.getMonth();
  const yearBE = d.getFullYear() + 543;
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");

  if (style === "short") {
    const dayStr = dayOfMonth.toString().padStart(2, "0");
    const monthStr = (monthIndex + 1).toString().padStart(2, "0");
    return `${dayStr}/${monthStr}/${yearBE}`;
  }

  if (style === "full") {
    return formatFullThaiDate(d);
  }

  return `${dayOfMonth} ${THAI_MONTHS_SHORT[monthIndex]} ${yearBE} ${hours}:${minutes} น.`;
}
