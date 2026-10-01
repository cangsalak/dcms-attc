"use client";

import React from "react";
import { TopMenuBar } from "./TopMenuBar";
import { DesktopSurface } from "./DesktopSurface";
import { DockBar } from "./DockBar";
import { LoginScreen } from "./LoginScreen";
import { LockScreen } from "./LockScreen";
import { useAuth } from "../context/AuthContext";

export function DesktopApp() {
  const { isAuthenticated, isLoading, isLocked } = useAuth();

  // Loading state
  if (isLoading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#0d091e] text-white">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse shadow-xl shadow-indigo-500/30 mb-4">
          <span className="text-xl font-bold">✦</span>
        </div>
        <p className="text-xs text-slate-400 font-medium tracking-wide">
          กำลังเตรียมระบบความปลอดภัย...
        </p>
      </div>
    );
  }

  // Enforce login for everyone
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Authenticated: Show Clean Full Desktop OS
  return (
    <main className="relative w-screen h-screen flex flex-col overflow-hidden bg-[#0d091e]">
      <TopMenuBar />
      <DesktopSurface />
      <DockBar />
      {isLocked && <LockScreen />}
    </main>
  );
}
