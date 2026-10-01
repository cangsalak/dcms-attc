"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutGrid,
  Monitor,
  Search,
  Activity,
  Bell,
  Wifi,
  Cloud,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Shield,
  Lock,
  Layers,
  Maximize2,
  Minimize2,
  Settings,
  SlidersHorizontal,
} from "lucide-react";
import { useWindowManager } from "../context/WindowManagerContext";
import { useAuth } from "../context/AuthContext";
import { getModuleById } from "../registry/module-registry";
import { formatCustomDateTime } from "../lib/dateFormat";
import { DynamicIcon } from "./IconResolver";
import { NotificationCenter } from "./NotificationCenter";

export function TopMenuBar() {
  const {
    activeWindowId,
    windows,
    modules,
    language,
    dateFormatConfig,
    isWidgetsOpen,
    toggleWidgets,
    setLauncherOpen,
    minimizeAll,
    focusWindow,
    minimizeWindow,
    setLanguage,
    openApp,
    isFullscreen,
    toggleFullscreen,
  } = useWindowManager();
  const { user, logout, lock } = useAuth();

  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  const [showCoreMenu, setShowCoreMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const { dateStr, timeStr } = formatCustomDateTime(
        now,
        language,
        dateFormatConfig
      );
      setCurrentTime(timeStr);
      setCurrentDate(dateStr);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, [language, dateFormatConfig]);

  const handleWindowTabClick = (win: any) => {
    if (activeWindowId === win.id && !win.isMinimized) {
      minimizeWindow(win.id);
    } else {
      focusWindow(win.id);
    }
  };

  return (
    <header className="h-8 w-full glass-topbar px-2.5 flex items-center justify-between text-xs text-slate-200 select-none z-40 relative">
      {/* Left: Synology DSM Main Menu + Open App Tabs */}
      <div className="flex items-center gap-1.5 min-w-0">
        {/* Synology Main Menu Button (4 square dots) */}
        <button
          onClick={() => setLauncherOpen(true)}
          className="cursor-pointer p-1.5 rounded-lg hover:bg-white/15 text-white flex items-center justify-center transition-all active:scale-95 group"
          title="เมนูหลัก (Main Menu)"
        >
          <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5">
            <span className="w-1.5 h-1.5 rounded-[2px] bg-cyan-400 group-hover:bg-white transition-colors" />
            <span className="w-1.5 h-1.5 rounded-[2px] bg-cyan-400 group-hover:bg-white transition-colors" />
            <span className="w-1.5 h-1.5 rounded-[2px] bg-cyan-400 group-hover:bg-white transition-colors" />
            <span className="w-1.5 h-1.5 rounded-[2px] bg-cyan-400 group-hover:bg-white transition-colors" />
          </div>
        </button>

        {/* Show Desktop Button */}
        <button
          onClick={minimizeAll}
          className="cursor-pointer p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          title="แสดงเดสก์ท็อป (Show Desktop)"
        >
          <Monitor className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-white/10 mx-1" />

        {/* Synology DSM Taskbar Tabs (Open Windows) */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {windows.map((win) => {
            const isActive = activeWindowId === win.id && !win.isMinimized;
            const app = getModuleById(modules, win.appId);

            return (
              <button
                key={win.id}
                onClick={() => handleWindowTabClick(win)}
                className={`cursor-pointer px-2.5 py-1 rounded-lg flex items-center gap-2 text-xs transition-all max-w-[170px] truncate ${
                  isActive
                    ? "bg-white/20 text-white font-medium shadow-sm border border-white/15"
                    : win.isMinimized
                    ? "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white opacity-60"
                    : "bg-white/10 text-slate-200 hover:bg-white/15 hover:text-white"
                }`}
                title={win.title}
              >
                <DynamicIcon name={win.iconName} className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">{win.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Search, Widgets, Date/Time, User Tray */}
      <div className="flex items-center gap-2.5 text-slate-300 shrink-0">
        {/* Universal Search Button */}
        <button
          onClick={() => setLauncherOpen(true)}
          className="cursor-pointer p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          title="ค้นหาด่วน (Search)"
        >
          <Search className="w-3.5 h-3.5" />
        </button>

        {/* Notification Center Button */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`cursor-pointer p-1.5 rounded-lg transition-colors relative flex items-center justify-center ${
              showNotifications
                ? "bg-indigo-500/25 text-indigo-300 border border-indigo-500/40"
                : "hover:bg-white/10 text-slate-300 hover:text-white"
            }`}
            title="ศูนย์การแจ้งเตือน (Notifications)"
          >
            <Bell className="w-3.5 h-3.5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
              </span>
            )}
          </button>
          <NotificationCenter
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
            onUnreadCountChange={setUnreadNotificationsCount}
          />
        </div>

        {/* Synology Widgets Toggle Button */}
        <button
          onClick={toggleWidgets}
          className={`cursor-pointer p-1.5 rounded-lg transition-colors flex items-center gap-1 ${
            isWidgetsOpen
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
              : "hover:bg-white/10 text-slate-300 hover:text-white"
          }`}
          title="ตัวตรวจสอบระบบ (System Widgets)"
        >
          <Activity className="w-3.5 h-3.5" />
        </button>

        {/* Fullscreen Mode Toggle Button (ตัวขยายเต็มหน้าจอ) */}
        <button
          onClick={toggleFullscreen}
          className={`cursor-pointer p-1.5 rounded-lg transition-colors flex items-center justify-center ${
            isFullscreen
              ? "bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 shadow-sm shadow-indigo-500/20"
              : "hover:bg-white/10 text-slate-300 hover:text-white"
          }`}
          title={
            isFullscreen
              ? "ออกจากโหมดเต็มหน้าจอ (Exit Full Screen)"
              : "ขยายเต็มหน้าจอ (Full Screen Mode)"
          }
        >
          {isFullscreen ? (
            <Minimize2 className="w-3.5 h-3.5 text-indigo-300" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Language Switcher */}
        <button
          onClick={() => setLanguage(language === "th" ? "en" : "th")}
          className="cursor-pointer px-1.5 py-0.5 rounded hover:bg-white/10 text-[11px] font-semibold text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
          title="สลับภาษา / Switch Language"
        >
          <span>🌐</span>
          <span className="uppercase">{language}</span>
        </button>

        {/* DB & Cloud Status */}
        <div
          className="flex items-center gap-1.5 text-emerald-400 text-[11px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 hidden sm:flex"
          title="Server & Database Online"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <Cloud className="w-3.5 h-3.5" />
          <span>Online</span>
        </div>

        {/* Clock & Date (100% Thai support) */}
        <div className="font-medium text-slate-200 text-xs tracking-tight flex items-center gap-1.5 pl-1">
          <span>{currentDate}</span>
          <span className="font-bold text-white bg-white/10 px-1.5 py-0.5 rounded">
            {currentTime}
          </span>
        </div>

        {/* User Account Dropdown */}
        {user && (
          <div className="relative pl-1 border-l border-white/10">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="cursor-pointer flex items-center gap-1.5 px-1.5 py-0.5 rounded-full hover:bg-white/10 transition-colors"
            >
              <img
                src={user.avatar}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="w-5 h-5 rounded-full object-cover border border-white/30"
              />
              <span className="text-[11px] text-slate-200 max-w-[90px] truncate hidden md:inline">
                {user.name.split(" ")[0]}
              </span>
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 top-8 w-60 glass-panel rounded-2xl p-3 text-xs text-slate-200 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center gap-3 pb-3 border-b border-white/10 mb-2">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-cyan-400/40"
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-white truncate text-xs">
                        {user.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {user.email}
                      </div>
                      <span className="inline-block mt-1 text-[10px] px-2 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-medium">
                        {user.role}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        (window as any).__dcms_pending_settings_tab = "profile";
                      }
                      openApp("settings", { tab: "profile" });
                      window.dispatchEvent(
                        new CustomEvent("dcms-open-settings-tab", { detail: "profile" })
                      );
                      setShowUserMenu(false);
                    }}
                    className="cursor-pointer w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 text-slate-300 flex items-center gap-2 mb-1 transition-colors"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>โปรไฟล์ส่วนตัว & รหัสผ่าน</span>
                  </button>

                  <button
                    onClick={() => {
                      openApp("control-panel");
                      setShowUserMenu(false);
                    }}
                    className="cursor-pointer w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 text-slate-300 flex items-center gap-2 mb-1 transition-colors"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                    <span>แผงควบคุม (Control Panel)</span>
                  </button>

                  <button
                    onClick={() => {
                      openApp("settings");
                      setShowUserMenu(false);
                    }}
                    className="cursor-pointer w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 text-slate-300 flex items-center gap-2 mb-1 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>การตั้งค่าระบบ (Settings)</span>
                  </button>

                  {/* Lock Screen Action */}
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      lock();
                    }}
                    className="cursor-pointer w-full text-left px-3 py-1.5 rounded-lg hover:bg-indigo-500/20 text-indigo-300 flex items-center gap-2 mb-1 transition-colors"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>ล็อกหน้าจอ (Lock Screen)</span>
                  </button>

                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="cursor-pointer w-full text-left px-3 py-1.5 rounded-lg hover:bg-rose-500/20 text-rose-300 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>ออกจากระบบ (Log Out)</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
