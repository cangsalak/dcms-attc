"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Key,
  ShieldCheck,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Save,
  Clock,
  Building,
  Mail,
  Shield,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/core/context/AuthContext";
import {
  ModuleContainer,
  ModuleToolbar,
  ModuleButton,
  ModuleFooter,
} from "@/core/components/ui/ModuleLayout";
import { formatFullThaiDate } from "@/core/lib/dateFormat";

interface ProfileAppProps {
  windowId: string;
}

export function ProfileApp({ windowId }: ProfileAppProps) {
  const { user, updateUser } = useAuth();

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

  useEffect(() => {
    if (user) {
      setProfileName(user.name || "");
      setProfileDepartment(user.department || "");
      setProfileAvatar(user.avatar || "");
    }
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setProfileError("กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WebP, GIF, SVG)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileError("ขนาดไฟล์รูปภาพต้องไม่เกิน 5 MB");
      return;
    }

    setIsUploadingAvatar(true);
    setProfileError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "อัปโหลดรูปภาพไม่สำเร็จ");
      }

      setProfileAvatar(data.file.url);
      setProfileSuccess("อัปโหลดรูปโปรไฟล์เรียบร้อยแล้ว (กดบันทึกเพื่อยืนยัน)");
      setTimeout(() => setProfileSuccess(""), 4000);
    } catch (err: any) {
      setProfileError(err.message || "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
    } finally {
      setIsUploadingAvatar(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setProfileSuccess("");
    setProfileError("");

    if (!profileName.trim()) {
      setProfileError("กรุณาระบุชื่อ-นามสกุล");
      return;
    }

    if (newPassword) {
      if (!currentPassword) {
        setProfileError("กรุณากรอกรหัสผ่านปัจจุบันเพื่อยืนยันการเปลี่ยนรหัสผ่าน");
        return;
      }
      if (newPassword.length < 6) {
        setProfileError("รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
        return;
      }
      if (newPassword !== confirmPassword) {
        setProfileError("รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน");
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

  const handleResetForm = () => {
    if (user) {
      setProfileName(user.name || "");
      setProfileDepartment(user.department || "");
      setProfileAvatar(user.avatar || "");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setProfileError("");
      setProfileSuccess("");
    }
  };

  return (
    <ModuleContainer>
      {/* Header Toolbar */}
      <ModuleToolbar
        leftActions={
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white text-xs">
                โปรไฟล์และบัญชีส่วนตัว (Personal Profile)
              </div>
              <div className="text-[10px] text-slate-400 hidden sm:block">
                จัดการข้อมูลส่วนตัว รูปภาพประจำตัว และเปลี่ยนรหัสผ่าน
              </div>
            </div>
          </div>
        }
        selectedActions={
          <div className="flex items-center gap-2">
            <ModuleButton
              onClick={handleResetForm}
              icon={RotateCcw}
              variant="secondary"
              disabled={isSavingProfile}
            >
              คืนค่าเดิม
            </ModuleButton>
            <ModuleButton
              onClick={() => handleSaveProfile()}
              icon={isSavingProfile ? Loader2 : Save}
              variant="primary"
              disabled={isSavingProfile}
            >
              {isSavingProfile ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </ModuleButton>
          </div>
        }
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#120e24]">
        <div className="max-w-2xl mx-auto space-y-5">
          {/* Notifications Banner */}
          {profileSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in shadow-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in shadow-sm">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-5">
            {/* 1. Personal Information Card */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider border-b border-white/10 pb-3">
                <User className="w-4 h-4 text-indigo-400" />
                <span>ข้อมูลบัญชีผู้ใช้งาน (Account Information)</span>
              </div>

              {/* Avatar Preview & Upload */}
              <div className="flex items-start sm:items-center gap-4 pt-1 flex-col sm:flex-row">
                <div className="relative group shrink-0">
                  <img
                    src={
                      profileAvatar ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
                    }
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

                <div className="flex-1 space-y-2 w-full">
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
                      className="cursor-pointer px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
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
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-1.5 bg-black/30 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    ชื่อ-นามสกุล (Full Name) <span className="text-rose-400">*</span>
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
                  <label className="text-xs font-semibold text-slate-300">
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
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>อีเมลเข้าสู่ระบบ (Email)</span>
                    <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.2 rounded">
                      คงที่
                    </span>
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="w-full pl-8 pr-3 py-2 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-slate-400 cursor-not-allowed select-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>ระดับสิทธิ์ในระบบ (Role)</span>
                    <span className="text-[10px] text-cyan-300 bg-cyan-500/10 px-2 py-0.2 rounded border border-cyan-500/20 font-medium">
                      {user?.role}
                    </span>
                  </label>
                  <div className="relative">
                    <Shield className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={
                        user?.role === "Super Admin" || user?.role === "superadmin"
                          ? "ผู้ดูแลระบบสูงสุด (Super Administrator)"
                          : user?.role || ""
                      }
                      disabled
                      className="w-full pl-8 pr-3 py-2 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-slate-400 cursor-not-allowed select-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Security & Password Change Card */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider border-b border-white/10 pb-3">
                <Key className="w-4 h-4 text-amber-400" />
                <span>ความปลอดภัยและเปลี่ยนรหัสผ่าน (Security & Password)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                หากไม่ต้องการเปลี่ยนรหัสผ่าน ให้เว้นช่องด้านล่างนี้ว่างไว้ (หากต้องการเปลี่ยน ต้องระบุรหัสผ่านปัจจุบันเพื่อความปลอดภัย)
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
                    placeholder="กรอกรหัสผ่านเดิมเพื่อยืนยันสิทธิ์"
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
                      placeholder="ความยาวอย่างน้อย 6 ตัวอักษร"
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

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetForm}
                disabled={isSavingProfile}
                className="cursor-pointer px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-colors"
              >
                ยกเลิกการแก้ไข
              </button>
              <button
                type="submit"
                disabled={isSavingProfile}
                className="cursor-pointer px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {isSavingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>บันทึกการเปลี่ยนแปลง</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Module Footer */}
      <ModuleFooter
        leftContent={
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>เข้าสู่ระบบในฐานะ: <strong className="text-white">{user?.email}</strong></span>
          </span>
        }
        rightStatus={user?.role || "Active"}
      />
    </ModuleContainer>
  );
}
