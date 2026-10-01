/**
 * Notification Utilities & Helper Library (DCMS Core)
 * รวบรวมฟังก์ชันมาตรฐานสำหรับจัดการการแจ้งเตือน ให้ทุกโมดูลสามารถเรียกใช้ร่วมกันได้
 */

export type NotificationType = "info" | "success" | "warning" | "error" | "security";

export interface NotificationItem {
  id: string;
  userId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean | number | string;
  createdAt: string;
}

/**
 * ตรวจสอบว่ารายการแจ้งเตือนนี้ยังไม่ได้อ่านหรือไม่
 */
export function isNotificationUnread(isRead: boolean | number | string | undefined | null): boolean {
  if (isRead === undefined || isRead === null) return true;
  return !isRead || isRead === 0 || isRead === "0";
}

/**
 * ดึงชื่อป้ายกำกับภาษาไทยตามประเภทการแจ้งเตือน
 */
export function getNotificationBadgeText(type: NotificationType | string): string {
  switch (type) {
    case "security":
      return "ความปลอดภัย (Security)";
    case "success":
      return "สำเร็จ (Success)";
    case "warning":
      return "ข้อควรระวัง (Warning)";
    case "error":
      return "ข้อผิดพลาด (Error)";
    case "info":
    default:
      return "ข้อมูลทั่วไป (Info)";
  }
}

/**
 * ดึง Theme สีและสไตล์ของประเภทการแจ้งเตือน
 */
export function getNotificationTypeTheme(type: NotificationType | string): {
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  badgeClass: string;
} {
  switch (type) {
    case "security":
      return {
        color: "purple",
        bgClass: "bg-purple-500/10",
        textClass: "text-purple-400",
        borderClass: "border-purple-500/20",
        badgeClass: "bg-purple-500/15 text-purple-300 border-purple-500/30",
      };
    case "success":
      return {
        color: "emerald",
        bgClass: "bg-emerald-500/10",
        textClass: "text-emerald-400",
        borderClass: "border-emerald-500/20",
        badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      };
    case "warning":
      return {
        color: "amber",
        bgClass: "bg-amber-500/10",
        textClass: "text-amber-400",
        borderClass: "border-amber-500/20",
        badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      };
    case "error":
      return {
        color: "rose",
        bgClass: "bg-rose-500/10",
        textClass: "text-rose-400",
        borderClass: "border-rose-500/20",
        badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/30",
      };
    case "info":
    default:
      return {
        color: "cyan",
        bgClass: "bg-cyan-500/10",
        textClass: "text-cyan-400",
        borderClass: "border-cyan-500/20",
        badgeClass: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
      };
  }
}

/**
 * รายการประเภทสำหรับการแสดงผลใน Dropdown หรือ Filter Pills
 */
export const NOTIFICATION_TYPE_OPTIONS = [
  { id: "all", label: "ทุกประเภท" },
  { id: "info", label: "ข้อมูล (Info)" },
  { id: "success", label: "สำเร็จ (Success)" },
  { id: "security", label: "ความปลอดภัย (Security)" },
  { id: "warning", label: "ข้อควรระวัง (Warning)" },
  { id: "error", label: "ข้อผิดพลาด (Error)" },
] as const;
