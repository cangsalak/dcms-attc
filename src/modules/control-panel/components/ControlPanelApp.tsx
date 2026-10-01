"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  SlidersHorizontal,
  Users,
  FolderOpen,
  Shield,
  Database,
  Calendar,
  Image as ImageIcon,
  Bell,
  HardDriveDownload,
  Server,
  LayoutGrid,
  Terminal,
  Monitor,
  FileText,
  Boxes,
  Search,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Cpu,
  Clock,
  Globe,
  Upload,
  RotateCcw,
  Sparkles,
  Save,
  Download,
  HardDriveUpload,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useWindowManager } from "@/core/context/WindowManagerContext";
import { useAuth } from "@/core/context/AuthContext";
import {
  ModuleContainer,
  ModuleToolbar,
  ModuleButton,
  ModuleFooter,
} from "@/core/components/ui/ModuleLayout";
import { formatCustomDateTime, formatFullThaiDate } from "@/core/lib/dateFormat";

interface ControlPanelAppProps {
  windowId: string;
}

type ActiveSection =
  | "overview"
  | "datetime"
  | "wallpaper"
  | "desktop_dock"
  | "database"
  | "backup"
  | "notifications"
  | "info";

export function ControlPanelApp({ windowId }: ControlPanelAppProps) {
  const { user } = useAuth();
  const {
    openApp,
    modules,
    language,
    setLanguage,
    dateFormatConfig,
    setDateFormatConfig,
    wallpaper,
    setWallpaper,
    isModuleOnDesktop,
    isModuleOnDock,
    toggleDesktopShortcut,
    toggleDockShortcut,
    showDesktopIcons,
    toggleShowDesktopIcons,
    resetShortcutsToDefault,
    customWallpapers,
    addCustomWallpaper,
    removeCustomWallpaper,
  } = useWindowManager();

  const [activeSection, setActiveSection] = useState<ActiveSection>("overview");
  const [search, setSearch] = useState("");
  const [now, setNow] = useState(new Date());

  // Wallpaper Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingWallpaper, setIsUploadingWallpaper] = useState(false);
  const [wallpaperUploadError, setWallpaperUploadError] = useState("");
  const [wallpaperUploadSuccess, setWallpaperUploadSuccess] = useState("");

  // Database Backup state
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  // Notification Rules state
  const [notifSound, setNotifSound] = useState(true);
  const [notifSecurityAlerts, setNotifSecurityAlerts] = useState(true);
  const [notifSystemAlerts, setNotifSystemAlerts] = useState(true);
  const [notifSuccessToast, setNotifSuccessToast] = useState(true);
  const [notifSavedMsg, setNotifSavedMsg] = useState("");

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const preview = formatCustomDateTime(now, language, dateFormatConfig);

  const handleWallpaperUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setWallpaperUploadError("กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WebP, GIF, SVG)");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setWallpaperUploadError("ขนาดไฟล์ต้องไม่เกิน 20 MB");
      return;
    }

    setIsUploadingWallpaper(true);
    setWallpaperUploadError("");
    setWallpaperUploadSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "อัปโหลดภาพพื้นหลังไม่สำเร็จ");
      }

      addCustomWallpaper(data.file.url, file.name);
      setWallpaper(data.file.url);
      setWallpaperUploadSuccess("อัปโหลดและเปลี่ยนภาพพื้นหลังเรียบร้อยแล้ว");
      setTimeout(() => setWallpaperUploadSuccess(""), 4000);
    } catch (err: any) {
      setWallpaperUploadError(err.message || "เกิดข้อผิดพลาดในการอัปโหลดภาพพื้นหลัง");
    } finally {
      setIsUploadingWallpaper(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleRestoreDatabase = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isConfirmed = window.confirm(
      `คำเตือน: คุณกำลังจะกู้คืนฐานข้อมูลจากไฟล์ "${file.name}"\nระบบจะสร้างไฟล์สำรอง (.bak) ให้อัตโนมัติก่อนเขียนทับข้อมูล\nต้องการดำเนินการต่อหรือไม่?`
    );
    if (!isConfirmed) {
      if (e.target) e.target.value = "";
      return;
    }

    setIsRestoring(true);
    setRestoreMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/database/backup", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการกู้คืนฐานข้อมูล");
      }

      setRestoreMessage({
        type: "success",
        text: `กู้คืนข้อมูลสำเร็จ: ${data.message} ${data.backupCreated ? `(สำรองข้อมูลเดิมไว้ที่: ${data.backupCreated})` : ""}`,
      });
    } catch (err: any) {
      setRestoreMessage({
        type: "error",
        text: err.message || "กู้คืนฐานข้อมูลไม่สำเร็จ",
      });
    } finally {
      setIsRestoring(false);
      if (e.target) e.target.value = "";
    }
  };

  // Synology DSM Standard Wallpapers
  const defaultWallpapers = [
    {
      id: "dcms-purple",
      name: "Synology Deep Space",
      bgClass: "from-[#120e24] via-[#1c1438] to-[#0a0614]",
    },
    {
      id: "synology-twilight",
      name: "DSM Twilight Dusk",
      bgClass: "from-[#1a1c29] via-[#141b2b] to-[#0b101b]",
    },
    {
      id: "nebula-glow",
      name: "Cyber Nebula Glow",
      bgClass: "from-[#0d1b2a] via-[#1b263b] to-[#415a77]",
    },
    {
      id: "nordic-aurora",
      name: "Nordic Emerald Aurora",
      bgClass: "from-[#061a14] via-[#0b2920] to-[#05110d]",
    },
  ];

  // Control Panel Item Categories definition
  const controlCategories = [
    {
      id: "file_sharing",
      title: "การแชร์ไฟล์และสิทธิ์ (File Sharing & Permissions)",
      items: [
        {
          id: "users_app",
          title: "ผู้ใช้ & กลุ่ม (User & Group)",
          desc: "จัดการบัญชีผู้ใช้, บทบาทสิทธิ์, การเข้าสู่ระบบ และแผนกงาน",
          icon: Users,
          color: "from-blue-600 to-indigo-600",
          action: () => openApp("users"),
          badge: "แอปหลัก",
        },
        {
          id: "files_app",
          title: "บริการไฟล์ & พื้นที่จัดเก็บ (File Station)",
          desc: "โฟลเดอร์ที่แชร์, สิทธิ์เข้าถึงรายโฟลเดอร์ และถังขยะรีไซเคิล",
          icon: FolderOpen,
          color: "from-amber-600 to-orange-600",
          action: () => openApp("files"),
          badge: "แอปหลัก",
        },
      ],
    },
    {
      id: "connectivity_security",
      title: "การเชื่อมต่อและความปลอดภัย (Connectivity & Security)",
      items: [
        {
          id: "audit_app",
          title: "ความปลอดภัย & บันทึกระบบ (Security & Audit)",
          desc: "บันทึกประวัติการใช้งาน (Audit Trail) และตรวจสอบความปลอดภัย",
          icon: Shield,
          color: "from-purple-600 to-indigo-600",
          action: () => openApp("audit-logs"),
          badge: "ความปลอดภัย",
        },
        {
          id: "db_status",
          title: "บริการฐานข้อมูล (Database Services)",
          desc: "Multi-Database: SQLite / MySQL / PostgreSQL",
          icon: Database,
          color: "from-emerald-600 to-teal-600",
          action: () => setActiveSection("database"),
        },
      ],
    },
    {
      id: "system",
      title: "ระบบ (System Settings)",
      items: [
        {
          id: "regional",
          title: "วันที่ & เวลา และภาษา (Regional Options)",
          desc: "ตั้งค่า พ.ศ. / ค.ศ., รูปแบบ 24h, วันที่ภาษาไทย, สลับภาษา",
          icon: Calendar,
          color: "from-cyan-600 to-blue-600",
          action: () => setActiveSection("datetime"),
        },
        {
          id: "wallpaper",
          title: "ภาพพื้นหลัง & หน้าจอ (Login & Wallpaper)",
          desc: "ปรับแต่งธีมเดสก์ท็อป อัปโหลดภาพพื้นหลัง Synology",
          icon: ImageIcon,
          color: "from-pink-600 to-rose-600",
          action: () => setActiveSection("wallpaper"),
        },
        {
          id: "notif_rules",
          title: "การตั้งค่าการแจ้งเตือน (Notification Rules)",
          desc: "กำหนดกฎการเตือน, เสียงแจ้งเตือน, การแจ้งเตือนความปลอดภัย",
          icon: Bell,
          color: "from-amber-500 to-red-500",
          action: () => setActiveSection("notifications"),
        },
        {
          id: "backup_restore",
          title: "สำรองและกู้คืนฐานข้อมูล (Backup & Restore)",
          desc: "สร้างจุดสำรองฐานข้อมูล .sql / .bak และกู้คืนข้อมูลเดิม",
          icon: HardDriveDownload,
          color: "from-blue-600 to-indigo-700",
          action: () => setActiveSection("backup"),
        },
        {
          id: "info_center",
          title: "ข้อมูลระบบ & PM2 (Info Center)",
          desc: "สถานะคลัสเตอร์ Node.js, PM2, ซีพียู, แรม, Uptime",
          icon: Server,
          color: "from-slate-600 to-zinc-700",
          action: () => setActiveSection("info"),
        },
        {
          id: "desktop_dock_mgr",
          title: "ทางลัดเดสก์ท็อป & ด็อค (Desktop & Dock)",
          desc: "เปิด/ปิด และจัดการไอคอนบนหน้าจอและแถบ Dock",
          icon: Monitor,
          color: "from-indigo-600 to-violet-600",
          action: () => setActiveSection("desktop_dock"),
        },
      ],
    },
    {
      id: "applications",
      title: "แอปพลิเคชัน & บริการ (Applications & Services)",
      items: [
        {
          id: "app_store",
          title: "ศูนย์รวมแพ็กเกจ (Package Center / App Store)",
          desc: "ติดตั้งโมดูลเสริม ค้นหาแอปพลิเคชันธุรกิจ และ External Web Apps",
          icon: LayoutGrid,
          color: "from-blue-600 to-cyan-600",
          action: () => openApp("app-store"),
          badge: "App Store",
        },
        {
          id: "terminal_app",
          title: "เทอร์มินัลและบรรทัดคำสั่ง (Terminal & CLI)",
          desc: "คอนโซลคำสั่งระบบ Synology DSM Shell สำหรับผู้ดูแล",
          icon: Terminal,
          color: "from-slate-700 to-zinc-800",
          action: () => openApp("terminal"),
          badge: "CLI",
        },
        {
          id: "billing_app",
          title: "การเงินและออกบิล (Billing & Invoices)",
          desc: "ออกใบเสนอราคา ใบเสร็จรับเงิน ใบกำกับภาษี VAT 7%",
          icon: FileText,
          color: "from-emerald-500 to-teal-600",
          action: () => openApp("billing"),
          badge: "ธุรกิจ",
        },
        {
          id: "inventory_app",
          title: "คลังสินค้าและสต็อก (Inventory & Stock)",
          desc: "ติดตามสินค้าคงคลัง ล็อตสินค้า และแจ้งเตือนสต็อก",
          icon: Boxes,
          color: "from-amber-500 to-orange-600",
          action: () => openApp("inventory"),
          badge: "ธุรกิจ",
        },
      ],
    },
  ];

  // Filter items by search query
  const filteredCategories = controlCategories
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.title.toLowerCase().includes(search.toLowerCase()) ||
          item.desc.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  return (
    <ModuleContainer>
      {/* Module Toolbar */}
      <ModuleToolbar
        leftActions={
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                <span>แผงควบคุม (Control Panel)</span>
                {activeSection !== "overview" && (
                  <>
                    <ChevronRight className="w-3 h-3 text-slate-500" />
                    <span className="text-cyan-400 capitalize">
                      {activeSection === "datetime"
                        ? "วันที่ & ภาษา"
                        : activeSection === "wallpaper"
                        ? "ภาพพื้นหลัง"
                        : activeSection === "desktop_dock"
                        ? "เดสก์ท็อป & ด็อค"
                        : activeSection === "database"
                        ? "บริการฐานข้อมูล"
                        : activeSection === "backup"
                        ? "สำรองและกู้คืน"
                        : activeSection === "notifications"
                        ? "การตั้งค่าการแจ้งเตือน"
                        : "ข้อมูลระบบ"}
                    </span>
                  </>
                )}
              </div>
              <div className="text-[10px] text-slate-400 hidden sm:block">
                Synology DSM Style Unified System Control Center
              </div>
            </div>
          </div>
        }
        selectedActions={
          activeSection !== "overview" ? (
            <ModuleButton
              onClick={() => setActiveSection("overview")}
              icon={ArrowLeft}
              variant="secondary"
            >
              กลับสู่แผงควบคุมหลัก
            </ModuleButton>
          ) : undefined
        }
        search={activeSection === "overview" ? search : undefined}
        onSearchChange={activeSection === "overview" ? setSearch : undefined}
        searchPlaceholder="ค้นหาการตั้งค่าในแผงควบคุม..."
      />

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#120e24]">
        {activeSection === "overview" ? (
          /* ================= OVERVIEW DASHBOARD ================= */
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Quick Status Hero */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-purple-900/30 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>แผงควบคุมระบบ DCMS</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ทำงานปกติ
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    ศูนย์กลางการบริหารจัดการสิทธิ์ ผู้ใช้ บริการไฟล์ ระบบ และการตั้งค่าความปลอดภัย
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openApp("profile")}
                  className="cursor-pointer px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span>โปรไฟล์ส่วนตัว & บัญชี</span>
                </button>
              </div>
            </div>

            {/* Categorized Settings Grid (Synology DSM Style) */}
            {filteredCategories.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 rounded-2xl bg-white/[0.02] border border-white/10">
                <Search className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
                <p>ไม่พบรายการที่ตรงกับ "{search}" ในแผงควบคุม</p>
              </div>
            ) : (
              filteredCategories.map((category) => (
                <div key={category.id} className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider px-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span>{category.title}</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {category.items.map((item) => {
                      const IconComp = item.icon;
                      return (
                        <div
                          key={item.id}
                          onClick={item.action}
                          className="cursor-pointer group p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-indigo-500/40 transition-all flex items-start gap-3.5 shadow-sm hover:shadow-lg hover:shadow-indigo-500/10"
                        >
                          <div
                            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shrink-0 shadow-md group-hover:scale-105 transition-transform`}
                          >
                            <IconComp className="w-5 h-5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors truncate">
                                {item.title}
                              </span>
                              {item.badge && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-slate-300 border border-white/10 shrink-0 font-medium">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : activeSection === "datetime" ? (
          /* ================= REGIONAL OPTIONS ================= */
          <div className="max-w-3xl mx-auto space-y-5 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>ตัวเลือกภูมิภาค วันที่ & เวลา (Regional Options)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    ระบบปฏิทิน
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDateFormatConfig({ calendar: "buddhist" })}
                      className={`cursor-pointer flex-1 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                        dateFormatConfig.calendar === "buddhist"
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30"
                          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      พุทธศักราช (พ.ศ.)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDateFormatConfig({ calendar: "gregorian" })}
                      className={`cursor-pointer flex-1 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                        dateFormatConfig.calendar === "gregorian"
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30"
                          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      คริสต์ศักราช (ค.ศ.)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    รูปแบบเวลา
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDateFormatConfig({ timeFormat: "24h" })}
                      className={`cursor-pointer flex-1 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                        dateFormatConfig.timeFormat === "24h"
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30"
                          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      24 ชั่วโมง (24h)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDateFormatConfig({ timeFormat: "12h" })}
                      className={`cursor-pointer flex-1 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                        dateFormatConfig.timeFormat === "12h"
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30"
                          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      12 ชั่วโมง (AM/PM)
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                <span className="text-xs text-slate-400">การแสดงผลปัจจุบัน:</span>
                <span className="text-xs font-bold text-cyan-400">
                  {preview.fullDateStr} • {preview.timeStr}
                </span>
              </div>
            </div>
          </div>
        ) : activeSection === "wallpaper" ? (
          /* ================= WALLPAPER MANAGEMENT ================= */
          <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-pink-400" />
                  <span>ภาพพื้นหลังเดสก์ท็อป (Desktop Wallpapers)</span>
                </h3>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingWallpaper}
                  className="cursor-pointer px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors flex items-center gap-1.5 shadow"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingWallpaper ? "กำลังอัปโหลด..." : "อัปโหลดภาพเอง"}</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleWallpaperUpload}
                  className="hidden"
                />
              </div>

              {wallpaperUploadSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                  {wallpaperUploadSuccess}
                </div>
              )}
              {wallpaperUploadError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                  {wallpaperUploadError}
                </div>
              )}

              {/* Grid of Default & Custom Wallpapers */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {defaultWallpapers.map((wp) => (
                  <div
                    key={wp.id}
                    onClick={() => setWallpaper(wp.id)}
                    className={`cursor-pointer group relative rounded-xl border p-2 text-center transition-all ${
                      wallpaper === wp.id
                        ? "border-cyan-400 bg-white/10 ring-2 ring-cyan-400/50"
                        : "border-white/10 bg-white/5 hover:border-white/25"
                    }`}
                  >
                    <div
                      className={`w-full h-20 rounded-lg bg-gradient-to-br ${wp.bgClass} mb-2 shadow`}
                    />
                    <span className="text-[11px] font-medium text-white truncate block">
                      {wp.name}
                    </span>
                  </div>
                ))}

                {customWallpapers.map((wp) => (
                  <div
                    key={wp.id}
                    onClick={() => setWallpaper(wp.url)}
                    className={`cursor-pointer group relative rounded-xl border p-2 text-center transition-all ${
                      wallpaper === wp.url
                        ? "border-cyan-400 bg-white/10 ring-2 ring-cyan-400/50"
                        : "border-white/10 bg-white/5 hover:border-white/25"
                    }`}
                  >
                    <div
                      className="w-full h-20 rounded-lg bg-cover bg-center mb-2 shadow"
                      style={{ backgroundImage: `url(${wp.url})` }}
                    />
                    <span className="text-[11px] font-medium text-white truncate block">
                      {wp.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeSection === "notifications" ? (
          /* ================= NOTIFICATION SETTINGS ================= */
          <div className="max-w-3xl mx-auto space-y-5 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                <Bell className="w-4 h-4 text-amber-400" />
                <span>กฎและการตั้งค่าการแจ้งเตือน (Notification Rules & Alerts)</span>
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-3">
                    {notifSound ? (
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-slate-500" />
                    )}
                    <div>
                      <div className="text-xs font-bold text-white">เสียงแจ้งเตือน (Sound Alert)</div>
                      <div className="text-[11px] text-slate-400">
                        ส่งเสียงเมื่อมีการแจ้งเตือนใหม่เข้ามาในระบบ
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifSound}
                    onChange={(e) => setNotifSound(e.target.checked)}
                    className="cursor-pointer w-4 h-4 rounded text-indigo-600"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <div>
                      <div className="text-xs font-bold text-white">
                        การแจ้งเตือนความปลอดภัย (Security Alerts)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        แจ้งเตือนทันทีเมื่อมีการเข้าสู่ระบบผิดพลาด หรือเปลี่ยนรหัสผ่าน
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifSecurityAlerts}
                    onChange={(e) => setNotifSecurityAlerts(e.target.checked)}
                    className="cursor-pointer w-4 h-4 rounded text-indigo-600"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-3">
                    <Server className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="text-xs font-bold text-white">
                        การแจ้งเตือนระบบ & PM2 (System Alerts)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        แจ้งเตือนเมื่อบริการไฟล์ การสำรองข้อมูล หรือ PM2 มีสถานะเปลี่ยนแปลง
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifSystemAlerts}
                    onChange={(e) => setNotifSystemAlerts(e.target.checked)}
                    className="cursor-pointer w-4 h-4 rounded text-indigo-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-emerald-400">{notifSavedMsg}</span>
                <button
                  type="button"
                  onClick={() => {
                    setNotifSavedMsg("บันทึกการตั้งค่าการแจ้งเตือนเรียบร้อยแล้ว");
                    setTimeout(() => setNotifSavedMsg(""), 3000);
                  }}
                  className="cursor-pointer px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow"
                >
                  บันทึกการตั้งค่า
                </button>
              </div>
            </div>
          </div>
        ) : activeSection === "backup" ? (
          /* ================= BACKUP & RESTORE ================= */
          <div className="max-w-3xl mx-auto space-y-5 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                <HardDriveDownload className="w-4 h-4 text-blue-400" />
                <span>สำรองและกู้คืนฐานข้อมูล (Database Backup & Restore)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-cyan-400" />
                    <span>ดาวน์โหลดไฟล์สำรองข้อมูล (Export)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    ดาวน์โหลดฐานข้อมูลฉบับสมบูรณ์ (.db / .sql) สำหรับเก็บเป็นจุดคืนค่า
                  </p>
                  <a
                    href="/api/database/backup?download=true"
                    download
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ดาวน์โหลดสำรองข้อมูล</span>
                  </a>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <HardDriveUpload className="w-4 h-4 text-amber-400" />
                    <span>กู้คืนฐานข้อมูล (Restore)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    อัปโหลดไฟล์สำรองข้อมูลเดิมเพื่อนำกลับมาใช้งานแทนที่ข้อมูลปัจจุบัน
                  </p>
                  <button
                    type="button"
                    onClick={() => restoreInputRef.current?.click()}
                    disabled={isRestoring}
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors"
                  >
                    <HardDriveUpload className="w-3.5 h-3.5" />
                    <span>{isRestoring ? "กำลังกู้คืน..." : "เลือกไฟล์กู้คืน"}</span>
                  </button>
                  <input
                    ref={restoreInputRef}
                    type="file"
                    accept=".db,.sqlite,.sqlite3,.sql"
                    onChange={handleRestoreDatabase}
                    className="hidden"
                  />
                </div>
              </div>

              {restoreMessage && (
                <div
                  className={`p-3 rounded-xl border text-xs ${
                    restoreMessage.type === "success"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                      : "bg-rose-500/10 border-rose-500/20 text-rose-300"
                  }`}
                >
                  {restoreMessage.text}
                </div>
              )}
            </div>
          </div>
        ) : activeSection === "database" ? (
          /* ================= DATABASE SERVICES ================= */
          <div className="max-w-3xl mx-auto space-y-5 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>สถานะและบริการฐานข้อมูล (Database Engine Status)</span>
              </h3>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">ฐานข้อมูลที่ใช้งานหลัก (Active Driver)</div>
                    <div className="text-[11px] text-slate-400">
                      Multi-Database Engine (SQLite / MySQL / PostgreSQL)
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    SQLite (better-sqlite3)
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">สถานะการเชื่อมต่อ (Connection)</div>
                    <div className="text-[11px] text-slate-400">
                      ตรวจสอบสิทธิ์การอ่าน/เขียนข้อมูลเรียบร้อย
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">
                    Online & Ready
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : activeSection === "desktop_dock" ? (
          /* ================= DESKTOP & DOCK SHORTCUTS ================= */
          <div className="max-w-3xl mx-auto space-y-5 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-indigo-400" />
                  <span>จัดการทางลัดหน้าจอเดสก์ท็อปและด็อค</span>
                </h3>
                <button
                  type="button"
                  onClick={resetShortcutsToDefault}
                  className="cursor-pointer px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-medium transition-colors"
                >
                  คืนค่าเริ่มต้น
                </button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {modules.map((mod) => (
                  <div
                    key={mod.id}
                    className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white">
                        {language === "th" && mod.nameTh ? mod.nameTh : mod.name}
                      </div>
                      <div className="text-[11px] text-slate-400">{mod.description}</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isModuleOnDesktop(mod)}
                          onChange={() => toggleDesktopShortcut(mod.id)}
                          className="cursor-pointer rounded"
                        />
                        <span>หน้าจอเดสก์ท็อป</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isModuleOnDock(mod)}
                          onChange={() => toggleDockShortcut(mod.id)}
                          className="cursor-pointer rounded"
                        />
                        <span>แถบด็อค (Dock)</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ================= INFO CENTER ================= */
          <div className="max-w-3xl mx-auto space-y-5 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                <Server className="w-4 h-4 text-cyan-400" />
                <span>ข้อมูลระบบและสถานะเซิร์ฟเวอร์ (Info Center)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                  <div className="text-slate-400 text-[11px]">ระบบปฏิบัติการ</div>
                  <div className="font-bold text-white mt-0.5">DCMS Core OS v1.0.0</div>
                  <div className="text-[10px] text-cyan-400 mt-0.5">Synology DSM Style Desktop</div>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                  <div className="text-slate-400 text-[11px]">กระบวนการทำงานหลัก (Production PM2)</div>
                  <div className="font-bold text-white mt-0.5">Node.js + PM2 Cluster (id: 0)</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">Online • Zero Docker Overhead</div>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                  <div className="text-slate-400 text-[11px]">โมดูลที่ติดตั้งทั้งหมด</div>
                  <div className="font-bold text-white mt-0.5">{modules.length} โมดูลพร้อมใช้งาน</div>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                  <div className="text-slate-400 text-[11px]">ผู้ดูแลระบบที่กำลังใช้งาน</div>
                  <div className="font-bold text-white mt-0.5">{user?.name || "Super Admin"}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{user?.email || "admin@dcms.local"}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Module Footer */}
      <ModuleFooter
        leftContent={
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>DCMS Core OS 1.0.0 • Synology DSM Style Architecture</span>
          </span>
        }
        rightStatus={
          activeSection === "overview"
            ? `${controlCategories.length} หมวดหมู่การตั้งค่า`
            : "โหมดการตั้งค่าระบบขั้นสูง"
        }
      />
    </ModuleContainer>
  );
}
