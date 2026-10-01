import { AppModule } from "@/core/types/module";
import { ControlPanelApp } from "./components/ControlPanelApp";

export const controlPanelModule: AppModule = {
  id: "control-panel",
  name: "Control Panel",
  nameTh: "แผงควบคุม",
  description: "ศูนย์กลางควบคุมระบบ Synology DSM Style จัดการการแชร์ไฟล์, ผู้ใช้, สิทธิ์, ความปลอดภัย, ฐานข้อมูล และการตั้งค่าระบบ",
  version: "1.0.0",
  category: "system",
  iconName: "control-panel",
  colorGradient: "from-blue-600 to-indigo-700",
  defaultSize: {
    width: 940,
    height: 620,
  },
  minSize: {
    width: 600,
    height: 450,
  },
  enabled: true,
  isSystemApp: true,
  desktopShortcut: true,
  dockShortcut: true,
  component: ControlPanelApp,
};
