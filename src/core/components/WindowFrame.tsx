"use client";

import React, { useState, useRef, useEffect } from "react";
import { WindowState } from "../types/module";
import { useWindowManager } from "../context/WindowManagerContext";
import { getModuleById } from "../registry/module-registry";
import { DynamicIcon } from "./IconResolver";
import { Minus, Square, X, Maximize2 } from "lucide-react";

export function WindowFrame({ windowState }: { windowState: WindowState }) {
  const {
    modules,
    activeWindowId,
    focusWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    updateWindowPosition,
    updateWindowSize,
  } = useWindowManager();

  const isFocused = activeWindowId === windowState.id;
  const appModule = getModuleById(modules, windowState.appId);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
  });

  // Resizing state
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef<{
    startX: number;
    startY: number;
    initW: number;
    initH: number;
  }>({
    startX: 0,
    startY: 0,
    initW: 0,
    initH: 0,
  });

  // Drag handler
  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    // Only drag with left click and when not clicking window buttons
    if (e.button !== 0 || windowState.isMaximized) return;
    focusWindow(windowState.id);
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: windowState.position.x,
      initY: windowState.position.y,
    };
    e.preventDefault();
  };

  // Resize handler
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || windowState.isMaximized) return;
    focusWindow(windowState.id);
    setIsResizing(true);
    resizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initW: windowState.size.width,
      initH: windowState.size.height,
    };
    e.stopPropagation();
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - dragStartRef.current.startX;
        const dy = e.clientY - dragStartRef.current.startY;
        const newX = Math.max(0, Math.min(window.innerWidth - 100, dragStartRef.current.initX + dx));
        const newY = Math.max(28, Math.min(window.innerHeight - 80, dragStartRef.current.initY + dy));
        updateWindowPosition(windowState.id, { x: newX, y: newY });
      } else if (isResizing) {
        const dx = e.clientX - resizeStartRef.current.startX;
        const dy = e.clientY - resizeStartRef.current.startY;
        const minW = appModule?.minSize?.width || 450;
        const minH = appModule?.minSize?.height || 350;
        const newW = Math.max(minW, Math.min(window.innerWidth - 20, resizeStartRef.current.initW + dx));
        const newH = Math.max(minH, Math.min(window.innerHeight - 60, resizeStartRef.current.initH + dy));
        updateWindowSize(windowState.id, { width: newW, height: newH });
      }
    };

    const handleMouseUp = () => {
      if (isDragging) setIsDragging(false);
      if (isResizing) setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing, windowState.id, appModule, updateWindowPosition, updateWindowSize]);

  if (windowState.isMinimized) {
    return null;
  }

  const AppComponent = appModule?.component;

  return (
    <div
      onMouseDown={() => focusWindow(windowState.id)}
      style={{
        transform: `translate3d(${windowState.position.x}px, ${windowState.position.y}px, 0)`,
        width: `${windowState.size.width}px`,
        height: `${windowState.size.height}px`,
        zIndex: windowState.zIndex,
      }}
      className={`absolute top-0 left-0 rounded-2xl flex flex-col overflow-hidden shadow-2xl transition-[shadow,border] duration-150 ${
        isFocused
          ? "border border-white/25 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] ring-1 ring-white/10"
          : "border border-white/10 shadow-[0_15px_35px_-10px_rgba(0,0,0,0.6)] opacity-95"
      }`}
    >
      {/* Window Title Bar */}
      <div
        onMouseDown={handleHeaderMouseDown}
        onDoubleClick={() => maximizeWindow(windowState.id)}
        className="h-10 bg-[#16112a]/95 backdrop-blur-xl border-b border-white/10 px-4 flex items-center justify-between select-none cursor-move shrink-0"
      >
        {/* macOS style traffic light window controls */}
        <div className="flex items-center gap-2">
          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeWindow(windowState.id);
            }}
            className="group w-3 h-3 rounded-full bg-[#ff5f56] hover:brightness-110 flex items-center justify-center transition-all cursor-pointer shadow-sm shadow-red-500/50"
            title="ปิดหน้าต่าง (Close)"
          >
            <X className="w-2 h-2 text-[#4c0000] opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          {/* Minimize button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              minimizeWindow(windowState.id);
            }}
            className="group w-3 h-3 rounded-full bg-[#ffbd2e] hover:brightness-110 flex items-center justify-center transition-all cursor-pointer shadow-sm shadow-yellow-500/50"
            title="ย่อหน้าต่างลง Dock (Minimize)"
          >
            <Minus className="w-2 h-2 text-[#5a4200] opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          {/* Maximize / Restore button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              maximizeWindow(windowState.id);
            }}
            className="group w-3 h-3 rounded-full bg-[#27c93f] hover:brightness-110 flex items-center justify-center transition-all cursor-pointer shadow-sm shadow-green-500/50"
            title={windowState.isMaximized ? "คืนขนาดเดิม (Restore)" : "ขยายเต็มจอ (Maximize)"}
          >
            <Maximize2 className="w-2 h-2 text-[#004d0f] opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>

        {/* Window Title */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
          <DynamicIcon name={windowState.iconName} className="w-3.5 h-3.5 text-indigo-400" />
          <span>{windowState.title}</span>
        </div>

        {/* Placeholder balance on right */}
        <div className="w-12 flex justify-end">
          <span className="text-[10px] text-slate-500 font-mono">
            {appModule?.version ? `v${appModule.version}` : ""}
          </span>
        </div>
      </div>

      {/* Window Body (Module Content) */}
      <div className="flex-1 bg-[#120e24] overflow-hidden relative">
        {AppComponent ? (
          <AppComponent windowId={windowState.id} />
        ) : (
          <div className="p-8 text-center text-slate-400 text-sm">
            ไม่พบโมดูลที่ติดตั้ง
          </div>
        )}
      </div>

      {/* Resize Handle (Bottom Right Corner) */}
      {!windowState.isMaximized && (
        <div
          onMouseDown={handleResizeMouseDown}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-end justify-end p-0.5 z-20 group"
        >
          <div className="w-2 h-2 border-r-2 border-b-2 border-white/20 group-hover:border-indigo-400 transition-colors" />
        </div>
      )}
    </div>
  );
}
