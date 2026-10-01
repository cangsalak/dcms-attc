import { AppModule } from "@/core/types/module";
import { FileManagerApp } from "./components/FileManagerApp";

export const filesModule: AppModule = {
  id: "files",
  name: "File Station",
  nameTh: "File Station (จัดการไฟล์)",
  description: "ศูนย์จัดการไฟล์และอัปโหลดสไตล์ Synology File Station พร้อมระบบกำหนดสิทธิ์เข้าถึงโฟลเดอร์",
  version: "1.0.0",
  category: "system",
  iconName: "folder",
  colorGradient: "from-blue-600 to-cyan-500",
  defaultSize: {
    width: 1020,
    height: 640,
  },
  minSize: {
    width: 700,
    height: 480,
  },
  enabled: true,
  isSystemApp: true,
  desktopShortcut: true,
  dockShortcut: true,
  component: FileManagerApp,
};
