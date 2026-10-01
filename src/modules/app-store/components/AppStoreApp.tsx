"use client";

import React, { useState, useEffect } from "react";
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
  Plus,
  Globe,
  Code2,
  Sliders,
} from "lucide-react";
import { useWindowManager } from "@/core/context/WindowManagerContext";
import { DynamicIcon } from "@/core/components/IconResolver";
import {
  ModuleContainer,
  ModuleToolbar,
  ModuleButton,
  ModuleContextMenu,
  ModuleFooter,
  ModuleModal,
} from "@/core/components/ui/ModuleLayout";
import {
  getModuleById,
  createExternalAppModule,
} from "@/core/registry/module-registry";

export interface MarketplaceApp {
  id: string;
  name: string;
  nameTh?: string;
  description: string;
  version: string;
  category: "business" | "tools" | "custom" | string;
  iconName: string;
  colorGradient: string;
  author: string;
  size: string;
  entryType?: "internal" | "external_url";
  url?: string;
  rating?: number;
}

const fallbackDefaultApps: MarketplaceApp[] = [
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
    entryType: "internal",
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
    entryType: "internal",
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
    entryType: "internal",
    rating: 4.7,
  },
];

const availableIcons = [
  "store",
  "packages",
  "document",
  "security",
  "terminal",
  "analytics",
  "database",
  "folder",
  "settings",
  "help",
];

const availableGradients = [
  { label: "Indigo & Blue", val: "from-indigo-600 to-blue-600" },
  { label: "Purple & Pink", val: "from-purple-600 to-pink-600" },
  { label: "Emerald & Teal", val: "from-emerald-500 to-teal-600" },
  { label: "Amber & Orange", val: "from-amber-500 to-orange-600" },
  { label: "Rose & Red", val: "from-rose-500 to-red-600" },
  { label: "Dark Zinc", val: "from-slate-700 to-zinc-900" },
];

