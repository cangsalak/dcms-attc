"use client";

import React, { useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  Shield,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
} from "lucide-react";
import { UserItem, UserRole, UserStatus } from "../types";
import { initialUsers } from "../services/userService";
import {
  ModuleContainer,
  ModuleToolbar,
  ModuleButton,
  ModuleFooter,
  ModuleModal,
} from "@/core/components/ui/ModuleLayout";

export function UsersApp({ windowId }: { windowId: string }) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [dbDialect, setDbDialect] = useState<string>("sqlite");
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    role: UserRole;
    department: string;
    status: UserStatus;
  }>({
    name: "",
    email: "",
    role: "Member",
    department: "General",
    status: "active",
  });

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.users && data.users.length > 0) {
        setUsers(data.users);
      }
      const statusRes = await fetch("/api/database/status");
      const statusData = await statusRes.json();
      if (statusData.dialect) {
        setDbDialect(statusData.dialect);
      }
    } catch (e) {
      console.error("Failed to fetch users from DB:", e);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === "all" || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.user) {
        setUsers([data.user, ...users]);
      }
    } catch {
      const newUser: UserItem = {
        id: `usr-${Date.now().toString().slice(-4)}`,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.department,
        status: formData.status,
        avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80`,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setUsers([newUser, ...users]);
    }

    setFormData({
      name: "",
      email: "",
      role: "Member",
      department: "General",
      status: "active",
    });
    setShowAddModal(false);
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้งานนี้?")) {
      try {
        await fetch(`/api/users?id=${id}`, { method: "DELETE" });
      } catch {
        // Continue
      }
      setUsers(users.filter((u) => u.id !== id));
    }
  };

  const activeCount = users.filter((u) => u.status === "active").length;
  const adminCount = users.filter((u) => u.role.includes("Admin")).length;

  return (
    <ModuleContainer>
      {/* Standard Unified Toolbar */}
      <ModuleToolbar
        leftActions={
          <>
            <ModuleButton
              variant="primary"
              icon={UserPlus}
              onClick={() => setShowAddModal(true)}
            >
              เพิ่มผู้ใช้ใหม่
            </ModuleButton>

            <div className="flex items-center gap-1.5 ml-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-2 py-1 text-xs rounded-lg bg-black/30 border border-white/10 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="all" className="bg-[#1a1532] text-white">ทั้งหมด (All Roles)</option>
                <option value="Super Admin" className="bg-[#1a1532] text-white">Super Admin</option>
                <option value="Admin" className="bg-[#1a1532] text-white">Admin</option>
                <option value="Manager" className="bg-[#1a1532] text-white">Manager</option>
                <option value="Member" className="bg-[#1a1532] text-white">Member</option>
              </select>
            </div>
          </>
        }
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="ค้นหาชื่อ, อีเมล, แผนก..."
        onRefresh={fetchUsers}
        isRefreshing={isLoading}
      />

      {/* Metrics Row */}
      <div className="px-6 py-3 grid grid-cols-2 md:grid-cols-4 gap-3 border-b border-white/5 bg-white/[0.01] shrink-0">
        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="text-[11px] text-slate-400">ผู้ใช้ทั้งหมด</div>
          <div className="text-xl font-bold text-white mt-0.5">{users.length} คน</div>
        </div>
        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="text-[11px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> ใช้งานอยู่ (Active)
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-0.5">{activeCount} คน</div>
        </div>
        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="text-[11px] text-indigo-400 flex items-center gap-1">
            <Shield className="w-3 h-3" /> ผู้ดูแลระบบ (Admins)
          </div>
          <div className="text-xl font-bold text-indigo-400 mt-0.5">{adminCount} คน</div>
        </div>
        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="text-[11px] text-amber-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> ฐานข้อมูลหลัก
          </div>
          <div className="text-xl font-bold text-amber-400 mt-0.5 uppercase font-mono">{dbDialect}</div>
        </div>
      </div>

      {/* Users Table */}
      <div className="flex-1 overflow-auto px-6 py-2">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 text-[10px] text-slate-400 uppercase tracking-wider">
              <th className="py-2.5 px-3">ผู้ใช้งาน</th>
              <th className="py-2.5 px-3">บทบาท (Role)</th>
              <th className="py-2.5 px-3">แผนก</th>
              <th className="py-2.5 px-3">สถานะ</th>
              <th className="py-2.5 px-3">วันที่สร้าง</th>
              <th className="py-2.5 px-3 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  ไม่พบข้อมูลผู้ใช้งานที่ตรงกับเงื่อนไข
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-white/[0.03] transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover border border-white/20"
                      />
                      <div>
                        <div className="font-semibold text-white">{user.name}</div>
                        <div className="text-[11px] text-slate-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                        user.role === "Super Admin"
                          ? "bg-purple-500/10 text-purple-300 border-purple-500/30"
                          : user.role === "Admin"
                          ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                          : user.role === "Manager"
                          ? "bg-blue-500/10 text-blue-300 border-blue-500/30"
                          : "bg-slate-500/10 text-slate-300 border-slate-500/30"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">{user.department}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        user.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : user.status === "inactive"
                          ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          user.status === "active"
                            ? "bg-emerald-400"
                            : user.status === "inactive"
                            ? "bg-amber-400"
                            : "bg-rose-400"
                        }`}
                      />
                      {user.status === "active"
                        ? "Active"
                        : user.status === "inactive"
                        ? "Inactive"
                        : "Suspended"}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{user.createdAt}</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      title="ลบผู้ใช้"
                      onClick={() => handleDeleteUser(user.id)}
                      className="cursor-pointer p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Standard Unified Footer Status Bar */}
      <ModuleFooter
        leftContent={`ผู้ใช้งานทั้งหมด ${users.length} คน (Active ${activeCount})`}
      />

      {/* Standard Unified Modal */}
      <ModuleModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="เพิ่มผู้ใช้งานใหม่"
        icon={UserPlus}
        subtitle="บันทึกลงระบบและฐานข้อมูลหลักแบบอัตโนมัติ"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddUser} className="space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              ชื่อ - นามสกุล
            </label>
            <input
              type="text"
              required
              placeholder="เช่น สมชาย ใจดี"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              อีเมล (Email)
            </label>
            <input
              type="email"
              required
              placeholder="somchai@dcms.local"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                บทบาท (Role)
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value as UserRole })
                }
                className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/15 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Member" className="bg-[#181330] text-white">Member</option>
                <option value="Manager" className="bg-[#181330] text-white">Manager</option>
                <option value="Admin" className="bg-[#181330] text-white">Admin</option>
                <option value="Super Admin" className="bg-[#181330] text-white">Super Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                แผนก (Department)
              </label>
              <input
                type="text"
                placeholder="เช่น IT, HR, Finance"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="cursor-pointer px-3.5 py-1.5 text-xs rounded-lg hover:bg-white/10 text-slate-300"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="cursor-pointer px-4 py-1.5 text-xs rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-md shadow-blue-600/30"
            >
              เพิ่มผู้ใช้
            </button>
          </div>
        </form>
      </ModuleModal>
    </ModuleContainer>
  );
}
