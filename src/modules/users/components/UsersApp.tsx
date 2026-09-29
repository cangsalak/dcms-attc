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
      // Fallback local
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

    setShowAddModal(false);
    setFormData({
      name: "",
      email: "",
      role: "Member",
      department: "General",
      status: "active",
    });
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้นี้ออกจากระบบ?")) {
      try {
        await fetch(`/api/users?id=${id}`, { method: "DELETE" });
      } catch (e) {
        console.error("Failed to delete user on server:", e);
      }
      setUsers(users.filter((u) => u.id !== id));
    }
  };

  const activeCount = users.filter((u) => u.status === "active").length;
  const adminCount = users.filter((u) => u.role.includes("Admin")).length;

  return (
    <div className="flex flex-col h-full bg-[#120e24] text-slate-100 select-text font-sans">
      {/* Module Sub-Header */}
      <div className="px-6 py-4 border-b border-white/10 bg-white/[0.02] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              จัดการผู้ใช้งาน (User Management Module)
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                v1.0.0
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase font-mono">
                ⚡ DB: {dbDialect}
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              โมดูลแยกอิสระ (Decoupled Module) พร้อมระบบจัดการสิทธิ์และข้อมูลผู้ใช้
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="cursor-pointer px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          เพิ่มผู้ใช้ใหม่
        </button>
      </div>

      {/* Metrics Row */}
      <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-3 border-b border-white/5 bg-white/[0.01]">
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="text-xs text-slate-400">ผู้ใช้ทั้งหมด</div>
          <div className="text-2xl font-bold text-white mt-1">{users.length}</div>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="text-xs text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> ใช้งานอยู่ (Active)
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{activeCount}</div>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="text-xs text-indigo-400 flex items-center gap-1">
            <Shield className="w-3 h-3" /> ผู้ดูแลระบบ (Admins)
          </div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">{adminCount}</div>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="text-xs text-amber-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> ระงับ / ไม่ใช้งาน
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            {users.length - activeCount}
          </div>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="px-6 py-3 flex flex-wrap items-center justify-between gap-3 bg-white/[0.02]">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาตามชื่อ, อีเมล หรือแผนก..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400">บทบาท:</span>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all" className="bg-[#1a1532] text-white">ทั้งหมด (All Roles)</option>
            <option value="Super Admin" className="bg-[#1a1532] text-white">Super Admin</option>
            <option value="Admin" className="bg-[#1a1532] text-white">Admin</option>
            <option value="Manager" className="bg-[#1a1532] text-white">Manager</option>
            <option value="Member" className="bg-[#1a1532] text-white">Member</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="flex-1 overflow-auto px-6 py-2">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-3">ผู้ใช้งาน</th>
              <th className="py-3 px-3">บทบาท (Role)</th>
              <th className="py-3 px-3">แผนก</th>
              <th className="py-3 px-3">สถานะ</th>
              <th className="py-3 px-3">วันที่สร้าง</th>
              <th className="py-3 px-3 text-right">จัดการ</th>
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
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-9 h-9 rounded-full object-cover border border-white/20"
                      />
                      <div>
                        <div className="font-medium text-white">{user.name}</div>
                        <div className="text-xs text-slate-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
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
                  <td className="py-3 px-3 text-slate-300 text-xs">{user.department}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
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
                  <td className="py-3 px-3 text-xs text-slate-400">{user.createdAt}</td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        title="แก้ไข"
                        className="cursor-pointer p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="ลบ"
                        onClick={() => handleDeleteUser(user.id)}
                        className="cursor-pointer p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#1a1435] border border-white/20 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">เพิ่มผู้ใช้งานใหม่</h2>
            <p className="text-xs text-slate-400 mb-4">
              กรอกข้อมูลเพื่อลงทะเบียนผู้ใช้ในระบบ Users Module
            </p>

            <form onSubmit={handleAddUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  ชื่อ - นามสกุล
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น สมชาย ใจดี"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-white/5 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  อีเมล (Email)
                </label>
                <input
                  type="email"
                  required
                  placeholder="user@organization.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-white/5 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    บทบาท (Role)
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value as UserRole })
                    }
                    className="w-full px-2.5 py-2 text-sm rounded-lg bg-white/5 border border-white/15 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Super Admin" className="bg-[#1a1435]">Super Admin</option>
                    <option value="Admin" className="bg-[#1a1435]">Admin</option>
                    <option value="Manager" className="bg-[#1a1435]">Manager</option>
                    <option value="Member" className="bg-[#1a1435]">Member</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    แผนก (Department)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น IT, Operations"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg bg-white/5 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="cursor-pointer px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="cursor-pointer px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
                >
                  บันทึกผู้ใช้
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
