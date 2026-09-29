import { AppModule } from "@/core/types/module";
import { AppStoreApp } from "./components/AppStoreApp";

export const appStoreModule: AppModule = {
  id: "app-store",
  name: "App Store",
  nameTh: "ศูนย์รวมโมดูลและแอป",
  description: "จัดการ ติดตั้ง และถอนการติดตั้งโมดูลส่วนขยายต่างๆ ของระบบ",
  version: "1.0.0",
  category: "system",
  iconName: "app-store",
  colorGradient: "from-purple-600 to-pink-600",
  defaultSize: {
    width: 900,
    height: 580,
  },
  minSize: {
    width: 600,
    height: 450,
  },
  enabled: true,
  isSystemApp: true,
  desktopShortcut: true,
  dockShortcut: true,
  component: AppStoreApp,
};
