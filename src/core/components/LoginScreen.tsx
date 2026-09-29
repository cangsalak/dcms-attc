"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Lock, ArrowRight, ShieldCheck, UserCheck, AlertCircle, Eye, EyeOff } from "lucide-react";

export function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@dcms.local");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
      setDate(
        now.toLocaleDateString("th-TH", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const res = await login(email, password);
    if (!res.success) {
      setError(res.error || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
      setIsSubmitting(false);
    }
  };

  const handleSelectDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("admin123");
    setError(null);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col items-center justify-between p-6 select-none bg-gradient-to-b from-[#0d091e] via-[#1a1236] to-[#080514]">
      {/* Background Decorative SVG Waves */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
      >
        <path
          d="M -100 450 C 300 320, 800 620, 1540 380"
          fill="none"
          stroke="#818cf8"
          strokeWidth="2.5"
          opacity="0.6"
        />
        <path
          d="M -100 500 C 320 370, 820 670, 1540 430"
          fill="none"
          stroke="#c084fc"
          strokeWidth="2"
          opacity="0.4"
        />
      </svg>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header: System Status & Time */}
      <div className="w-full flex items-center justify-between text-xs text-slate-300 z-10">
        <div className="flex items-center gap-2">
          <span className="text-indigo-400 font-bold text-sm">✦</span>
          <span className="font-semibold text-white tracking-wide">
            DCMS Core OS
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
            Secure Lock Screen
          </span>
        </div>
        <div className="flex items-center gap-2 text-emerald-400 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>ระบบพร้อมใช้งาน</span>
        </div>
      </div>

      {/* Center: Clock + Login Card */}
      <div className="flex flex-col items-center z-10 my-auto w-full max-w-sm">
        {/* Large Digital Clock */}
        <div className="text-center mb-6">
          <h1 className="text-6xl font-light tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] font-sans">
            {time}
          </h1>
          <p className="text-xs text-indigo-200/80 mt-1 font-medium">{date}</p>
        </div>

        {/* Login Box */}
        <div className="w-full glass-panel rounded-3xl p-7 border border-white/15 shadow-2xl backdrop-blur-2xl">
          {/* User Avatar */}
          <div className="flex flex-col items-center mb-5">
            <div className="relative mb-2">
              <img
                src={
                  email.includes("chanikan")
                    ? "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&auto=format&fit=crop&q=80"
                    : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80"
                }
                alt="User Avatar"
                className="w-20 h-20 rounded-full object-cover border-2 border-indigo-400/40 shadow-xl shadow-indigo-500/20"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white border-2 border-[#16112a] shadow">
                <Lock className="w-3 h-3" />
              </div>
            </div>
            <h2 className="text-sm font-semibold text-white">
              {email.includes("chanikan")
                ? "ชนิกานต์ วงศ์สุวรรณ (Admin)"
                : "ผู้ดูแลระบบสูงสุด (Super Admin)"}
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">กรุณาลงชื่อเข้าใช้ระบบ</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                อีเมล (Email)
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@dcms.local"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-black/30 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                รหัสผ่าน (Password)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3.5 pr-9 py-2 text-xs rounded-xl bg-black/30 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50 mt-4"
            >
              {isSubmitting ? (
                <span>กำลังเข้าสู่ระบบ...</span>
              ) : (
                <>
                  <span>เข้าสู่ระบบ (Sign In)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-5 pt-4 border-t border-white/10">
            <div className="text-[10px] text-slate-400 text-center mb-2">
              คลิกเพื่อเลือกบัญชีทดสอบด่วน:
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSelectDemo("admin@dcms.local")}
                className={`cursor-pointer px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all text-center border ${
                  email === "admin@dcms.local"
                    ? "bg-indigo-600/30 border-indigo-500 text-white"
                    : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                }`}
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleSelectDemo("chanikan.w@dcms.local")}
                className={`cursor-pointer px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all text-center border ${
                  email === "chanikan.w@dcms.local"
                    ? "bg-indigo-600/30 border-indigo-500 text-white"
                    : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                }`}
              >
                Admin (ชนิกานต์)
              </button>
            </div>
            <p className="text-[10px] text-slate-500 text-center mt-2 font-mono">
              รหัสผ่านเริ่มต้น: <span className="text-amber-400">admin123</span>
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="text-[11px] text-slate-400 flex items-center gap-3 z-10">
        <span>DCMS Desktop OS • Next.js 16</span>
        <span>•</span>
        <span>Session Protected</span>
      </div>
    </div>
  );
}
