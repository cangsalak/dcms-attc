"use client";

import React, { useState } from "react";
import { useWindowManager } from "../context/WindowManagerContext";
import { DynamicIcon } from "./IconResolver";
import { WindowFrame } from "./WindowFrame";
import { Sparkles, RefreshCw, Image, LayoutGrid } from "lucide-react";

export function DesktopSurface() {
  const {
    modules,
    windows,
    openApp,
    wallpaper,
    language,
    setWallpaper,
  } = useWindowManager();

  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({
    visible: false,
    x: 0,
    y: 0,
  });

  const desktopModules = modules.filter((m) => m.desktopShortcut && m.enabled);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: Math.min(e.clientX, window.innerWidth - 180),
      y: Math.min(e.clientY, window.innerHeight - 200),
    });
  };

  const handleDesktopClick = () => {
    setSelectedAppId(null);
    if (contextMenu.visible) {
      setContextMenu({ ...contextMenu, visible: false });
    }
  };

  // Wallpaper backgrounds mapping
  const wallpaperClass =
    wallpaper === "cyber-blue"
      ? "from-[#080e22] via-[#0d1e3d] to-[#040817]"
      : wallpaper === "emerald-nebula"
      ? "from-[#061413] via-[#0a2321] to-[#030b0a]"
      : wallpaper === "midnight-dark"
      ? "from-[#0a0a0a] via-[#141414] to-[#050505]"
      : "from-[#0d091e] via-[#1a1236] to-[#080514]"; // dcms purple default

  return (
    <div
      onClick={handleDesktopClick}
      onContextMenu={handleContextMenu}
      className={`relative w-full h-[calc(100vh-28px)] overflow-hidden bg-gradient-to-b ${wallpaperClass} transition-colors duration-500`}
    >
      {/* Abstract Curved Wave Lines */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#a855f7" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="waveGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#818cf8" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#c084fc" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        <path
          d="M -100 450 C 300 320, 800 620, 1540 380"
          fill="none"
          stroke="url(#waveGrad1)"
          strokeWidth="2.5"
        />
        <path
          d="M -100 490 C 320 360, 820 660, 1540 420"
          fill="none"
          stroke="url(#waveGrad2)"
          strokeWidth="2"
        />
        <path
          d="M -100 540 C 340 410, 840 710, 1540 470"
          fill="none"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="1.5"
        />
      </svg>

      {/* Subtle radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Desktop App Icons on the Right Side (matching user screenshot layout) */}
      <div className="absolute top-8 right-8 flex flex-col gap-6 z-10 select-none">
        {desktopModules.map((mod) => {
          const isSelected = selectedAppId === mod.id;
          const title = language === "th" && mod.nameTh ? mod.nameTh : mod.name;

          return (
            <div
              key={mod.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedAppId(mod.id);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                openApp(mod.id);
              }}
              className={`flex flex-col items-center group cursor-pointer p-2 rounded-2xl transition-all ${
                isSelected
                  ? "bg-white/15 ring-1 ring-white/30 backdrop-blur-md shadow-lg"
                  : "hover:bg-white/5"
              }`}
            >
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${mod.colorGradient} flex items-center justify-center text-white shadow-xl shadow-black/40 group-hover:scale-105 group-hover:shadow-indigo-500/30 transition-all duration-200`}
              >
                <DynamicIcon name={mod.iconName} className="w-7 h-7 text-white drop-shadow" />
              </div>
              <span className="mt-1.5 text-xs font-medium text-slate-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-tight text-center max-w-[80px] line-clamp-1">
                {title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Render All Open Windows */}
      {windows.map((win) => (
        <WindowFrame key={win.id} windowState={win} />
      ))}

      {/* Desktop Right Click Context Menu */}
      {contextMenu.visible && (
        <div
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed glass-panel rounded-xl py-1 text-xs text-slate-200 shadow-2xl z-50 w-52 animate-in fade-in zoom-in-95 duration-75 select-none"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              openApp("app-store");
              setContextMenu({ ...contextMenu, visible: false });
            }}
            className="cursor-pointer w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white flex items-center gap-2"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>ศูนย์ติดตั้งโมดูล (App Store)</span>
          </button>
          <button
            onClick={() => {
              openApp("settings");
              setContextMenu({ ...contextMenu, visible: false });
            }}
            className="cursor-pointer w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white flex items-center gap-2"
          >
            <Image className="w-3.5 h-3.5" />
            <span>เปลี่ยนภาพพื้นหลัง...</span>
          </button>
          <div className="border-t border-white/10 my-1" />
          <button
            onClick={() => {
              window.location.reload();
            }}
            className="cursor-pointer w-full text-left px-3 py-1.5 hover:bg-white/10 text-slate-300 flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>รีเฟรชหน้าจอ (Refresh)</span>
          </button>
        </div>
      )}
    </div>
  );
}
