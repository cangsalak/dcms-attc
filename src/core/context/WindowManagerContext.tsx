"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { AppModule, WindowState } from "../types/module";
import { defaultModules, getModuleById } from "../registry/module-registry";
import { DateFormatConfig, defaultDateConfig } from "../lib/dateFormat";

interface WindowManagerContextType {
  modules: AppModule[];
  windows: WindowState[];
  activeWindowId: string | null;
  wallpaper: string;
  language: "th" | "en";
  dateFormatConfig: DateFormatConfig;
  isWidgetsOpen: boolean;
  isLauncherOpen: boolean;
  toggleWidgets: () => void;
  setLauncherOpen: (open: boolean) => void;
  minimizeAll: () => void;
  setWallpaper: (wp: string) => void;
  setLanguage: (lang: "th" | "en") => void;
  setDateFormatConfig: (config: Partial<DateFormatConfig>) => void;
  openApp: (appId: string) => void;
  closeWindow: (windowId: string) => void;
  minimizeWindow: (windowId: string) => void;
  maximizeWindow: (windowId: string) => void;
  focusWindow: (windowId: string) => void;
  updateWindowPosition: (windowId: string, position: { x: number; y: number }) => void;
  updateWindowSize: (windowId: string, size: { width: number; height: number }) => void;
  installDynamicModule: (module: AppModule) => void;
  uninstallModule: (moduleId: string) => void;
}

const WindowManagerContext = createContext<WindowManagerContextType | null>(null);

