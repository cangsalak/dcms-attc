"use client";

import React, { useState } from "react";
import {
  Boxes,
  Download,
  Trash2,
  CheckCircle,
  Sparkles,
  Search,
  ExternalLink,
  ShieldCheck,
  Cpu,
} from "lucide-react";
import { useWindowManager } from "@/core/context/WindowManagerContext";
import { DynamicIcon } from "@/core/components/IconResolver";

export interface MarketplaceApp {
  id: string;
  name: string;
  nameTh: string;
  description: string;
  version: string;
  category: "business" | "tools" | "custom";
  iconName: string;
  colorGradient: string;
  author: string;
  size: string;
  rating: number;
}

export const availableMarketplaceApps: MarketplaceApp[] = [
  {
    id: "inventory",
    name: "Inventory & Stock",
    nameTh: "ระบบจัดการสต็อกและคลังสินค้า",
    description: "ติดตามสินค้าคงคลัง ล็อตสินค้า การรับเข้า-เบิกออก และแจ้งเตือนสต็อกใกล้หมด",
    version: "1.2.0",
    category: "business",
    iconName: "packages",
    colorGradient: "from-amber-500 to-orange-600",
    author: "CoreOS Labs",
    size: "4.2 MB",
    rating: 4.9,
  },
  {
    id: "billing",
    name: "Billing & Invoices",
    nameTh: "ระบบใบเสร็จและใบแจ้งหนี้",
    description: "ออกใบเสนอราคา ใบเสร็จรับเงิน ใบกำกับภาษี และติดตามยอดค้างชำระ",
    version: "2.0.1",
    category: "business",
    iconName: "document",
    colorGradient: "from-emerald-500 to-teal-600",
    author: "FinTech Team",
    size: "5.8 MB",
    rating: 4.8,
  },
  {
    id: "audit-logs",
    name: "Audit & Security Logs",
    nameTh: "ประวัติกิจกรรมและความปลอดภัย",
    description: "เก็บบันทึกประวัติการเข้าใช้งาน (Audit Trail) ตามมาตรฐานความปลอดภัย",
    version: "1.0.5",
    category: "tools",
    iconName: "security",
    colorGradient: "from-rose-500 to-red-600",
    author: "Security Team",
    size: "2.1 MB",
    rating: 4.7,
  },
  {
    id: "terminal",
    name: "System Terminal",
    nameTh: "เทอร์มินัลจัดการระบบ",
    description: "คอมมานด์ไลน์และเชลล์สำหรับตรวจสอบสถานะ Docker, Container และทรัพยากร",
    version: "0.9.4",
    category: "tools",
    iconName: "terminal",
    colorGradient: "from-slate-700 to-zinc-900",
    author: "SysOps",
    size: "1.5 MB",
    rating: 5.0,
  },
];

