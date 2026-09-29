"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Cpu,
  HardDrive,
  Activity,
  Users,
  ChevronDown,
  ChevronUp,
  X,
  RefreshCw,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useWindowManager } from "../context/WindowManagerContext";
import { useAuth } from "../context/AuthContext";

export function SynologyWidgets() {
  const { isWidgetsOpen, toggleWidgets, language } = useWindowManager();
  const { user } = useAuth();

  const [cpuUsage, setCpuUsage] = useState(6);
  const [ramUsage, setRamUsage] = useState(24);
  const [networkUp, setNetworkUp] = useState(14.2);
  const [networkDown, setNetworkDown] = useState(38.6);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Simulate subtle real-time resource fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage((prev) => Math.min(65, Math.max(3, Math.round(prev + (Math.random() * 6 - 3)))));
      setRamUsage((prev) => Math.min(50, Math.max(20, Math.round(prev + (Math.random() * 2 - 1)))));
      setNetworkUp((prev) => +(Math.max(2, prev + (Math.random() * 8 - 4))).toFixed(1));
      setNetworkDown((prev) => +(Math.max(5, prev + (Math.random() * 12 - 6))).toFixed(1));
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  if (!isWidgetsOpen) return null;

  return (
    <aside className="absolute right-4 top-10 w-72 z-20 select-none animate-in fade-in slide-in-from-right-4 duration-200">
      <div className="rounded-2xl bg-[#16122cd9] backdrop-blur-xl border border-white/15 shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="px-3.5 py-2.5 bg-white/[0.04] border-b border-white/10 flex items-center justify-between text-xs font-semibold text-slate-200">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>{language === "th" ? "วิดเจ็ตระบบ (System Widgets)" : "System Widgets"}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="cursor-pointer p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title={isCollapsed ? "ขยาย" : "ย่อ"}
            >
              {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={toggleWidgets}
              className="cursor-pointer p-1 rounded hover:bg-white/10 text-slate-400 hover:text-rose-400 transition-colors"
              title="ปิดวิดเจ็ต"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <div className="p-3.5 space-y-3.5 text-xs">
            {/* Widget 1: System Health (สุขภาพระบบ) */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="text-[11px] font-semibold text-slate-400 mb-2">
                {language === "th" ? "สุขภาพระบบ (System Health)" : "System Health"}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-emerald-400">
                    {language === "th" ? "สถานะปกติ (Good)" : "Healthy"}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    DCMS Station • DS-2026
                  </div>
                </div>
              </div>
            </div>

            {/* Widget 2: Resource Monitor (CPU, RAM, Network) */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                <span>{language === "th" ? "การใช้ทรัพยากร (Resource Monitor)" : "Resource Monitor"}</span>
                <span className="text-[10px] text-emerald-400 font-mono">PM2 Online</span>
              </div>

              {/* CPU Gauge */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Cpu className="w-3 h-3 text-cyan-400" /> CPU
                  </span>
                  <span className="font-mono text-cyan-400 font-semibold">{cpuUsage}%</span>
                </div>
                <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${cpuUsage}%` }}
                  />
                </div>
              </div>

              {/* RAM Gauge */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Activity className="w-3 h-3 text-indigo-400" /> หน่วยความจำ (RAM)
                  </span>
                  <span className="font-mono text-indigo-400 font-semibold">{ramUsage}%</span>
                </div>
                <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${ramUsage}%` }}
                  />
                </div>
              </div>

              {/* Network Throughput */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5 text-[10px]">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <ArrowUp className="w-3 h-3 text-emerald-400" />
                  <span>ส่งออก:</span>
                  <span className="font-mono text-white">{networkUp} KB/s</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <ArrowDown className="w-3 h-3 text-cyan-400" />
                  <span>ดาวน์โหลด:</span>
                  <span className="font-mono text-white">{networkDown} KB/s</span>
                </div>
              </div>
            </div>

            {/* Widget 3: Storage (พื้นที่จัดเก็บข้อมูล) */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1.5">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <HardDrive className="w-3 h-3 text-amber-400" /> Volume 1 (Btrfs / Ext4)
                </span>
                <span className="font-mono text-amber-400">3%</span>
              </div>
              <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden mb-1.5">
                <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 w-[3%] rounded-full" />
              </div>
              <div className="text-[10px] text-slate-400 flex justify-between">
                <span>ใช้งาน: 14.8 MB</span>
                <span>ทั้งหมด: 500 GB</span>
              </div>
            </div>

            {/* Widget 4: Connected Users */}
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[11px] text-slate-300">ผู้ใช้งานออนไลน์:</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {user ? user.name.split(" ")[0] : "Admin"} (1 เซสชัน)
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
