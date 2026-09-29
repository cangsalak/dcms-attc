"use client";

import React, { useState, useEffect } from "react";
import {
  Wifi,
  Cloud,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Shield,
  Lock,
} from "lucide-react";
import { useWindowManager } from "../context/WindowManagerContext";
import { useAuth } from "../context/AuthContext";
import { getModuleById } from "../registry/module-registry";

import { formatCustomDateTime } from "../lib/dateFormat";

export function TopMenuBar() {
  const {
    activeWindowId,
    windows,
    modules,
    language,
    dateFormatConfig,
    setLanguage,
    openApp,
  } = useWindowManager();
  const { user, logout } = useAuth();

  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  const [showCoreMenu, setShowCoreMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

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

  const activeWindow = windows.find((w) => w.id === activeWindowId);
  const activeModule = activeWindow
    ? getModuleById(modules, activeWindow.appId)
    : null;

  return (
    <header className="h-7 w-full glass-topbar px-3 flex items-center justify-between text-xs text-slate-200 select-none z-50 relative">
      {/* Left Menu Items */}
      <div className="flex items-center gap-4">
        {/* Core Brand / Logo dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowCoreMenu(!showCoreMenu)}
            className="cursor-pointer flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-white/10 text-white font-semibold transition-colors active:scale-95"
          >
            <span className="text-indigo-400 font-black text-sm">✦</span>
            <span>DCMS Core</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showCoreMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowCoreMenu(false)}
              />
              <div className="absolute left-0 top-7 w-56 glass-panel rounded-xl py-1.5 text-xs text-slate-200 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-white/10 mb-1">
                  DCMS Core Architecture v1.0
                </div>
                <button
                  onClick={() => {
                    openApp("settings");
                    setShowCoreMenu(false);
                  }}
                  className="cursor-pointer w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white flex items-center justify-between"
                >
                  <span>การตั้งค่าระบบ (Settings)</span>
                </button>
                <button
                  onClick={() => {
                    openApp("app-store");
                    setShowCoreMenu(false);
                  }}
                  className="cursor-pointer w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white flex items-center justify-between"
                >
                  <span>ศูนย์โมดูล (App Store)</span>
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">ใหม่</span>
                </button>
                <div className="border-t border-white/10 my-1" />
                <button
                  onClick={() => {
                    logout();
                    setShowCoreMenu(false);
                  }}
                  className="cursor-pointer w-full text-left px-3 py-1.5 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 flex items-center gap-2"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>ล็อกหน้าจอ / ออกจากระบบ</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Current Active App Title */}
        <div className="flex items-center gap-2">
          <span className="text-white/20">•</span>
          <span className="font-medium text-slate-200 tracking-wide text-xs">
            {activeModule ? (language === "th" && activeModule.nameTh ? activeModule.nameTh : activeModule.name) : "หน้าจอหลัก (Desktop)"}
          </span>
        </div>
      </div>

      {/* Right System Tray */}
      <div className="flex items-center gap-3 text-slate-300">
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
          className="flex items-center gap-1.5 text-emerald-400 text-[11px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20"
          title="Server & Database Online"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <Cloud className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Online</span>
        </div>

        {/* Wifi */}
        <Wifi className="w-3.5 h-3.5 text-slate-300 hidden sm:block" />

        {/* Clock & Date */}
        <div className="font-medium text-slate-200 text-xs tracking-tight flex items-center gap-1.5 pl-1">
          <span>{currentDate}</span>
          <span className="font-bold text-white">{currentTime}</span>
        </div>

        {/* User Profile Avatar Dropdown */}
        {user && (
          <div className="relative pl-1 border-l border-white/10">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="cursor-pointer flex items-center gap-1.5 px-1.5 py-0.5 rounded-full hover:bg-white/10 transition-colors"
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-5 h-5 rounded-full object-cover border border-white/30"
              />
              <span className="text-[11px] text-slate-200 max-w-[100px] truncate hidden md:inline">
                {user.name.split(" ")[0]}
              </span>
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 top-7 w-60 glass-panel rounded-2xl p-3 text-xs text-slate-200 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center gap-3 pb-3 border-b border-white/10 mb-2">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover border border-indigo-400/40"
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-white truncate text-xs">
                        {user.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {user.email}
                      </div>
                      <span className="inline-block mt-1 text-[10px] px-2 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {user.role}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      openApp("users");
                      setShowUserMenu(false);
                    }}
                    className="cursor-pointer w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 text-slate-300 flex items-center gap-2 mb-1"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>จัดการบัญชีผู้ใช้</span>
                  </button>

                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="cursor-pointer w-full text-left px-3 py-1.5 rounded-lg hover:bg-rose-500/20 text-rose-300 flex items-center gap-2"
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
