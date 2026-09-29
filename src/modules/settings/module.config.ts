import { AppModule } from "@/core/types/module";
import { SettingsApp } from "./components/SettingsApp";

export const settingsModule: AppModule = {
  id: "settings",
  name: "Settings",
  nameTh: "การตั้งค่าระบบ",
  description: "ปรับแต่งภาพพื้นหลัง ธีม และตรวจสอบสถานะระบบ Docker",
  version: "1.0.0",
  category: "system",
  iconName: "settings",
  colorGradient: "from-slate-600 to-zinc-700",
  defaultSize: {
    width: 800,
    height: 520,
  },
  minSize: {
    width: 550,
    height: 400,
  },
  enabled: true,
  isSystemApp: true,
  desktopShortcut: true,
  dockShortcut: true,
  component: SettingsApp,
};
