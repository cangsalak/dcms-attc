import { AppModule } from "@/core/types/module";
import { UsersApp } from "./components/UsersApp";

export const usersModule: AppModule = {
  id: "users",
  name: "Users",
  nameTh: "จัดการผู้ใช้งาน",
  description: "ระบบจัดการผู้ใช้งาน สิทธิ์การเข้าถึง และฝ่ายงานต่างๆ ภายในองค์กร",
  version: "1.0.0",
  category: "business",
  iconName: "users",
  colorGradient: "from-blue-600 to-indigo-600",
  defaultSize: {
    width: 960,
    height: 600,
  },
  minSize: {
    width: 600,
    height: 450,
  },
  enabled: true,
  isSystemApp: false,
  desktopShortcut: true,
  dockShortcut: true,
  component: UsersApp,
};