export function AppStoreApp({ windowId }: { windowId: string }) {
  const { modules, installDynamicModule, uninstallModule, openApp } =
    useWindowManager();
  const [marketplaceApps, setMarketplaceApps] =
    useState<MarketplaceApp[]>(fallbackDefaultApps);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"available" | "installed">(
    "available"
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Add 3rd-Party App Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customAppForm, setCustomAppForm] = useState({
    name: "",
    nameTh: "",
    url: "",
    category: "custom",
    iconName: "store",
    colorGradient: "from-indigo-600 to-blue-600",
    author: "Third-party Developer",
    description: "",
  });

  // Context Menu
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    app: MarketplaceApp;
  } | null>(null);

  const installedIds = modules.map((m) => m.id);

  // Fetch marketplace apps from database / API
  const fetchMarketplace = async () => {
    try {
      const res = await fetch("/api/marketplace");
      if (res.ok) {
        const data = await res.json();
        if (data.apps && data.apps.length > 0) {
          setMarketplaceApps(data.apps);
        }
      }
    } catch (err) {
      console.error("Failed to load marketplace apps:", err);
    }
  };

  useEffect(() => {
    fetchMarketplace();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchMarketplace();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const handleInstall = (app: MarketplaceApp) => {
    setInstallingId(app.id);

    setTimeout(() => {
      if (app.entryType === "external_url" && app.url) {
        // Construct dynamic 3rd-party micro-frontend module
        const extModule = createExternalAppModule({
          id: app.id,
          name: app.name,
          nameTh: app.nameTh,
          description: app.description,
          version: app.version,
          category: (app.category as any) || "custom",
          iconName: app.iconName,
          colorGradient: app.colorGradient,
          url: app.url,
          author: app.author,
        });
        installDynamicModule(extModule);
      } else {
        // Retrieve internal extension module
        const internalMod = getModuleById(modules, app.id);
        if (internalMod) {
          installDynamicModule(internalMod);
        } else {
          // Fallback module definition
          installDynamicModule({
            id: app.id,
            name: app.name,
            nameTh: app.nameTh,
            description: app.description,
            version: app.version,
            category: (app.category as any) || "custom",
            iconName: app.iconName,
            colorGradient: app.colorGradient,
            defaultSize: { width: 850, height: 550 },
            minSize: { width: 500, height: 400 },
            enabled: true,
            isSystemApp: false,
            desktopShortcut: true,
            dockShortcut: true,
            component: () => (
              <div className="p-8 text-center text-white">
                แอปพลิเคชัน {app.name} พร้อมใช้งาน
              </div>
            ),
          });
        }
      }
      setInstallingId(null);
    }, 400);
  };

  const handleAddCustomApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAppForm.name.trim() || !customAppForm.url.trim()) return;

    try {
      const res = await fetch("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customAppForm.name,
          nameTh: customAppForm.nameTh || customAppForm.name,
          url: customAppForm.url,
          category: customAppForm.category,
          iconName: customAppForm.iconName,
          colorGradient: customAppForm.colorGradient,
          author: customAppForm.author || "Community Developer",
          description: customAppForm.description || "3rd-Party External Web Application",
          entryType: "external_url",
          size: "Web App",
        }),
      });

      if (res.ok) {
        setIsAddModalOpen(false);
        setCustomAppForm({
          name: "",
          nameTh: "",
          url: "",
          category: "custom",
          iconName: "store",
          colorGradient: "from-indigo-600 to-blue-600",
          author: "Third-party Developer",
          description: "",
        });
        await fetchMarketplace();
      }
    } catch (err) {
      console.error("Failed to add custom app:", err);
    }
  };

  const handleDeleteFromMarketplace = async (id: string) => {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบแอปภายนอกนี้ออกจาก App Store?")) {
      try {
        await fetch(`/api/marketplace?id=${id}`, { method: "DELETE" });
        await fetchMarketplace();
      } catch (err) {
        console.error("Failed to delete app:", err);
      }
    }
  };

  const CORE_MODULE_IDS = new Set(["files", "users", "terminal", "settings", "app-store"]);

  const filteredMarketplace = marketplaceApps
    .filter((app) => !CORE_MODULE_IDS.has(app.id))
    .filter((app) => {
      const matchesCategory =
        categoryFilter === "all" ||
        (categoryFilter === "external" && app.entryType === "external_url") ||
        app.category === categoryFilter;
      const matchesSearch =
        app.name.toLowerCase().includes(search.toLowerCase()) ||
        (app.nameTh && app.nameTh.toLowerCase().includes(search.toLowerCase())) ||
        app.description.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });

  return (
    <ModuleContainer>
      {/* Module Toolbar */}
      <ModuleToolbar
        leftActions={
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveTab("available")}
              className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "available"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              แอปที่พร้อมติดตั้ง ({marketplaceApps.length})
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

            <div className="h-4 w-px bg-white/10 mx-1 hidden sm:block" />

            <ModuleButton
              onClick={() => setIsAddModalOpen(true)}
              variant="primary"
              icon={Plus}
              className="bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
            >
              เพิ่มแอปภายนอก (Add 3rd-Party App)
            </ModuleButton>
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
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { key: "all", label: "ทั้งหมด" },
              { key: "business", label: "หมวดธุรกิจ (Business)" },
              { key: "tools", label: "เครื่องมือระบบ (Tools)" },
              {
                key: "external",
                label: `แอปภายนอก / Web App (${
                  marketplaceApps.filter((a) => a.entryType === "external_url")
                    .length
                })`,
              },
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

          <div className="text-[11px] text-slate-400 hidden md:block">
            สถาปัตยกรรม Plug & Play: รองรับทั้งโมดูลภายในและ Micro-frontend จากภายนอก
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
              const isExternal = app.entryType === "external_url";
              const isBuiltin = [
                "inventory",
                "billing",
                "audit-logs",
                "terminal",
              ].includes(app.id);

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
                        <h3 className="font-semibold text-white text-sm truncate flex items-center gap-1.5">
                          <span>{app.name}</span>
                          {isExternal && (
                            <span className="text-[9px] text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                              <Globe className="w-2.5 h-2.5" /> Web App
                            </span>
                          )}
                        </h3>
                        <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                          v{app.version}
                        </span>
                      </div>
                      {app.nameTh && (
                        <p className="text-xs text-indigo-300 font-medium mt-0.5">
                          {app.nameTh}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {app.description}
                      </p>
                      {isExternal && app.url && (
                        <p className="text-[10px] text-cyan-400 font-mono mt-1 truncate">
                          URL: {app.url}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-3 border-t border-white/5">
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>ผู้พัฒนา: {app.author}</span>
                      <span>•</span>
                      <span>{app.size}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isBuiltin && (
                        <button
                          onClick={() => handleDeleteFromMarketplace(app.id)}
                          className="cursor-pointer p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="ลบแอปนี้ออกจาก App Store"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

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
                      ) : mod.entryType === "external_url" ? (
                        <span className="text-[10px] text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-medium flex items-center gap-1">
                          <Globe className="w-2.5 h-2.5" /> 3rd-Party Web App
                        </span>
                      ) : (
                        <span className="text-[10px] text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 font-medium">
                          Internal Extension
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{mod.description}</p>
                    {mod.url && (
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        URL: {mod.url}
                      </p>
                    )}
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
        leftContent={`คลังแอป DCMS Extension Registry • ทั้งหมด ${marketplaceApps.length} โมดูล`}
        rightStatus="Marketplace Feed Online"
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
                  label: "ปิดเมนู",
                  onClick: () => {},
                },
          ]}
        />
      )}

      {/* Add Custom 3rd-Party App Modal */}
      <ModuleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="เพิ่มแอปภายนอก (Add 3rd-Party / Micro-Frontend App)"
        icon={Plus}
        subtitle="รองรับทั้ง Web Application, Micro-frontend และบริการจากภายนอกที่ผู้อื่นเขียนขึ้นมา"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleAddCustomApp} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-300">
                ชื่อแอปพลิเคชัน (English Name) *
              </label>
              <input
                type="text"
                required
                placeholder="เช่น Grafana Monitoring"
                value={customAppForm.name}
                onChange={(e) =>
                  setCustomAppForm({ ...customAppForm, name: e.target.value })
                }
                className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-300">
                ชื่อภาษาไทย (ถ้ามี)
              </label>
              <input
                type="text"
                placeholder="เช่น ระบบติดตามสถานะเครื่อง"
                value={customAppForm.nameTh}
                onChange={(e) =>
                  setCustomAppForm({ ...customAppForm, nameTh: e.target.value })
                }
                className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-300">
              Web App URL (ที่อยู่เซิร์ฟเวอร์หรือหน้าเว็บของแอป) *
            </label>
            <input
              type="text"
              required
              placeholder="https://... หรือ http://localhost:8080"
              value={customAppForm.url}
              onChange={(e) =>
                setCustomAppForm({ ...customAppForm, url: e.target.value })
              }
              className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg bg-black/40 border border-white/10 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              ผู้อื่นสามารถเขียน App ด้วย Vue, React, Next.js, Python, Go หรือ PHP และนำ URL มากรอกได้ทันที
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-300">
                ไอคอน
              </label>
              <select
                value={customAppForm.iconName}
                onChange={(e) =>
                  setCustomAppForm({
                    ...customAppForm,
                    iconName: e.target.value,
                  })
                }
                className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg bg-black/40 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
              >
                {availableIcons.map((ic) => (
                  <option key={ic} value={ic} className="bg-slate-900 text-white">
                    {ic}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-300">
                ธีมสีการ์ด
              </label>
              <select
                value={customAppForm.colorGradient}
                onChange={(e) =>
                  setCustomAppForm({
                    ...customAppForm,
                    colorGradient: e.target.value,
                  })
                }
                className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg bg-black/40 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
              >
                {availableGradients.map((g) => (
                  <option
                    key={g.val}
                    value={g.val}
                    className="bg-slate-900 text-white"
                  >
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-300">
                หมวดหมู่
              </label>
              <select
                value={customAppForm.category}
                onChange={(e) =>
                  setCustomAppForm({
                    ...customAppForm,
                    category: e.target.value,
                  })
                }
                className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg bg-black/40 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="custom" className="bg-slate-900 text-white">
                  แอปภายนอก (Custom / External)
                </option>
                <option value="business" className="bg-slate-900 text-white">
                  หมวดธุรกิจ (Business)
                </option>
                <option value="tools" className="bg-slate-900 text-white">
                  เครื่องมือระบบ (Tools)
                </option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-300">
                ชื่อผู้พัฒนา (Author)
              </label>
              <input
                type="text"
                placeholder="เช่น ทีมพัฒนาภายนอก / DevOps"
                value={customAppForm.author}
                onChange={(e) =>
                  setCustomAppForm({
                    ...customAppForm,
                    author: e.target.value,
                  })
                }
                className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-300">
              คำอธิบายแอปพลิเคชัน
            </label>
            <textarea
              rows={2}
              placeholder="อธิบายฟีเจอร์หรือการทำงานของแอปพลิเคชันโดยย่อ..."
              value={customAppForm.description}
              onChange={(e) =>
                setCustomAppForm({
                  ...customAppForm,
                  description: e.target.value,
                })
              }
              className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <ModuleButton
              onClick={() => setIsAddModalOpen(false)}
              variant="secondary"
            >
              ยกเลิก
            </ModuleButton>
            <ModuleButton
              variant="primary"
              icon={Plus}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              บันทึกเข้า App Store
            </ModuleButton>
          </div>
        </form>
      </ModuleModal>
    </ModuleContainer>
  );
}