export function WindowManagerProvider({ children }: { children: React.ReactNode }) {
  const [modules, setModules] = useState<AppModule[]>(defaultModules);
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [wallpaper, setWallpaperState] = useState<string>("dcms-purple");
  const [language, setLanguageState] = useState<"th" | "en">("th");
  const [dateFormatConfig, setDateFormatState] = useState<DateFormatConfig>(defaultDateConfig);
  const [isWidgetsOpen, setIsWidgetsOpen] = useState<boolean>(true);
  const [isLauncherOpen, setIsLauncherOpen] = useState<boolean>(false);
  const [maxZIndex, setMaxZIndex] = useState<number>(100);

  const toggleWidgets = () => setIsWidgetsOpen((prev) => !prev);
  const setLauncherOpen = (open: boolean) => setIsLauncherOpen(open);

  const minimizeAll = useCallback(() => {
    setWindows((prev) => prev.map((w) => ({ ...w, isMinimized: true })));
    setActiveWindowId(null);
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("dcms_lang");
      if (savedLang === "th" || savedLang === "en") setLanguageState(savedLang);

      const savedWp = localStorage.getItem("dcms_wallpaper");
      if (savedWp) setWallpaperState(savedWp);

      const savedDate = localStorage.getItem("dcms_date_config");
      if (savedDate) setDateFormatState(JSON.parse(savedDate));
    } catch {
      // Ignore
    }
  }, []);

  const setLanguage = (lang: "th" | "en") => {
    setLanguageState(lang);
    try {
      localStorage.setItem("dcms_lang", lang);
    } catch {}
  };

  const setWallpaper = (wp: string) => {
    setWallpaperState(wp);
    try {
      localStorage.setItem("dcms_wallpaper", wp);
    } catch {}
  };

  const setDateFormatConfig = (partial: Partial<DateFormatConfig>) => {
    setDateFormatState((prev) => {
      const updated = { ...prev, ...partial };
      try {
        localStorage.setItem("dcms_date_config", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const focusWindow = useCallback((windowId: string) => {
    setActiveWindowId(windowId);
    setMaxZIndex((prev) => {
      const nextZ = prev + 1;
      setWindows((curr) =>
        curr.map((w) => (w.id === windowId ? { ...w, zIndex: nextZ, isMinimized: false } : w))
      );
      return nextZ;
    });
  }, []);

  const openApp = useCallback(
    (appId: string) => {
      const existingWindow = windows.find((w) => w.appId === appId);
      if (existingWindow) {
        focusWindow(existingWindow.id);
        return;
      }

      const appModule = getModuleById(modules, appId);
      if (!appModule) return;

      const newWindowId = `win-${appId}-${Date.now()}`;
      const nextZ = maxZIndex + 1;
      setMaxZIndex(nextZ);

      // Stagger initial position based on open window count
      const offset = (windows.length % 5) * 28 + 60;
      const initialPos = {
        x: Math.max(40, offset),
        y: Math.max(50, offset),
      };

      const newWindow: WindowState = {
        id: newWindowId,
        appId: appModule.id,
        title: language === "th" && appModule.nameTh ? appModule.nameTh : appModule.name,
        iconName: appModule.iconName,
        isMinimized: false,
        isMaximized: false,
        position: initialPos,
        size: {
          width: appModule.defaultSize.width,
          height: appModule.defaultSize.height,
        },
        zIndex: nextZ,
      };

      setWindows((prev) => [...prev, newWindow]);
      setActiveWindowId(newWindowId);
    },
    [windows, modules, maxZIndex, language, focusWindow]
  );

  const closeWindow = useCallback((windowId: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== windowId));
    setActiveWindowId((prev) => (prev === windowId ? null : prev));
  }, []);

  const minimizeWindow = useCallback((windowId: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === windowId ? { ...w, isMinimized: true } : w))
    );
    setActiveWindowId((prev) => (prev === windowId ? null : prev));
  }, []);

  const maximizeWindow = useCallback((windowId: string) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id !== windowId) return w;
        if (w.isMaximized) {
          // Restore
          return {
            ...w,
            isMaximized: false,
            position: w.previousBounds ? w.previousBounds.position : { x: 80, y: 80 },
            size: w.previousBounds ? w.previousBounds.size : { width: 800, height: 500 },
          };
        } else {
          // Maximize
          return {
            ...w,
            isMaximized: true,
            previousBounds: {
              position: w.position,
              size: w.size,
            },
            position: { x: 0, y: 32 }, // below top menu bar
            size: {
              width: window.innerWidth,
              height: window.innerHeight - 32 - 76, // top bar + dock clearance
            },
          };
        }
      })
    );
    focusWindow(windowId);
  }, [focusWindow]);

  const updateWindowPosition = useCallback(
    (windowId: string, position: { x: number; y: number }) => {
      setWindows((prev) =>
        prev.map((w) => (w.id === windowId ? { ...w, position, isMaximized: false } : w))
      );
    },
    []
  );

  const updateWindowSize = useCallback(
    (windowId: string, size: { width: number; height: number }) => {
      setWindows((prev) =>
        prev.map((w) => (w.id === windowId ? { ...w, size, isMaximized: false } : w))
      );
    },
    []
  );

  const installDynamicModule = useCallback((newModule: AppModule) => {
    setModules((prev) => {
      if (prev.some((m) => m.id === newModule.id)) return prev;
      return [...prev, newModule];
    });
  }, []);

  const uninstallModule = useCallback(
    (moduleId: string) => {
      setWindows((prev) => prev.filter((w) => w.appId !== moduleId));
      setModules((prev) => prev.filter((m) => m.id !== moduleId || m.isSystemApp));
    },
    []
  );

  return (
    <WindowManagerContext.Provider
      value={{
        modules,
        windows,
        activeWindowId,
        wallpaper,
        language,
        dateFormatConfig,
        isWidgetsOpen,
        isLauncherOpen,
        toggleWidgets,
        setLauncherOpen,
        minimizeAll,
        setWallpaper,
        setLanguage,
        setDateFormatConfig,
        openApp,
        closeWindow,
        minimizeWindow,
        maximizeWindow,
        focusWindow,
        updateWindowPosition,
        updateWindowSize,
        installDynamicModule,
        uninstallModule,
      }}
    >
      {children}
    </WindowManagerContext.Provider>
  );
}

export function useWindowManager() {
  const context = useContext(WindowManagerContext);
  if (!context) {
    throw new Error("useWindowManager must be used within WindowManagerProvider");
  }
  return context;
}
