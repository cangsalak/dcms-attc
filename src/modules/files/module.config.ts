import { AppModule } from "@/core/types/module";
import { FileManagerApp } from "./components/FileManagerApp";

export const filesModule: AppModule = {
  id: "files",
  name: "File Station",
  nameTh: "File Station (จัดการไฟล์)",
  description: "ศูนย์จัดการไฟล์และอัปโหลดสไตล์ Synology File Station รองรับการจัดระเบียบและแชร์ไฟล์",
  version: "1.0.0",
  category: "tools",
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
  isSystemApp: false,
  desktopShortcut: true,
  dockShortcut: true,
  component: FileManagerApp,
};
