"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ExternalLink,
  Shield,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  RefreshCw,
  Clock,
  Calendar,
  Eye,
} from "lucide-react";
import { useWindowManager } from "../context/WindowManagerContext";

interface NotificationItem {
  id: string;
  userId?: string | null;
  type: "info" | "success" | "warning" | "error" | "security";
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean | number | string;
  createdAt: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

export function NotificationCenter({
  isOpen,
  onClose,
  onUnreadCountChange,
}: NotificationCenterProps) {
  const { openApp, language } = useWindowManager();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        if (onUnreadCountChange) {
          onUnreadCountChange(data.unreadCount || 0);
        }
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  }, [onUnreadCountChange]);

  // Initial load and periodic polling (every 30s)
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Refetch whenever opened
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      if (onUnreadCountChange) {
        const remaining = notifications.filter(
          (n) => n.id !== id && (!n.isRead || n.isRead === 0 || n.isRead === "0")
        ).length;
        onUnreadCountChange(remaining);
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      if (onUnreadCountChange) onUnreadCountChange(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await fetch("/api/notifications?all=true", { method: "DELETE" });
      setNotifications([]);
      if (onUnreadCountChange) onUnreadCountChange(0);
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (onUnreadCountChange) {
        const remaining = notifications.filter(
          (n) => n.id !== id && (!n.isRead || n.isRead === 0 || n.isRead === "0")
        ).length;
        onUnreadCountChange(remaining);
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    markAsRead(item.id);
    setSelectedNotification(item);
  };

  const formatFullThaiDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("th-TH", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const getTypeBadgeText = (type: NotificationItem["type"]) => {
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
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
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
      return date.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const getTypeIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "security":
        return <Shield className="w-4 h-4 text-purple-400" />;
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      case "info":
      default:
        return <Info className="w-4 h-4 text-cyan-400" />;
    }
  };

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((n) => {
    const isUnread = !n.isRead || n.isRead === 0 || n.isRead === "0";
    if (filter === "unread") return isUnread;
    return true;
  });

  const unreadCount = notifications.filter(
    (n) => !n.isRead || n.isRead === 0 || n.isRead === "0"
  ).length;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Slide-down / Dropdown Notification Panel */}
      <div className="absolute right-3 top-9 w-84 sm:w-96 rounded-2xl glass-panel bg-[#16122cf2] border border-white/15 shadow-2xl text-slate-200 z-50 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-white/[0.03]">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-white text-xs">
              ศูนย์การแจ้งเตือน (Notifications)
            </span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={fetchNotifications}
              className="cursor-pointer p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="รีเฟรช"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="ปิด"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Filter & Actions Bar */}
        <div className="px-3.5 py-2 border-b border-white/5 bg-white/[0.01] flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/30 border border-white/5">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`cursor-pointer px-2.5 py-0.5 rounded-md font-medium transition-all ${
                filter === "all"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              ทั้งหมด ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={`cursor-pointer px-2.5 py-0.5 rounded-md font-medium transition-all ${
                filter === "unread"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              ยังไม่อ่าน ({unreadCount})
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="cursor-pointer text-slate-400 hover:text-cyan-300 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/5 transition-colors"
                title="ทำเครื่องหมายว่าอ่านแล้วทั้งหมด"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>อ่านทั้งหมด</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={clearAllNotifications}
                className="cursor-pointer text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-white/5 transition-colors"
                title="ล้างทั้งหมด"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5 max-h-[460px]">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 mb-2">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-xs font-medium">ไม่มีการแจ้งเตือน</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {filter === "unread" ? "คุณอ่านการแจ้งเตือนครบแล้ว" : "ยังไม่มีรายการแจ้งเตือนในระบบ"}
              </p>
            </div>
          ) : (
            filteredNotifications.map((item) => {
              const isUnread = !item.isRead || item.isRead === 0 || item.isRead === "0";
              return (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`group p-3 flex items-start gap-3 hover:bg-white/[0.04] transition-all cursor-pointer relative ${
                    isUnread ? "bg-indigo-500/[0.06]" : ""
                  }`}
                >
                  {/* Unread dot */}
                  {isUnread && (
                    <span className="absolute top-3 left-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  )}

                  {/* Icon */}
                  <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    {getTypeIcon(item.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-white truncate">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-snug line-clamp-2">
                      {item.message}
                    </p>
                    {item.link && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-cyan-400 hover:underline mt-1 font-medium">
                        <span>เปิด {item.link}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>

                  {/* Delete Item Button */}
                  <button
                    type="button"
                    onClick={(e) => deleteNotification(item.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-white/10 transition-all shrink-0 self-center"
                    title="ลบการแจ้งเตือนนี้"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer Bar */}
        <div className="p-2.5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => {
              openApp("settings");
              window.dispatchEvent(
                new CustomEvent("dcms-open-settings-tab", { detail: "notifications" })
              );
              onClose();
            }}
            className="cursor-pointer text-indigo-300 hover:text-indigo-200 hover:underline flex items-center gap-1.5 transition-colors font-medium text-[11px]"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>ดูประวัติการแจ้งเตือนทั้งหมด (View All)</span>
          </button>
          <span className="text-[10px] text-slate-500 font-mono">
            {notifications.length} รายการ
          </span>
        </div>
      </div>

      {/* Notification Detail Modal (หน้าดูข้อมูลการแจ้งเตือน) */}
      {selectedNotification && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setSelectedNotification(null)}
        >
          <div
            className="w-full max-w-lg bg-[#16122cf8] border border-white/20 rounded-2xl shadow-2xl p-6 text-slate-200 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  {getTypeIcon(selectedNotification.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-slate-300">
                      {getTypeBadgeText(selectedNotification.type)}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatRelativeTime(selectedNotification.createdAt)}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1">
                    {selectedNotification.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="cursor-pointer p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Time Details */}
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-black/40 p-2.5 rounded-xl border border-white/5">
              <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>บันทึกเมื่อ:</span>
              <span className="text-slate-200 font-medium">
                {formatFullThaiDate(selectedNotification.createdAt)}
              </span>
            </div>

            {/* Message Body */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                รายละเอียดข้อความ (Message Content)
              </div>
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap select-text max-h-60 overflow-y-auto">
                {selectedNotification.message}
              </div>
            </div>

            {/* Target App action if any */}
            {selectedNotification.link && (
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
                <div className="text-xs text-indigo-300">
                  มีรายการเชื่อมโยงกับแอป: <strong className="text-white uppercase">{selectedNotification.link}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    openApp(selectedNotification.link!);
                    setSelectedNotification(null);
                    onClose();
                  }}
                  className="cursor-pointer px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 shadow transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>เปิดแอป {selectedNotification.link}</span>
                </button>
              </div>
            )}

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={async () => {
                  await deleteNotification(selectedNotification.id, { stopPropagation: () => {} } as any);
                  setSelectedNotification(null);
                }}
                className="cursor-pointer px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ลบการแจ้งเตือน</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="cursor-pointer px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-medium transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
