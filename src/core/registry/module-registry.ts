import React from "react";
import { AppModule } from "../types/module";
import { usersModule } from "@/modules/users/module.config";
import { appStoreModule } from "@/modules/app-store/module.config";
import { settingsModule } from "@/modules/settings/module.config";
import { filesModule } from "@/modules/files/module.config";
import { terminalModule } from "@/modules/terminal/module.config";
import { ExternalAppRunner } from "../components/ExternalAppRunner";
import { internalExtensionModulesMap } from "@/modules";

/**
 * Built-in Core System Modules (Mandatory OS System Apps - Default & No install needed)
 */
export const defaultModules: AppModule[] = [
  filesModule,
  usersModule,
  terminalModule,
  appStoreModule,
  settingsModule,
];

/**
 * Dynamic In-Memory Plugin Registry
 * เก็บโมดูลที่ลงทะเบียนขณะรันไทม์ ทั้งโมดูลที่ผู้อื่นเขียน และ External Web Apps
 */
const dynamicRegistry = new Map<string, AppModule>();

/**
 * ฟังก์ชันสร้าง AppModule สำหรับ 3rd-Party External Web App (Micro-frontend via URL)
 * ทำให้ผู้อื่นสามารถเขียน App ด้วยภาษา/เฟรมเวิร์กใดก็ได้ (Vue, React, Svelte, Go, Python, PHP)
 * และนำมาเปิดบนหน้าต่าง DCMS ได้อย่างไร้รอยต่อ
 */
export function createExternalAppModule(config: {
  id: string;
  name: string;
  nameTh?: string;
  description: string;
  version?: string;
  category?: "system" | "business" | "tools" | "custom";
  iconName?: string;
  colorGradient?: string;
  url: string;
  author?: string;
  defaultSize?: { width: number; height: number };
  minSize?: { width: number; height: number };
}): AppModule {
  const externalComponent: React.ComponentType<{ windowId: string }> = ({
    windowId,
  }) =>
    React.createElement(ExternalAppRunner, {
      windowId,
      url: config.url,
      title: config.name,
      iconName: config.iconName,
    });

  return {
    id: config.id,
    name: config.name,
    nameTh: config.nameTh || config.name,
    description: config.description,
    version: config.version || "1.0.0",
    category: config.category || "custom",
    iconName: config.iconName || "store",
    colorGradient: config.colorGradient || "from-blue-600 to-indigo-600",
    defaultSize: config.defaultSize || { width: 900, height: 600 },
    minSize: config.minSize || { width: 500, height: 400 },
    enabled: true,
    isSystemApp: false,
    desktopShortcut: true,
    dockShortcut: true,
    entryType: "external_url",
    url: config.url,
    author: config.author || "Third-party Developer",
    component: externalComponent,
  };
}

/**
 * ลงทะเบียนโมดูลเข้าสู่ Dynamic Registry
 */
export function registerDynamicModule(module: AppModule): void {
  dynamicRegistry.set(module.id, module);
}

/**
 * ถอดโมดูลออกจาก Dynamic Registry
 */
export function unregisterDynamicModule(moduleId: string): void {
  dynamicRegistry.delete(moduleId);
}

/**
 * ค้นหาโมดูลตาม ID โดยรองรับทั้ง:
 * 1. โมดูลใน state ปัจจุบัน
 * 2. Dynamic Registry (โมดูลภายนอกที่เพิ่งลงทะเบียน)
 * 3. Internal Extension Modules (โฟลเดอร์ src/modules/* ที่แยกไว้)
 */
export function getModuleById(
  modules: AppModule[],
  id: string
): AppModule | undefined {
  // 1. Search in passed active modules
  const found = modules.find((m) => m.id === id);
  if (found) return found;

  // 2. Search in Dynamic Plugin Registry
  if (dynamicRegistry.has(id)) {
    return dynamicRegistry.get(id);
  }

  // 3. Search in Decoupled Internal Modules
  if (internalExtensionModulesMap[id]) {
    return internalExtensionModulesMap[id];
  }

  return undefined;
}
