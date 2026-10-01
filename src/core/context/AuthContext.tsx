"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  avatar: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLocked: boolean;
  lock: () => void;
  unlock: (password: string) => Promise<{ success: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (updatedFields: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("dcms_is_locked") === "true";
    }
    return false;
  });

  // Check existing session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
          setIsLocked(false);
          try {
            localStorage.removeItem("dcms_is_locked");
          } catch {}
        }
      } catch (e) {
        console.error("Session check error:", e);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "เข้าสู่ระบบไม่สำเร็จ" };
      }
      setUser(data.user);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ" };
    }
  };

  const lock = () => {
    setIsLocked(true);
    try {
      localStorage.setItem("dcms_is_locked", "true");
    } catch {}
  };

  const unlock = async (password: string) => {
    if (!user) return { success: false, error: "ไม่พบบัญชีผู้ใช้งาน" };
    const res = await login(user.email, password);
    if (res.success) {
      setIsLocked(false);
      try {
        localStorage.removeItem("dcms_is_locked");
      } catch {}
      return { success: true };
    }
    return { success: false, error: res.error || "รหัสผ่านไม่ถูกต้อง" };
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      setIsLocked(false);
      try {
        localStorage.removeItem("dcms_is_locked");
      } catch {}
    }
  };

  const updateUser = (updatedFields: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        isLocked,
        lock,
        unlock,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
