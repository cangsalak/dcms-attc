import React from "react";

export interface AppModule {
  id: string;
  name: string;
  nameTh?: string;
  description: string;
  version: string;
  category: "system" | "business" | "tools" | "custom";
  iconName: string; // Identifier for icon lookup
  colorGradient: string; // e.g. "from-blue-600 to-indigo-600"
  defaultSize: {
    width: number;
    height: number;
  };
  minSize?: {
    width: number;
    height: number;
  };
  enabled: boolean;
  isSystemApp?: boolean; // Cannot be uninstalled if true
  desktopShortcut?: boolean;
  dockShortcut?: boolean;
  entryType?: "internal" | "external_url";
  url?: string; // For external micro-frontend / web apps
  author?: string;
  component: React.ComponentType<{ windowId: string; params?: any }>;
}

export interface WindowState {
  id: string;
  appId: string;
  title: string;
  iconName: string;
  isMinimized: boolean;
  isMaximized: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  previousBounds?: {
    position: { x: number; y: number };
    size: { width: number; height: number };
  };
  zIndex: number;
  params?: Record<string, any>;
}
