import { AppModule } from "@/core/types/module";
import { ProfileApp } from "./components/ProfileApp";

export const profileModule: AppModule = {
  id: "profile",
  name: "Personal Profile",
  nameTh: "โปรไฟล์ส่วนตัว & บัญชี",
  description: "จัดการข้อมูลส่วนตัว รูปภาพประจำตัว และเปลี่ยนรหัสผ่านเข้าใช้งานระบบ DCMS",
  version: "1.0.0",
  category: "system",
  iconName: "user",
  colorGradient: "from-indigo-600 to-purple-600",
  defaultSize: {
    width: 680,
    height: 580,
  },
  minSize: {
    width: 500,
    height: 450,
  },
  enabled: true,
  isSystemApp: true,
  desktopShortcut: false,
  dockShortcut: false,
  component: ProfileApp,
};
