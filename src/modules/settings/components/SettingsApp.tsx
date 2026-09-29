"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Image as ImageIcon,
  Server,
  Layers,
  Info,
  Check,
  Globe,
  Calendar,
  Clock,
  Cpu,
  Sparkles,
} from "lucide-react";
import { useWindowManager } from "@/core/context/WindowManagerContext";
import { formatCustomDateTime } from "@/core/lib/dateFormat";

const wallpapers = [
  {
    id: "dcms-purple",
    name: "Deep Violet (Default)",
    preview: "from-[#0f0b1f] via-[#1b1236] to-[#0a0715]",
  },
  {
    id: "cyber-blue",
    name: "Cyber Horizon",
    preview: "from-[#0b1329] via-[#102a45] to-[#060c1c]",
  },
  {
    id: "emerald-nebula",
    name: "Deep Emerald",
    preview: "from-[#091b1a] via-[#0d2e2b] to-[#051110]",
  },
  {
    id: "midnight-dark",
    name: "Onyx Minimal",
    preview: "from-[#0a0a0a] via-[#171717] to-[#050505]",
  },
];

export function SettingsApp({ windowId }: { windowId: string }) {
  const {
    wallpaper,
    setWallpaper,
    modules,
    language,
    setLanguage,
    dateFormatConfig,
    setDateFormatConfig,
  } = useWindowManager();

  const [activeTab, setActiveTab] = useState<
    "appearance" | "datetime" | "system" | "about"
  >("datetime");

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const preview = formatCustomDateTime(now, language, dateFormatConfig);

  return (
    <div className="flex h-full bg-[#120e24] text-slate-100 select-text font-sans">
      {/* Settings Sidebar */}
      <div className="w-56 border-r border-white/10 bg-white/[0.02] p-3 flex flex-col gap-1 shrink-0">
        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          การตั้งค่า (Settings)
        </div>

        <button
          onClick={() => setActiveTab("datetime")}
          className={`cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            activeTab === "datetime"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-300 hover:bg-white/5"
          }`}
        >
          <Calendar className="w-4 h-4" /> วันที่ & ภาษา (Date & Lang)
        </button>

        <button
          onClick={() => setActiveTab("appearance")}
          className={`cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            activeTab === "appearance"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-300 hover:bg-white/5"
          }`}
        >
          <ImageIcon className="w-4 h-4" /> ภาพพื้นหลัง (Wallpaper)
        </button>

        <button
          onClick={() => setActiveTab("system")}
          className={`cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            activeTab === "system"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-300 hover:bg-white/5"
          }`}
        >
          <Server className="w-4 h-4" /> ระบบ & PM2 / Database
        </button>

        <button
          onClick={() => setActiveTab("about")}
          className={`cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            activeTab === "about"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-300 hover:bg-white/5"
          }`}
        >
          <Info className="w-4 h-4" /> เกี่ยวกับระบบ (About)
        </button>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Tab 1: Date & Language Settings */}
        {activeTab === "datetime" && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-base font-bold text-white mb-1">
                การตั้งค่าวันที่ เวลา และภาษา (Language & Date Format)
              </h2>
              <p className="text-xs text-slate-400">
                กำหนดรูปแบบการแสดงวันที่และเวลาเป็นภาษาไทย 100% (พุทธศักราช พ.ศ., วันและเดือนภาษาไทย)
              </p>
            </div>

            {/* Live Preview Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-purple-950/50 border border-indigo-500/30 shadow-lg">
              <div className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5" /> ตัวอย่างการแสดงผลบน Top Menu Bar (Live Preview)
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10">
                <div className="text-xs text-slate-400 font-medium">แถบแสดงผลด้านบน:</div>
                <div className="flex items-center gap-2.5 font-medium text-slate-200 text-sm">
                  <span className="text-indigo-200">{preview.dateStr}</span>
                  <span className="font-bold text-white bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
                    {preview.timeStr}
                  </span>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 mt-2 text-right">
                แบบเต็ม: <span className="text-slate-200">{preview.fullDateStr}</span>
              </div>
            </div>

            {/* Setting 1: Language */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">ภาษาหลักของระบบ (System Language)</div>
                  <div className="text-xs text-slate-400">
                    เลือกภาษาไทยเพื่อแสดงผลชื่อวัน เดือน และเมนูเป็นภาษาไทย
                  </div>
                </div>
                <div className="flex p-1 rounded-xl bg-black/30 border border-white/10">
                  <button
                    onClick={() => setLanguage("th")}
                    className={`cursor-pointer px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      language === "th"
                        ? "bg-indigo-600 text-white shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    🇹🇭 ภาษาไทย (TH)
                  </button>
                  <button
                    onClick={() => setLanguage("en")}
                    className={`cursor-pointer px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      language === "en"
                        ? "bg-indigo-600 text-white shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    🇺🇸 English (EN)
                  </button>
                </div>
              </div>
            </div>

            {/* Setting 2: Calendar System (BE vs CE) */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
              <div className="text-sm font-semibold text-white">ระบบศักราชของปี (Year System)</div>
              <p className="text-xs text-slate-400">
                เลือกรูปแบบปีที่ต้องการให้แสดงผลในระบบ
              </p>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setDateFormatConfig({ calendar: "buddhist" })}
                  className={`cursor-pointer p-3 rounded-xl border text-left transition-all ${
                    dateFormatConfig.calendar === "buddhist"
                      ? "border-indigo-500 bg-indigo-500/15 text-white"
                      : "border-white/10 bg-black/20 text-slate-300 hover:border-white/20"
                  }`}
                >
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    <span>พุทธศักราช (พ.ศ.)</span>
                    {dateFormatConfig.calendar === "buddhist" && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    แสดงปี พ.ศ. {now.getFullYear() + 543} (มาตรฐานภาษาไทย 100%)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDateFormatConfig({ calendar: "gregorian" })}
                  className={`cursor-pointer p-3 rounded-xl border text-left transition-all ${
                    dateFormatConfig.calendar === "gregorian"
                      ? "border-indigo-500 bg-indigo-500/15 text-white"
                      : "border-white/10 bg-black/20 text-slate-300 hover:border-white/20"
                  }`}
                >
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    <span>คริสต์ศักราช (ค.ศ.)</span>
                    {dateFormatConfig.calendar === "gregorian" && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    แสดงปี ค.ศ. {now.getFullYear()}
                  </div>
                </button>
              </div>
            </div>

            {/* Setting 3: Date Format Style */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
              <div className="text-sm font-semibold text-white">รูปแบบการแสดงวันที่ (Date Format Style)</div>
              <p className="text-xs text-slate-400">
                เลือกระดับความละเอียดของชื่อวันและเดือน
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDateFormatConfig({ dateStyle: "medium" })}
                  className={`cursor-pointer p-2.5 rounded-xl border text-center transition-all ${
                    dateFormatConfig.dateStyle === "medium"
                      ? "border-indigo-500 bg-indigo-500/15 text-white"
                      : "border-white/10 bg-black/20 text-slate-300 hover:border-white/20"
                  }`}
                >
                  <div className="text-xs font-bold">แบบย่อ (แนะนำ)</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {language === "th" ? `อ. ${now.getDate()} ก.ย.` : `Tue ${now.getDate()} Sep`}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDateFormatConfig({ dateStyle: "full" })}
                  className={`cursor-pointer p-2.5 rounded-xl border text-center transition-all ${
                    dateFormatConfig.dateStyle === "full"
                      ? "border-indigo-500 bg-indigo-500/15 text-white"
                      : "border-white/10 bg-black/20 text-slate-300 hover:border-white/20"
                  }`}
                >
                  <div className="text-xs font-bold">แบบเต็ม (Full)</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                    {language === "th" ? "วันอังคารที่..." : "Tuesday, Sep..."}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDateFormatConfig({ dateStyle: "short" })}
                  className={`cursor-pointer p-2.5 rounded-xl border text-center transition-all ${
                    dateFormatConfig.dateStyle === "short"
                      ? "border-indigo-500 bg-indigo-500/15 text-white"
                      : "border-white/10 bg-black/20 text-slate-300 hover:border-white/20"
                  }`}
                >
                  <div className="text-xs font-bold">แบบตัวเลข (Short)</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    29/09/{dateFormatConfig.calendar === "buddhist" && language === "th" ? now.getFullYear() + 543 : now.getFullYear()}
                  </div>
                </button>
              </div>
            </div>

            {/* Setting 4: Time Format & Suffix */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">รูปแบบเวลา (Time Format)</div>
                  <div className="text-xs text-slate-400">เลือกแบบ 24 ชั่วโมง หรือ 12 ชั่วโมง</div>
                </div>
                <div className="flex p-1 rounded-xl bg-black/30 border border-white/10">
                  <button
                    onClick={() => setDateFormatConfig({ timeFormat: "24h" })}
                    className={`cursor-pointer px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      dateFormatConfig.timeFormat === "24h"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    24 ชั่วโมง
                  </button>
                  <button
                    onClick={() => setDateFormatConfig({ timeFormat: "12h" })}
                    className={`cursor-pointer px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      dateFormatConfig.timeFormat === "12h"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    12 ชั่วโมง
                  </button>
                </div>
              </div>

              {language === "th" && dateFormatConfig.timeFormat === "24h" && (
                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-slate-200">
                      แสดงคำว่า "น." ต่อท้ายเวลา
                    </div>
                    <div className="text-[11px] text-slate-400">เช่น 15:35 น.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setDateFormatConfig({
                        showThaiPeriodSuffix: !dateFormatConfig.showThaiPeriodSuffix,
                      })
                    }
                    className={`cursor-pointer w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                      dateFormatConfig.showThaiPeriodSuffix
                        ? "bg-indigo-600"
                        : "bg-white/20"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        dateFormatConfig.showThaiPeriodSuffix
                          ? "translate-x-5"
                          : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Appearance (Wallpapers) */}
        {activeTab === "appearance" && (
          <div>
            <h2 className="text-base font-bold text-white mb-1">ภาพพื้นหลังหน้าจอเดสก์ท็อป</h2>
            <p className="text-xs text-slate-400 mb-6">
              เลือกธีมสีและวอลเปเปอร์ที่คุณต้องการสำหรับหน้าจอ Desktop OS
            </p>

            <div className="grid grid-cols-2 gap-4">
              {wallpapers.map((wp) => {
                const isSelected = wallpaper === wp.id;
                return (
                  <div
                    key={wp.id}
                    onClick={() => setWallpaper(wp.id)}
                    className={`cursor-pointer p-3 rounded-2xl border transition-all ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/20"
                        : "border-white/10 hover:border-white/20 bg-white/[0.02]"
                    }`}
                  >
                    <div
                      className={`h-28 rounded-xl bg-gradient-to-br ${wp.preview} border border-white/10 relative overflow-hidden mb-2`}
                    >
                      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-md">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <div className="text-xs font-medium text-white">{wp.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: System Status */}
        {activeTab === "system" && (
          <div>
            <h2 className="text-base font-bold text-white mb-1">สถานะระบบ & Environment</h2>
            <p className="text-xs text-slate-400 mb-6">
              ข้อมูลสภาพแวดล้อมสถาปัตยกรรมระบบ PM2 และการเชื่อมต่อฐานข้อมูล
            </p>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">PM2 Process Runtime</div>
                    <div className="text-xs text-slate-400">
                      ทำงานแบบคลัสเตอร์ ประหยัดทรัพยากร และ auto-restart
                    </div>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Online
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Modular Architecture Status</div>
                    <div className="text-xs text-slate-400">
                      โหลดโมดูลอิสระที่ทำงานอยู่: {modules.length} โมดูล
                    </div>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Active
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Universal Database Engine</div>
                    <div className="text-xs text-slate-400">
                      รองรับ SQLite (Active), MySQL, PostgreSQL
                    </div>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Connected
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: About */}
        {activeTab === "about" && (
          <div>
            <h2 className="text-base font-bold text-white mb-1">DCMS Core Web Desktop OS</h2>
            <p className="text-xs text-slate-400 mb-6">
              ระบบโครงสร้างพื้นฐานเว็บแอปพลิเคชันแบบเดสก์ท็อป พร้อมระบบโมดูลแยกส่วน
            </p>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-slate-300 space-y-3 leading-relaxed">
              <div className="font-semibold text-white text-sm">จุดเด่นของสถาปัตยกรรม:</div>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
                <li>
                  <strong className="text-slate-200">Decoupled Modules:</strong> แต่ละโมดูลแยกโฟลเดอร์อิสระ มี config, UI และ types ของตัวเอง
                </li>
                <li>
                  <strong className="text-slate-200">100% Thai Date & Calendar:</strong> รองรับพุทธศักราช (พ.ศ.) ชื่อวันและเดือนภาษาไทยสมบูรณ์แบบ
                </li>
                <li>
                  <strong className="text-slate-200">Multi-Database Ready:</strong> รองรับทั้ง SQLite, MySQL, และ PostgreSQL
                </li>
                <li>
                  <strong className="text-slate-200">Lightweight PM2:</strong> ใช้ทรัพยากรต่ำมาก ไม่ต้องพึ่งพา Docker
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
