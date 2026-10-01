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
    if (item.link) {
      openApp(item.link);
      onClose();
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
      </div>
    </>
  );
}
