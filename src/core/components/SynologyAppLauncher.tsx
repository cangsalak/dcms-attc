"use client";

import React, { useState, useEffect } from "react";
import { Search, X, Grid, Sparkles, FolderOpen, Users, Settings, Boxes } from "lucide-react";
import { useWindowManager } from "../context/WindowManagerContext";
import { DynamicIcon } from "./IconResolver";

export function SynologyAppLauncher() {
  const { isLauncherOpen, setLauncherOpen, modules, openApp, language } = useWindowManager();
  const [search, setSearch] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isLauncherOpen) {
        setLauncherOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLauncherOpen, setLauncherOpen]);

  if (!isLauncherOpen) return null;

  const filtered = modules.filter(
    (m) =>
      m.enabled &&
      (m.name.toLowerCase().includes(search.toLowerCase()) ||
        (m.nameTh && m.nameTh.toLowerCase().includes(search.toLowerCase())) ||
        m.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div
      onClick={() => setLauncherOpen(false)}
      className="fixed inset-0 z-50 bg-[#0c081cd9] backdrop-blur-2xl flex flex-col items-center p-8 animate-in fade-in zoom-in-95 duration-150 select-none"
    >
      {/* Top Search Bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md relative mb-12"
      >
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          autoFocus
          type="text"
          placeholder={
            language === "th"
              ? "ค้นหาแอปพลิเคชันหรือแพ็กเกจ..."
              : "Search applications or packages..."
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-10 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 text-sm shadow-2xl transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="cursor-pointer absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Synology Grid of Apps */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 justify-items-center"
      >
        {filtered.map((mod) => {
          const title = language === "th" && mod.nameTh ? mod.nameTh : mod.name;

          return (
            <div
              key={mod.id}
              onClick={() => {
                openApp(mod.id);
                setLauncherOpen(false);
              }}
              className="group cursor-pointer flex flex-col items-center p-3 rounded-2xl hover:bg-white/10 transition-all active:scale-95 text-center w-32"
            >
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${mod.colorGradient} flex items-center justify-center text-white shadow-xl shadow-black/50 group-hover:scale-110 group-hover:shadow-indigo-500/30 transition-all duration-200 mb-2.5`}
              >
                <DynamicIcon name={mod.iconName} className="w-8 h-8 text-white drop-shadow" />
              </div>
              <span className="text-xs font-semibold text-white tracking-tight leading-tight line-clamp-1">
                {title}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                {mod.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Bottom Hint */}
      <div className="mt-auto text-xs text-slate-500 flex items-center gap-2">
        <span>กด <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono text-[10px]">Esc</kbd> หรือคลิกที่ว่างเพื่อปิด</span>
      </div>
    </div>
  );
}
