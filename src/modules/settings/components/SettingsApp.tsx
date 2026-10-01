"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Monitor,
  RotateCcw,
  Upload,
  Plus,
  Trash2,
  FolderOpen,
  Link as LinkIcon,
  Loader2,
  User,
  Key,
  ShieldCheck,
  Database,
  Download,
  HardDriveDownload,
  HardDriveUpload,
  AlertTriangle,
  CheckCircle2,
  Save,
  FileText,
} from "lucide-react";
import { useWindowManager } from "@/core/context/WindowManagerContext";
import { useAuth } from "@/core/context/AuthContext";
import { formatCustomDateTime } from "@/core/lib/dateFormat";
import { DynamicIcon } from "@/core/components/IconResolver";

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
  const { user, updateUser } = useAuth();
  const {
    wallpaper,
    setWallpaper,
    modules,
    language,
    setLanguage,
    dateFormatConfig,
    setDateFormatConfig,
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

  const [activeTab, setActiveTab] = useState<
    "profile" | "appearance" | "datetime" | "system" | "desktop_dock" | "about"
  >("datetime");

  // Profile management state
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileDepartment, setProfileDepartment] = useState(user?.department || "");
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Sync profile when user changes
  useEffect(() => {
    if (user) {
      setProfileName(user.name || "");
      setProfileDepartment(user.department || "");
      setProfileAvatar(user.avatar || "");
    }
  }, [user]);

  // Support switching tab from global event (e.g. from TopMenuBar)
  useEffect(() => {
    const handleSwitchTab = (e: any) => {
      if (
        e.detail &&
        ["profile", "appearance", "datetime", "system", "desktop_dock", "about"].includes(
          e.detail
        )
      ) {
        setActiveTab(e.detail);
      }
    };
    window.addEventListener("dcms-open-settings-tab", handleSwitchTab);
    return () => window.removeEventListener("dcms-open-settings-tab", handleSwitchTab);
  }, []);

  // Database Backup & Restore state
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const [now, setNow] = useState(new Date());

  // Wallpaper Upload & Custom Wallpaper states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingWallpaper, setIsUploadingWallpaper] = useState(false);
  const [wallpaperUploadError, setWallpaperUploadError] = useState("");
  const [wallpaperUploadSuccess, setWallpaperUploadSuccess] = useState("");
  const [fileStationImages, setFileStationImages] = useState<
    Array<{ id: string; url: string; originalName: string }>
  >([]);
  const [isLoadingFileStationImages, setIsLoadingFileStationImages] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isImportingUrl, setIsImportingUrl] = useState(false);

  const fetchFileStationImages = async () => {
    setIsLoadingFileStationImages(true);
    try {
      const res = await fetch("/api/upload?folderId=all");
      if (res.ok) {
        const data = await res.json();
        const images = (data.files || []).filter(
          (f: any) =>
            f.mimeType?.startsWith("image/") ||
            /\.(png|jpe?g|webp|gif|svg)$/i.test(f.filename || f.originalName)
        );
        setFileStationImages(images);
      }
    } catch (err) {
      console.error("Failed to load file station images:", err);
    } finally {
      setIsLoadingFileStationImages(false);
    }
  };

  useEffect(() => {
    if (activeTab === "appearance") {
      fetchFileStationImages();
    }
  }, [activeTab]);

  const handleWallpaperUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setWallpaperUploadError("กรุณาเลือกไฟล์รูปภาพเท่านั้น (PNG, JPG, WebP, GIF)");
      return;
    }

    setIsUploadingWallpaper(true);
    setWallpaperUploadError("");
    setWallpaperUploadSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folderId", "root");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการอัปโหลดภาพ");
      }

      const uploadedFile = (data.files && data.files[0]) || data.file;
      if (uploadedFile?.url) {
        addCustomWallpaper(uploadedFile.url, uploadedFile.originalName || file.name);
        setWallpaper(uploadedFile.url);
        fetchFileStationImages();
        setWallpaperUploadSuccess(`อัปโหลดและตั้งเป็นภาพพื้นหลังเรียบร้อย: ${uploadedFile.originalName || file.name}`);
        setTimeout(() => setWallpaperUploadSuccess(""), 5000);
      } else {
        throw new Error("ไม่พบข้อมูลไฟล์ภาพหลังการอัปโหลด");
      }
    } catch (err: any) {
      setWallpaperUploadError(err.message || "อัปโหลดภาพไม่สำเร็จ");
    } finally {
      setIsUploadingWallpaper(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleAddWallpaperUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawUrl = urlInput.trim();
    if (!rawUrl) return;

    setIsImportingUrl(true);
    setWallpaperUploadError("");
    setWallpaperUploadSuccess("");

    try {
      // Step 1: Attempt to import & download through the backend (handles CORS, og:image, and saves to library)
      const res = await fetch("/api/upload/from-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: rawUrl }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.file?.url) {
        addCustomWallpaper(data.file.url, data.file.originalName);
        setWallpaper(data.file.url);
        fetchFileStationImages();
        setWallpaperUploadSuccess(`ดึงภาพจากเว็บและตั้งเป็นภาพพื้นหลังเรียบร้อย: ${data.file.originalName}`);
        setTimeout(() => setWallpaperUploadSuccess(""), 5000);
        setUrlInput("");
        setShowUrlInput(false);
        return;
      }

      // Step 2: If server returned specific rejection for non-image, throw error
      if (!res.ok && data.error && !rawUrl.match(/\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i)) {
        throw new Error(data.error);
      }

      // Step 3: Direct URL fallback
      addCustomWallpaper(rawUrl, "Web Wallpaper");
      setWallpaper(rawUrl);
      setWallpaperUploadSuccess("ตั้งค่าภาพพื้นหลังเรียบร้อยแล้ว (Direct Link)");
      setTimeout(() => setWallpaperUploadSuccess(""), 4000);
      setUrlInput("");
      setShowUrlInput(false);
    } catch (err: any) {
      setWallpaperUploadError(err.message || "ไม่สามารถดึงภาพจาก URL ที่ระบุได้");
    } finally {
      setIsImportingUrl(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setProfileError("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      return;
    }
    setIsUploadingAvatar(true);
    setProfileError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folderId", "root");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      const uploaded = (data.files && data.files[0]) || data.file;
      if (uploaded?.url) {
        setProfileAvatar(uploaded.url);
        setProfileSuccess("อัปโหลดรูปภาพโปรไฟล์เรียบร้อย (กรุณากดบันทึกข้อมูล)");
        setTimeout(() => setProfileSuccess(""), 4000);
      } else {
        throw new Error("ไม่พบ URL ของรูปภาพ");
      }
    } catch (err: any) {
      setProfileError(err.message || "อัปโหลดภาพโปรไฟล์ไม่สำเร็จ");
    } finally {
      setIsUploadingAvatar(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");

    if (!profileName.trim()) {
      setProfileError("กรุณาระบุชื่อ-นามสกุล");
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        setProfileError("รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
        return;
      }
      if (newPassword !== confirmPassword) {
        setProfileError("รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน");
        return;
      }
      if (!currentPassword) {
        setProfileError("กรุณาระบุรหัสผ่านปัจจุบันเพื่อยืนยันการเปลี่ยนรหัสผ่าน");
        return;
      }
    }

    setIsSavingProfile(true);
    try {
      const payload: any = {
        name: profileName.trim(),
        department: profileDepartment.trim(),
        avatar: profileAvatar.trim(),
      };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "ไม่สามารถบันทึกข้อมูลได้");
      }

      if (data.user) {
        updateUser(data.user);
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setProfileSuccess(data.message || "บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว");
      setTimeout(() => setProfileSuccess(""), 5000);
    } catch (err: any) {
      setProfileError(err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSavingProfile(false);
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
          onClick={() => setActiveTab("profile")}
          className={`cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            activeTab === "profile"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-300 hover:bg-white/5"
          }`}
        >
          <User className="w-4 h-4" /> โปรไฟล์ & ความปลอดภัย
        </button>

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
          onClick={() => setActiveTab("desktop_dock")}
          className={`cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            activeTab === "desktop_dock"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-300 hover:bg-white/5"
          }`}
        >
          <Monitor className="w-4 h-4" /> เดสก์ท็อป & ด็อค (Desk & Dock)
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
        {/* Tab 0: Personal Profile & Password Settings */}
        {activeTab === "profile" && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-base font-bold text-white mb-1">
                โปรไฟล์ส่วนตัวและความปลอดภัย (Profile & Security)
              </h2>
              <p className="text-xs text-slate-400">
                จัดการข้อมูลส่วนตัว รูปโปรไฟล์ และเปลี่ยนรหัสผ่านเพื่อเข้าใช้งานระบบ DCMS
              </p>
            </div>

            {profileSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Profile Details Card */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <User className="w-4 h-4 text-indigo-400" /> ข้อมูลทั่วไป (Personal Information)
                </div>

                {/* Avatar Preview & Upload */}
                <div className="flex items-center gap-4 pt-2">
                  <div className="relative group">
                    <img
                      src={profileAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                      alt={profileName}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-lg shadow-indigo-500/20"
                    />
                    {isUploadingAvatar && (
                      <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={avatarInputRef}
                        onChange={handleAvatarUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="cursor-pointer px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isUploadingAvatar ? "กำลังอัปโหลด..." : "อัปโหลดรูปภาพใหม่"}</span>
                      </button>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      หรือระบุลิงก์รูปภาพ (Image URL) โดยตรง:
                    </div>
                    <input
                      type="text"
                      value={profileAvatar}
                      onChange={(e) => setProfileAvatar(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-1.5 bg-black/30 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">
                      ชื่อ-นามสกุล (Full Name)
                    </label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      required
                      placeholder="เช่น สมชาย ใจดี"
                      className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">
                      สังกัด / แผนก (Department)
                    </label>
                    <input
                      type="text"
                      value={profileDepartment}
                      onChange={(e) => setProfileDepartment(e.target.value)}
                      placeholder="เช่น ฝ่ายบริหารเทคโนโลยีสารสนเทศ"
                      className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                      <span>อีเมล (Email)</span>
                      <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded">คงที่</span>
                    </label>
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="w-full px-3 py-2 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-slate-400 cursor-not-allowed select-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                      <span>ระดับสิทธิ์ (Role)</span>
                      <span className="text-[10px] text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                        {user?.role}
                      </span>
                    </label>
                    <input
                      type="text"
                      value={user?.role === "superadmin" ? "ผู้ดูแลระบบสูงสุด (Super Administrator)" : user?.role || ""}
                      disabled
                      className="w-full px-3 py-2 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-slate-400 cursor-not-allowed select-none"
                    />
                  </div>
                </div>
              </div>

              {/* Password Change Card */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Key className="w-4 h-4 text-amber-400" /> เปลี่ยนรหัสผ่าน (Change Password)
                </div>
                <p className="text-xs text-slate-400">
                  เว้นว่างไว้หากไม่ต้องการเปลี่ยนรหัสผ่าน (หากต้องการเปลี่ยน ต้องกรอกรหัสผ่านปัจจุบันเพื่อความปลอดภัย)
                </p>

                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">
                      รหัสผ่านปัจจุบัน (Current Password)
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="กรอกรหัสผ่านเดิมเพื่อยืนยัน"
                      className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-300">
                        รหัสผ่านใหม่ (New Password)
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="อย่างน้อย 6 ตัวอักษร"
                        className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-300">
                        ยืนยันรหัสผ่านใหม่ (Confirm Password)
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                        className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="cursor-pointer px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSavingProfile ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isSavingProfile ? "กำลังบันทึก..." : "บันทึกข้อมูล (Save Changes)"}</span>
                </button>
              </div>
            </form>
          </div>
        )}

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

        {/* Tab: Desktop & Dock Settings (แยกเมนูด้านข้าง และด้านล่าง + ตัวเลือก แสดงใน desk) */}
        {activeTab === "desktop_dock" && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-base font-bold text-white mb-1">
                การตั้งค่าเดสก์ท็อปและด็อค (Desktop & Dock Settings)
              </h2>
              <p className="text-xs text-slate-400">
                แยกการแสดงผลระหว่างเมนูด้านข้าง (หน้าจอเดสก์ท็อป) และแถบด็อคด้านล่างออกจากกัน โดยสามารถเปิด/ปิดตัวเลือก "แสดงใน Desk" ได้ตามต้องการ
              </p>
            </div>

            {/* Master Toggle: Show Desktop Shortcuts */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">
                    แสดงไอคอนบนเดสก์ท็อป (Show Desktop Icons)
                  </div>
                  <div className="text-xs text-slate-400">
                    แสดงทางลัดแอปพลิเคชันคอลัมน์ด้านข้างซ้ายบนหน้าจอเดสก์ท็อป
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleShowDesktopIcons}
                className={`cursor-pointer relative w-12 h-6 rounded-full transition-colors ${
                  showDesktopIcons ? "bg-indigo-600" : "bg-slate-700"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                    showDesktopIcons ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Application List with Independent Toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                  รายการแอปพลิเคชันและการแสดงผล ({modules.length} แอป)
                </h3>
                <button
                  type="button"
                  onClick={resetShortcutsToDefault}
                  className="cursor-pointer text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>คืนค่าเริ่มต้น (Reset Defaults)</span>
                </button>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden divide-y divide-white/5">
                {modules.map((mod) => {
                  const onDesk = isModuleOnDesktop(mod);
                  const onDock = isModuleOnDock(mod);

                  return (
                    <div
                      key={mod.id}
                      className="p-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-4">
                        <div
                          className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${mod.colorGradient} flex items-center justify-center text-white shrink-0 shadow-sm`}
                        >
                          <DynamicIcon name={mod.iconName} className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white truncate">
                              {mod.name}
                            </span>
                            {mod.nameTh && (
                              <span className="text-[11px] text-slate-400 truncate">
                                ({mod.nameTh})
                              </span>
                            )}
                            {mod.isSystemApp && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                                Core
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            {mod.description}
                          </p>
                        </div>
                      </div>

                      {/* Toggles */}
                      <div className="flex items-center gap-4 shrink-0">
                        {/* Show on Desk Toggle */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-medium transition-colors ${
                              onDesk ? "text-cyan-300 font-semibold" : "text-slate-500"
                            }`}
                          >
                            แสดงใน Desk
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleDesktopShortcut(mod.id)}
                            className={`cursor-pointer relative w-10 h-5 rounded-full transition-colors ${
                              onDesk
                                ? "bg-cyan-600 shadow-sm shadow-cyan-500/30"
                                : "bg-slate-700"
                            }`}
                            title={
                              onDesk
                                ? "คลิกเพื่อซ่อนจากหน้าจอ Desk"
                                : "คลิกเพื่อแสดงในหน้าจอ Desk"
                            }
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${
                                onDesk ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>

                        {/* Show on Dock Toggle */}
                        <div className="flex items-center gap-2 pl-3 border-l border-white/10">
                          <span
                            className={`text-xs font-medium transition-colors ${
                              onDock ? "text-indigo-300 font-semibold" : "text-slate-500"
                            }`}
                          >
                            แถบ Dock
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleDockShortcut(mod.id)}
                            className={`cursor-pointer relative w-10 h-5 rounded-full transition-colors ${
                              onDock
                                ? "bg-indigo-600 shadow-sm shadow-indigo-500/30"
                                : "bg-slate-700"
                            }`}
                            title={
                              onDock
                                ? "คลิกเพื่อนำออกจากแถบ Dock"
                                : "คลิกเพื่อปักหมุดที่แถบ Dock"
                            }
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${
                                onDock ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Appearance (Wallpapers) */}
        {activeTab === "appearance" && (
          <div className="space-y-6 max-w-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white mb-1">
                  ภาพพื้นหลังหน้าจอเดสก์ท็อป (Desktop Wallpapers)
                </h2>
                <p className="text-xs text-slate-400">
                  เลือกธีมสี หรืออัปโหลดภาพถ่ายของคุณเองเพื่อตั้งเป็นภาพพื้นหลังเดสก์ท็อป
                </p>
              </div>

              {/* Upload & URL Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleWallpaperUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingWallpaper}
                  className="cursor-pointer px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {isUploadingWallpaper ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>กำลังอัปโหลด...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>อัปโหลดภาพใหม่</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="cursor-pointer px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-all"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>ใส่ลิงก์ URL</span>
                </button>
              </div>
            </div>

            {/* Success Message */}
            {wallpaperUploadSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between animate-in fade-in duration-150">
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  {wallpaperUploadSuccess}
                </span>
                <button
                  type="button"
                  onClick={() => setWallpaperUploadSuccess("")}
                  className="text-emerald-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Error Message */}
            {wallpaperUploadError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
                <span>{wallpaperUploadError}</span>
                <button
                  type="button"
                  onClick={() => setWallpaperUploadError("")}
                  className="text-rose-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            )}

            {/* URL Input Form */}
            {showUrlInput && (
              <form
                onSubmit={handleAddWallpaperUrl}
                className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-2 animate-in fade-in duration-100"
              >
                <LinkIcon className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                <input
                  type="url"
                  placeholder="วางลิงก์รูปภาพ เช่น https://images.unsplash.com/... หรือหน้าเว็บที่มีรูปภาพ"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 bg-transparent border-0 text-white placeholder-slate-500 text-xs focus:outline-none"
                  autoFocus
                  disabled={isImportingUrl}
                />
                <button
                  type="submit"
                  disabled={!urlInput.trim() || isImportingUrl}
                  className="cursor-pointer px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
                >
                  {isImportingUrl ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>กำลังดึงภาพ...</span>
                    </>
                  ) : (
                    <span>นำมาใช้</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(false)}
                  disabled={isImportingUrl}
                  className="cursor-pointer px-2 py-1 text-slate-400 hover:text-white text-xs"
                >
                  ยกเลิก
                </button>
              </form>
            )}

            {/* Custom Uploaded Wallpapers (If any) */}
            {customWallpapers.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>ภาพที่คุณอัปโหลดไว้ ({customWallpapers.length})</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {customWallpapers.map((wp) => {
                    const isSelected = wallpaper === wp.url || wallpaper === wp.id;
                    return (
                      <div
                        key={wp.id}
                        className={`group relative rounded-2xl border transition-all overflow-hidden cursor-pointer ${
                          isSelected
                            ? "border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/20"
                            : "border-white/10 hover:border-white/25 bg-white/[0.02]"
                        }`}
                        onClick={() => setWallpaper(wp.url)}
                      >
                        <div className="h-28 relative bg-black/40 overflow-hidden">
                          <img
                            src={wp.url}
                            alt={wp.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = "none";
                            }}
                          />
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeCustomWallpaper(wp.id);
                            }}
                            className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-md"
                            title="ลบภาพนี้ออกจากรายการ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="p-2.5 bg-black/40 border-t border-white/5 flex items-center justify-between">
                          <span className="text-xs font-medium text-white truncate max-w-[130px]">
                            {wp.name}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] text-cyan-400 font-semibold">
                              ใช้งานอยู่
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Photos from File Station */}
            {fileStationImages.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
                    <span>เลือกจากคลังรูปภาพใน File Station ({fileStationImages.length})</span>
                  </div>
                  <button
                    type="button"
                    onClick={fetchFileStationImages}
                    className="cursor-pointer text-[11px] text-slate-400 hover:text-white"
                  >
                    รีเฟรช
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {fileStationImages.slice(0, 8).map((file) => {
                    const isSelected = wallpaper === file.url;
                    return (
                      <div
                        key={file.id}
                        onClick={() => {
                          addCustomWallpaper(file.url, file.originalName);
                          setWallpaper(file.url);
                        }}
                        className={`group relative rounded-xl border transition-all overflow-hidden cursor-pointer ${
                          isSelected
                            ? "border-cyan-500 ring-2 ring-cyan-500/30 shadow-md"
                            : "border-white/10 hover:border-white/30 bg-black/30"
                        }`}
                        title={file.originalName}
                      >
                        <div className="h-20 bg-black/40 relative overflow-hidden">
                          <img
                            src={file.url}
                            alt={file.originalName}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = "none";
                            }}
                          />
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-cyan-500 text-white flex items-center justify-center shadow-md">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                        <div className="p-1.5 bg-black/50 truncate text-[10px] text-slate-300">
                          {file.originalName}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Default System Color Gradients */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                ธีมสีระบบ (Default Gradients)
              </div>
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
                        className={`h-24 rounded-xl bg-gradient-to-br ${wp.preview} border border-white/10 relative overflow-hidden mb-2`}
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

            {/* Database Backup & Restore Section */}
            <div className="mt-8 pt-6 border-t border-white/10 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  การสำรองและกู้คืนฐานข้อมูล (Database Backup & Restore)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  รองรับการสำรองข้อมูลทั้งแบบ SQLite Binary สำหรับการโคลนสมบูรณ์แบบ และแบบ Universal JSON สำหรับ Migrate ไปยัง MySQL หรือ PostgreSQL ตามสถาปัตยกรรม DCMS
                </p>
              </div>

              {restoreMessage && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in ${
                    restoreMessage.type === "success"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                  }`}
                >
                  {restoreMessage.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{restoreMessage.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Backup Card */}
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="text-xs font-semibold text-white flex items-center gap-2 mb-1">
                      <HardDriveDownload className="w-4 h-4 text-indigo-400" /> ดาวน์โหลดไฟล์สำรองข้อมูล (Backup)
                    </div>
                    <div className="text-[11px] text-slate-400 leading-relaxed">
                      ดาวน์โหลดข้อมูลทั้งหมดของระบบ (ผู้ใช้, โฟลเดอร์, ไฟล์, การตั้งค่า, การแจ้งเตือน) เก็บไว้ในเครื่องคอมพิวเตอร์ของคุณ
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <a
                      href="/api/database/backup?type=sqlite"
                      download
                      className="cursor-pointer px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 shadow transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>ดาวน์โหลด .sqlite</span>
                    </a>
                    <a
                      href="/api/database/backup?type=json"
                      download
                      className="cursor-pointer px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-white/10"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>ส่งออก JSON (Universal)</span>
                    </a>
                  </div>
                </div>

                {/* Restore Card */}
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="text-xs font-semibold text-white flex items-center gap-2 mb-1">
                      <HardDriveUpload className="w-4 h-4 text-amber-400" /> กู้คืนฐานข้อมูล (Restore Backup)
                    </div>
                    <div className="text-[11px] text-slate-400 leading-relaxed">
                      อัปโหลดไฟล์สำรองข้อมูล (.sqlite หรือ .json) เพื่อคืนค่าฐานข้อมูล (ระบบจะสำรองไฟล์เดิมไว้เป็น .bak ให้อัตโนมัติ)
                    </div>
                  </div>
                  <div className="pt-2">
                    <input
                      type="file"
                      ref={restoreInputRef}
                      onChange={handleRestoreDatabase}
                      accept=".sqlite,.db,.json"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => restoreInputRef.current?.click()}
                      disabled={isRestoring}
                      className="cursor-pointer px-3 py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/40 border border-amber-500/40 text-amber-200 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {isRestoring ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>{isRestoring ? "กำลังกู้คืนข้อมูล..." : "เลือกไฟล์และเริ่มกู้คืน (Restore)"}</span>
                    </button>
                  </div>
                </div>
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
