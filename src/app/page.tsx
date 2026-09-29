"use client";

import { AuthProvider } from "@/core/context/AuthContext";
import { WindowManagerProvider } from "@/core/context/WindowManagerContext";
import { DesktopApp } from "@/core/components/DesktopApp";

export default function HomePage() {
  return (
    <AuthProvider>
      <WindowManagerProvider>
        <DesktopApp />
      </WindowManagerProvider>
    </AuthProvider>
  );
}
