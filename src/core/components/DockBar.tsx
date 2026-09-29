"use client";

import React from "react";
import { useWindowManager } from "../context/WindowManagerContext";
import { DynamicIcon } from "./IconResolver";

export function DockBar() {
  const {
    modules,
    windows,
    activeWindowId,
    openApp,
    focusWindow,
    minimizeWindow,
    language,
  } = useWindowManager();

  const dockModules = modules.filter((m) => m.dockShortcut && m.enabled);

  const handleDockClick = (moduleId: string) => {
    const runningWindow = windows.find((w) => w.appId === moduleId);
    if (!runningWindow) {
      openApp(moduleId);
    } else if (runningWindow.isMinimized) {
      focusWindow(runningWindow.id);
    } else if (activeWindowId === runningWindow.id) {
      // Toggle minimize if already active
      minimizeWindow(runningWindow.id);
    } else {
      focusWindow(runningWindow.id);
    }
  };

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 select-none">
      <div className="glass-dock px-3.5 py-2.5 rounded-2xl flex items-center gap-2.5 transition-all">
        {dockModules.map((mod) => {
          const runningWindow = windows.find((w) => w.appId === mod.id);
          const isRunning = Boolean(runningWindow);
          const isActive = isRunning && activeWindowId === runningWindow?.id && !runningWindow?.isMinimized;

          const title = language === "th" && mod.nameTh ? mod.nameTh : mod.name;

          return (
            <div key={mod.id} className="relative group flex flex-col items-center">
              {/* Tooltip */}
              <div className="absolute -top-10 px-2.5 py-1 rounded-lg glass-panel text-[11px] font-medium text-white shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {title}
              </div>

              {/* Dock Icon Button */}
              <button
                onClick={() => handleDockClick(mod.id)}
                className={`cursor-pointer w-12 h-12 rounded-xl bg-gradient-to-tr ${mod.colorGradient} flex items-center justify-center text-white shadow-lg transition-all duration-200 group-hover:-translate-y-2 group-hover:scale-110 active:scale-95 ${
                  isActive
                    ? "ring-2 ring-white/50 shadow-indigo-500/40"
                    : "hover:shadow-indigo-500/25"
                }`}
                aria-label={title}
              >
                <DynamicIcon name={mod.iconName} className="w-6 h-6 text-white drop-shadow" />
              </button>

              {/* Running Status Indicator Dot */}
              <div className="h-1 flex items-center justify-center mt-1">
                {isRunning && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      isActive ? "bg-white w-2 shadow-[0_0_8px_rgba(255,255,255,0.8)]" : "bg-white/50"
                    }`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
