"use client";

import React, { useState } from "react";
import {
  Download,
  Trash2,
  CheckCircle,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Layers,
  ShoppingBag,
  Check,
  RefreshCw,
  Box,
} from "lucide-react";
import { useWindowManager } from "@/core/context/WindowManagerContext";
import { DynamicIcon } from "@/core/components/IconResolver";
import {
  ModuleContainer,
  ModuleToolbar,
  ModuleButton,
  ModuleContextMenu,
  ModuleFooter,
} from "@/core/components/ui/ModuleLayout";
import { allAvailableModulesMap } from "@/core/registry/module-registry";

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
    description: "ติดตามสินค้าคงคลัง ล็อตสินค้า การรับเข้า-เบิกออก และแจ้งเตือนสต็อกใกล้หมดแบบเรียลไทม์",
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
    description: "ออกใบเสนอราคา ใบเสร็จรับเงิน ใบกำกับภาษี VAT 7% พร้อม QR Code ชำระเงิน",
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
    description: "เก็บบันทึกประวัติการเข้าใช้งาน (Audit Trail) พร้อมส่งออก CSV/JSON ตามมาตรฐาน ISO/IEC 27001",
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
    description: "คอนโซลคอมมานด์ไลน์และเชลล์อินเตอร์แอคทีฟสำหรับตรวจสอบสถานะ Node.js, PM2 และฐานข้อมูล",
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
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Context Menu
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    app: MarketplaceApp;
  } | null>(null);

  const installedIds = modules.map((m) => m.id);

  const handleInstall = (app: MarketplaceApp) => {
    setInstallingId(app.id);

    // Retrieve the real functional module from the registry
    const realModule = allAvailableModulesMap[app.id];

    setTimeout(() => {
      if (realModule) {
        installDynamicModule(realModule);
      } else {
        // Fallback dynamic registration
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
            <div className="p-8 text-center text-white">
              โมดูล {app.name} พร้อมทำงาน
            </div>
          ),
        });
      }
      setInstallingId(null);
    }, 400);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const filteredMarketplace = availableMarketplaceApps.filter((app) => {
    const matchesCategory =
      categoryFilter === "all" || app.category === categoryFilter;
    const matchesSearch =
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.nameTh.toLowerCase().includes(search.toLowerCase()) ||
      app.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <ModuleContainer>
      {/* Module Toolbar */}
      <ModuleToolbar
        leftActions={
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab("available")}
              className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "available"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              แอปที่พร้อมติดตั้ง ({availableMarketplaceApps.length})
            </button>
            <button
              onClick={() => setActiveTab("installed")}
              className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "installed"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              ติดตั้งแล้วในระบบ ({modules.length})
            </button>
          </div>
        }
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="ค้นหาชื่อ หรือคำอธิบายโมดูล..."
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Category Strip (When in available tab) */}
      {activeTab === "available" && (
        <div className="px-4 py-2 bg-black/20 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            {[
              { key: "all", label: "ทั้งหมด" },
              { key: "business", label: "หมวดธุรกิจ (Business)" },
              { key: "tools", label: "เครื่องมือระบบ (Tools)" },
            ].map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategoryFilter(cat.key)}
                className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  categoryFilter === cat.key
                    ? "bg-white/15 text-white border border-white/20 font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="text-[11px] text-slate-400 hidden sm:block">
            พร้อมใช้งานจริงและบันทึกลงฐานข้อมูลอัตโนมัติ
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-4 select-text">
        {activeTab === "available" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMarketplace.map((app) => {
              const isInstalled = installedIds.includes(app.id);
              const isProcessing = installingId === app.id;

              return (
                <div
                  key={app.id}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({
                      x: e.clientX,
                      y: e.clientY,
                      app,
                    });
                  }}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-purple-500/40 hover:bg-white/[0.05] transition-all flex flex-col justify-between group shadow-lg shadow-black/20"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${app.colorGradient} flex items-center justify-center shrink-0 shadow-lg shadow-black/40 group-hover:scale-105 transition-transform`}
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
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>ผู้พัฒนา: {app.author}</span>
                      <span>•</span>
                      <span>{app.size}</span>
                    </div>

                    {isInstalled ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> ติดตั้งแล้ว
                        </span>
                        <ModuleButton
                          onClick={() => openApp(app.id)}
                          variant="secondary"
                        >
                          เปิดแอป
                        </ModuleButton>
                      </div>
                    ) : (
                      <ModuleButton
                        onClick={() => handleInstall(app)}
                        disabled={isProcessing}
                        variant="primary"
                        icon={isProcessing ? RefreshCw : Download}
                        className="bg-purple-600 hover:bg-purple-500 shadow-purple-600/30"
                      >
                        {isProcessing ? "กำลังติดตั้ง..." : "ติดตั้ง (Install)"}
                      </ModuleButton>
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
                className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${mod.colorGradient} flex items-center justify-center shrink-0 shadow-md`}
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
                      {mod.isSystemApp ? (
                        <span className="text-[10px] text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 font-medium">
                          System Core App
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
                          Extension Module
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{mod.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <ModuleButton
                    onClick={() => openApp(mod.id)}
                    variant="secondary"
                  >
                    เปิดแอป
                  </ModuleButton>
                  {!mod.isSystemApp && (
                    <ModuleButton
                      onClick={() => uninstallModule(mod.id)}
                      variant="danger"
                      icon={Trash2}
                      title="ถอนการติดตั้ง"
                    >
                      ถอนการติดตั้ง
                    </ModuleButton>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <ModuleFooter
        leftContent={`คลังแอป DCMS Extension Repository • ทั้งหมด ${availableMarketplaceApps.length} โมดูล`}
        rightStatus="App Store Server Online"
      />

      {/* Context Menu (Right Click) */}
      {contextMenu && (
        <ModuleContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={[
            installedIds.includes(contextMenu.app.id)
              ? {
                  label: `เปิดแอป (${contextMenu.app.name})`,
                  icon: ExternalLink,
                  onClick: () => openApp(contextMenu.app.id),
                }
              : {
                  label: `ติดตั้งโมดูล (${contextMenu.app.name})`,
                  icon: Download,
                  onClick: () => handleInstall(contextMenu.app),
                },
            { divider: true },
            installedIds.includes(contextMenu.app.id)
              ? {
                  label: "ถอนการติดตั้งโมดูลนี้",
                  icon: Trash2,
                  danger: true,
                  onClick: () => uninstallModule(contextMenu.app.id),
                }
              : {
                  label: "ยกเลิก",
                  onClick: () => {},
                },
          ]}
        />
      )}
    </ModuleContainer>
  );
}
