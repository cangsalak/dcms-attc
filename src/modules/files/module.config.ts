import { AppModule } from "@/core/types/module";
import { FileManagerApp } from "./components/FileManagerApp";

export const filesModule: AppModule = {
  id: "files",
  name: "File Manager",
  nameTh: "จัดการไฟล์ & อัปโหลด",
  description: "ระบบอัปโหลด จัดเก็บ ดาวน์โหลด และจัดการไฟล์บน Server รองรับ Drag & Drop",
  version: "1.0.0",
  category: "tools",
  iconName: "folder",
  colorGradient: "from-cyan-600 to-blue-600",
  defaultSize: {
    width: 980,
    height: 620,
  },
  minSize: {
    width: 650,
    height: 450,
  },
  enabled: true,
  isSystemApp: false,
  desktopShortcut: true,
  dockShortcut: true,
  component: FileManagerApp,
};