export function AppStoreApp({ windowId }: { windowId: string }) {
  const { modules, installDynamicModule, uninstallModule, openApp } =
    useWindowManager();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"available" | "installed">(
    "available"
  );
  const [installingId, setInstallingId] = useState<string | null>(null);

  const installedIds = modules.map((m) => m.id);

  const handleInstall = (app: MarketplaceApp) => {
    setInstallingId(app.id);
    setTimeout(() => {
      installDynamicModule({
        id: app.id,
        name: app.name,
        nameTh: app.nameTh,
        description: app.description,
        version: app.version,
        category: app.category,
        iconName: app.iconName,
        colorGradient: app.colorGradient,
        defaultSize: { width: 850, height: 550 },
        minSize: { width: 500, height: 400 },
        enabled: true,
        isSystemApp: false,
        desktopShortcut: true,
        dockShortcut: true,
        component: ({ windowId }: { windowId: string }) => (
          <div className="p-8 h-full bg-[#130f24] text-white flex flex-col items-center justify-center text-center select-text">
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${app.colorGradient} flex items-center justify-center shadow-xl shadow-black/40 mb-4`}
            >
              <DynamicIcon name={app.iconName} className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold">{app.name}</h2>
            <p className="text-sm text-indigo-300 mt-1">{app.nameTh}</p>
            <p className="text-xs text-slate-400 max-w-md mt-3">{app.description}</p>
            <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-left text-slate-300 max-w-md w-full">
              <div className="font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> โมดูลนี้ถูกโหลดและติดตั้งสำเร็จ!
              </div>
              <p className="text-slate-400 mt-1 leading-relaxed">
                โครงสร้างของแอปนี้ถูกแยกเป็นอิสระ (Decoupled Module)
                ในสภาพแวดล้อมจริงคุณสามารถสร้างโฟลเดอร์ใน <code className="text-amber-300 bg-black/40 px-1 py-0.5 rounded">src/modules/{app.id}/</code>{" "}
                แล้วผูก component ฐานข้อมูล และ API routes เข้ามาได้ทันที
              </p>
            </div>
          </div>
        ),
      });
      setInstallingId(null);
    }, 600);
  };

  const filteredMarketplace = availableMarketplaceApps.filter(
    (app) =>
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.nameTh.toLowerCase().includes(search.toLowerCase()) ||
      app.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#120e24] text-slate-100 select-text font-sans">
      {/* Top Banner */}
      <div className="px-6 py-5 border-b border-white/10 bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-blue-900/30 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Extension & App Center
          </div>
          <h1 className="text-xl font-bold text-white">ศูนย์ติดตั้งและจัดการโมดูล (App Store)</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            ดาวน์โหลดและติดตั้งโมดูลเพิ่มเติม หรือลบโมดูลที่ไม่ใช้งานโดยไม่กระทบต่อ Core
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex p-1 rounded-xl bg-white/5 border border-white/10">
          <button
            onClick={() => setActiveTab("available")}
            className={`cursor-pointer px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "available"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            แอปที่พร้อมติดตั้ง ({availableMarketplaceApps.length})
          </button>
          <button
            onClick={() => setActiveTab("installed")}
            className={`cursor-pointer px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "installed"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ติดตั้งแล้วในเครื่อง ({modules.length})
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-6 py-3 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาชื่อโมดูล หรือคำอธิบาย..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="text-xs text-slate-400">
          สถาปัตยกรรม Plug & Play (Hot Reloadable Extensions)
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === "available" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMarketplace.map((app) => {
              const isInstalled = installedIds.includes(app.id);
              const isProcessing = installingId === app.id;

              return (
                <div
                  key={app.id}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-indigo-500/40 hover:bg-white/[0.05] transition-all flex flex-col justify-between group"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${app.colorGradient} flex items-center justify-center shrink-0 shadow-lg shadow-black/30 group-hover:scale-105 transition-transform`}
                    >
                      <DynamicIcon name={app.iconName} className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-white text-sm truncate">
                          {app.name}
                        </h3>
                        <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                          v{app.version}
                        </span>
                      </div>
                      <p className="text-xs text-indigo-300 font-medium mt-0.5">
                        {app.nameTh}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {app.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-3 border-t border-white/5">
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span>ผู้พัฒนา: {app.author}</span>
                      <span>•</span>
                      <span>ขนาด: {app.size}</span>
                    </div>

                    {isInstalled ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> ติดตั้งแล้ว
                        </span>
                        <button
                          onClick={() => openApp(app.id)}
                          className="cursor-pointer px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
                        >
                          เปิดแอป
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleInstall(app)}
                        disabled={isProcessing}
                        className="cursor-pointer px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {isProcessing ? "กำลังติดตั้ง..." : "ติดตั้ง (Install)"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {modules.map((mod) => (
              <div
                key={mod.id}
                className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${mod.colorGradient} flex items-center justify-center shrink-0 shadow-md`}
                  >
                    <DynamicIcon name={mod.iconName} className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm">
                        {mod.name}
                      </span>
                      {mod.nameTh && (
                        <span className="text-xs text-indigo-300">({mod.nameTh})</span>
                      )}
                      <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                        v{mod.version}
                      </span>
                      {mod.isSystemApp && (
                        <span className="text-[10px] text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 font-medium">
                          System App
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{mod.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openApp(mod.id)}
                    className="cursor-pointer px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
                  >
                    เปิดแอป
                  </button>
                  {!mod.isSystemApp && (
                    <button
                      onClick={() => uninstallModule(mod.id)}
                      className="cursor-pointer p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                      title="ถอนการติดตั้ง"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
