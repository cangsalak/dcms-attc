import { AppModule } from "@/core/types/module";
import { TerminalApp } from "./components/TerminalApp";

export const terminalModule: AppModule = {
  id: "terminal",
  name: "System Terminal",
  nameTh: "เทอร์มินัลจัดการระบบ",
  description: "คอนโซลคอมมานด์ไลน์และเชลล์สำหรับตรวจสอบสถานะระบบ ตรวจสอบความปลอดภัย PM2 และทรัพยากร",
  version: "1.0.0",
  category: "system",
  iconName: "terminal",
  colorGradient: "from-slate-700 to-zinc-900",
  defaultSize: {
    width: 860,
    height: 540,
  },
  minSize: {
    width: 550,
    height: 380,
  },
  enabled: true,
  isSystemApp: true,
  desktopShortcut: false,
  dockShortcut: true,
  component: TerminalApp,
};
