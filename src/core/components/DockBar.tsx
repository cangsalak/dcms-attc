"use client";

import React, { useState } from "react";
import { useWindowManager } from "../context/WindowManagerContext";
import { DynamicIcon } from "./IconResolver";
import { ExternalLink, Eye, EyeOff, PinOff, Settings, SlidersHorizontal } from "lucide-react";
import { AppModule } from "../types/module";

export function DockBar() {
  const {
    modules,
    windows,
    activeWindowId,
    openApp,
    focusWindow,
    minimizeWindow,
    language,
    isModuleOnDock,
    isModuleOnDesktop,
    toggleDesktopShortcut,
    toggleDockShortcut,
  } = useWindowManager();

  const [dockContextMenu, setDockContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    mod: AppModule | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    mod: null,
  });

  const dockModules = modules.filter((m) => isModuleOnDock(m) && m.enabled);

  const handleDockClick = (moduleId: string) => {
    setDockContextMenu({ visible: false, x: 0, y: 0, mod: null });
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

  const handleDockContextMenu = (e: React.MouseEvent, mod: AppModule) => {
    e.preventDefault();
    e.stopPropagation();
    setDockContextMenu({
      visible: true,
      x: Math.min(e.clientX, window.innerWidth - 220),
      y: Math.max(10, e.clientY - 170),
      mod,
    });
  };

  return (
    <>
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 select-none">
        <div className="glass-dock px-3.5 py-2.5 rounded-2xl flex items-center gap-2.5 transition-all">
          {dockModules.map((mod) => {
            const runningWindow = windows.find((w) => w.appId === mod.id);
            const isRunning = Boolean(runningWindow);
            const isActive =
              isRunning &&
              activeWindowId === runningWindow?.id &&
              !runningWindow?.isMinimized;

            const title =
              language === "th" && mod.nameTh ? mod.nameTh : mod.name;

            return (
              <div
                key={mod.id}
                className="relative group flex flex-col items-center"
              >
                {/* Tooltip */}
                <div className="absolute -top-10 px-2.5 py-1 rounded-lg glass-panel text-[11px] font-medium text-white shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {title}
                </div>

                {/* Dock Icon Button */}
                <button
                  onClick={() => handleDockClick(mod.id)}
                  onContextMenu={(e) => handleDockContextMenu(e, mod)}
                  className={`cursor-pointer w-12 h-12 rounded-xl bg-gradient-to-tr ${
                    mod.colorGradient
                  } flex items-center justify-center text-white shadow-lg transition-all duration-200 group-hover:-translate-y-2 group-hover:scale-110 active:scale-95 ${
                    isActive
                      ? "ring-2 ring-white/50 shadow-indigo-500/40"
                      : "hover:shadow-indigo-500/25"
                  }`}
                  aria-label={title}
                >
                  <DynamicIcon
                    name={mod.iconName}
                    className="w-6 h-6 text-white drop-shadow"
                  />
                </button>

                {/* Running Status Indicator Dot */}
                <div className="h-1 flex items-center justify-center mt-1">
                  {isRunning && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        isActive
                          ? "bg-white w-2 shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                          : "bg-white/50"
                      }`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dock Icon Right-Click Context Menu */}
      {dockContextMenu.visible && dockContextMenu.mod && (
        <>
          <div
            className="fixed inset-0 z-50"
            onClick={() => setDockContextMenu({ visible: false, x: 0, y: 0, mod: null })}
          />
          <div
            style={{ top: `${dockContextMenu.y}px`, left: `${dockContextMenu.x}px` }}
            className="fixed glass-panel rounded-xl py-1 text-xs text-slate-200 shadow-2xl z-50 w-60 animate-in fade-in zoom-in-95 duration-75 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-white/10 flex items-center gap-2">
              <DynamicIcon
                name={dockContextMenu.mod.iconName}
                className="w-3.5 h-3.5 text-indigo-400"
              />
              <span className="truncate">
                {language === "th" && dockContextMenu.mod.nameTh
                  ? dockContextMenu.mod.nameTh
                  : dockContextMenu.mod.name}
              </span>
            </div>

            <button
              onClick={() => {
                openApp(dockContextMenu.mod!.id);
                setDockContextMenu({ visible: false, x: 0, y: 0, mod: null });
              }}
              className="cursor-pointer w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white flex items-center gap-2"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>เปิดแอป (Open)</span>
            </button>

            <button
              onClick={() => {
                toggleDesktopShortcut(dockContextMenu.mod!.id);
                setDockContextMenu({ visible: false, x: 0, y: 0, mod: null });
              }}
              className="cursor-pointer w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white flex items-center gap-2"
            >
              {isModuleOnDesktop(dockContextMenu.mod) ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>นำออกจากเดสก์ท็อป (Remove from Desk)</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>แสดงใน Desk (Show on Desktop)</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                toggleDockShortcut(dockContextMenu.mod!.id);
                setDockContextMenu({ visible: false, x: 0, y: 0, mod: null });
              }}
              className="cursor-pointer w-full text-left px-3 py-1.5 hover:bg-rose-600/30 text-rose-300 hover:text-white flex items-center gap-2"
            >
              <PinOff className="w-3.5 h-3.5" />
              <span>นำออกจากด็อค (Remove from Dock)</span>
            </button>

            <div className="border-t border-white/10 my-1" />

            <button
              onClick={() => {
                openApp("control-panel");
                setDockContextMenu({ visible: false, x: 0, y: 0, mod: null });
              }}
              className="cursor-pointer w-full text-left px-3 py-1.5 hover:bg-white/10 text-slate-300 flex items-center gap-2"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
              <span>จัดการทางลัดในแผงควบคุม (Control Panel)...</span>
            </button>
          </div>
        </>
      )}
    </>
  );
}
