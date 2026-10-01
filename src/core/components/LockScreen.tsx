"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Lock, ArrowRight, LogOut, AlertCircle, Loader2 } from "lucide-react";
import { formatCustomDateTime } from "../lib/dateFormat";
import { useWindowManager } from "../context/WindowManagerContext";

export function LockScreen() {
  const { user, unlock, logout } = useAuth();
  const { language, dateFormatConfig, wallpaper } = useWindowManager();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = formatCustomDateTime(now, language, dateFormatConfig);
      setTime(formatted.timeStr);
      setDate(formatted.fullDateStr);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [language, dateFormatConfig]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    const res = await unlock(password);
    if (!res.success) {
      setError(res.error || "รหัสผ่านไม่ถูกต้อง");
      setPassword("");
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-8 select-none bg-black/75 backdrop-blur-2xl text-slate-100 animate-in fade-in duration-300">
      {/* Top: Live Time & Date in Thai Buddhist Era */}
      <div className="flex flex-col items-center pt-8 text-center">
        <div className="text-6xl sm:text-7xl font-extralight tracking-tight text-white drop-shadow-md font-mono">
          {time}
        </div>
        <div className="mt-2 text-sm sm:text-base font-medium text-slate-300 drop-shadow">
          {date}
        </div>
      </div>

      {/* Middle: User Card & Password Input Form */}
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* User Avatar with subtle ring */}
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/30 shadow-2xl ring-4 ring-indigo-500/20">
            <img
              src={user.avatar || "/default-avatar.png"}
              alt={user.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80";
              }}
            />
          </div>
          <div className="absolute bottom-0 right-0 p-1.5 rounded-full bg-indigo-600 text-white shadow-lg border border-white/20">
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* User Info */}
        <div className="text-center mb-6">
          <h2 className="text-lg font-bold text-white drop-shadow">{user.name}</h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-xs text-indigo-300 bg-indigo-500/15 px-2.5 py-0.5 rounded-full border border-indigo-500/30 font-medium">
              {user.role}
            </span>
            {user.department && (
              <span className="text-xs text-slate-400">• {user.department}</span>
            )}
          </div>
        </div>

        {/* Password Form */}
        <form onSubmit={handleUnlock} className="w-full space-y-3">
          <div className="relative flex items-center">
            <input
              type="password"
              placeholder="กรอกรหัสผ่านเพื่อปลดล็อก..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              autoFocus
              className="w-full py-2.5 pl-4 pr-12 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all backdrop-blur-md shadow-inner"
            />
            <button
              type="submit"
              disabled={!password || isSubmitting}
              className="cursor-pointer absolute right-1.5 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30 disabled:hover:bg-indigo-600 transition-all shadow-md active:scale-95"
              title="ปลดล็อกหน้าจอ"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-rose-300 bg-rose-500/15 border border-rose-500/30 px-3 py-1.5 rounded-xl animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>
      </div>

      {/* Bottom: Switch User / Log Out */}
      <div className="pb-4">
        <button
          type="button"
          onClick={logout}
          className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>ออกจากระบบ / สลับบัญชี (Switch User)</span>
        </button>
      </div>
    </div>
  );
}
