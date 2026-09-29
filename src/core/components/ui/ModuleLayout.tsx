"use client";

import React from "react";
import { Search, Grid, List, RefreshCw, X, LucideIcon } from "lucide-react";

/**
 * Standard DCMS Module Container
 */
export function ModuleContainer({
  children,
  className = "",
  onContextMenu,
}: {
  children: React.ReactNode;
  className?: string;
  onContextMenu?: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      onContextMenu={onContextMenu}
      className={`flex flex-col h-full bg-[#120e24] text-slate-100 select-text font-sans relative ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Standard DCMS Module Toolbar
 */
export function ModuleToolbar({
  leftActions,
  selectedActions,
  search,
  onSearchChange,
  searchPlaceholder = "ค้นหา...",
  viewMode,
  onViewModeChange,
  onRefresh,
  isRefreshing = false,
}: {
  leftActions?: React.ReactNode;
  selectedActions?: React.ReactNode;
  search?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  viewMode?: "grid" | "list";
  onViewModeChange?: (mode: "grid" | "list") => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}) {
  return (
    <div className="px-4 py-2 border-b border-white/10 bg-white/[0.03] flex items-center justify-between gap-3 text-xs shrink-0 flex-wrap">
      {/* Left Action Buttons */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {leftActions}

        {/* Divider if selected actions exist */}
        {selectedActions && (
          <>
            <div className="h-5 w-px bg-white/10 mx-1" />
            <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
              {selectedActions}
            </div>
          </>
        )}
      </div>

      {/* Right Controls: Search, View Mode, Refresh */}
      <div className="flex items-center gap-2">
        {onSearchChange !== undefined && (
          <div className="relative w-44">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search || ""}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg bg-black/30 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        )}

        {viewMode !== undefined && onViewModeChange && (
          <div className="flex p-0.5 rounded-lg bg-black/30 border border-white/10">
            <button
              onClick={() => onViewModeChange("grid")}
              className={`p-1 rounded cursor-pointer transition-colors ${
                viewMode === "grid" ? "bg-white/20 text-white" : "text-slate-400 hover:text-white"
              }`}
              title="ตารางไอคอน (Grid View)"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onViewModeChange("list")}
              className={`p-1 rounded cursor-pointer transition-colors ${
                viewMode === "list" ? "bg-white/20 text-white" : "text-slate-400 hover:text-white"
              }`}
              title="รายการ (List View)"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="cursor-pointer p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Standard DCMS Button
 */
export function ModuleButton({
  children,
  onClick,
  variant = "secondary",
  icon: Icon,
  disabled = false,
  title,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "warning" | "ghost";
  icon?: LucideIcon;
  disabled?: boolean;
  title?: string;
  className?: string;
}) {
  const base =
    "cursor-pointer px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none";

  const variants = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30",
    secondary: "bg-white/10 hover:bg-white/15 text-white border border-white/15",
    danger: "bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30",
    warning: "bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30",
    ghost: "hover:bg-white/10 text-slate-300 hover:text-white",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{children}</span>
    </button>
  );
}

/**
 * Standard DCMS Module Context Menu (Right Click)
 */
export function ModuleContextMenu({
  x,
  y,
  onClose,
  items,
}: {
  x: number;
  y: number;
  onClose: () => void;
  items: Array<
    | {
        label: string;
        icon?: LucideIcon;
        onClick: () => void;
        danger?: boolean;
        divider?: false;
      }
    | { divider: true }
  >;
}) {
  // Prevent menu from overflowing viewport
  const style: React.CSSProperties = {
    top: Math.min(y, window.innerHeight - 250),
    left: Math.min(x, window.innerWidth - 200),
  };

  return (
    <>
      <div className="fixed inset-0 z-50 cursor-default" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <div
        style={style}
        className="fixed z-50 w-48 rounded-xl bg-[#1b1535]/95 backdrop-blur-xl border border-white/20 shadow-2xl p-1 text-xs animate-in fade-in zoom-in-95 duration-100"
      >
        {items.map((item, idx) => {
          if (item.divider) {
            return <div key={idx} className="my-1 border-t border-white/10" />;
          }

          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => {
                item.onClick();
                onClose();
              }}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                item.danger
                  ? "text-rose-400 hover:bg-rose-500/20 hover:text-rose-300"
                  : "text-slate-200 hover:bg-white/10 hover:text-white"
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

/**
 * Standard DCMS Module Footer Status Bar
 */
export function ModuleFooter({
  leftContent,
  selectedText,
  rightStatus = "Online",
}: {
  leftContent: React.ReactNode;
  selectedText?: string | null;
  rightStatus?: string;
}) {
  return (
    <div className="px-4 py-2 border-t border-white/10 bg-black/20 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
      <div className="flex items-center gap-2">
        <span>{leftContent}</span>
        {selectedText && (
          <span className="text-cyan-300 font-medium">({selectedText})</span>
        )}
      </div>
      <div className="flex items-center gap-3 font-medium">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400">{rightStatus}</span>
        </span>
      </div>
    </div>
  );
}

/**
 * Standard DCMS Module Dialog / Modal
 */
export function ModuleModal({
  isOpen,
  onClose,
  title,
  icon: Icon,
  subtitle,
  children,
  maxWidth = "max-w-md",
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: LucideIcon;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div
        className={`w-full ${maxWidth} bg-[#181330] border border-white/20 rounded-2xl p-5 shadow-2xl flex flex-col`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-cyan-400 shrink-0" />}
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">{title}</h3>
              {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="pt-3">{children}</div>
      </div>
    </div>
  );
}
