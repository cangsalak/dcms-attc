import { AppModule } from "@/core/types/module";
import { TerminalApp } from "./components/TerminalApp";

export const terminalModule: AppModule = {
  id: "terminal",
  name: "System Terminal",
  nameTh: "เทอร์มินัลจัดการระบบ",
  description: "คอมมานด์ไลน์และเชลล์สำหรับตรวจสอบสถานะ Docker, Container และทรัพยากร",
  version: "0.9.4",
  category: "tools",
  iconName: "terminal",
  colorGradient: "from-slate-700 to-zinc-900",
  defaultSize: {
    width: 820,
    height: 520,
  },
  minSize: {
    width: 550,
    height: 380,
  },
  enabled: true,
  isSystemApp: false,
  desktopShortcut: true,
  dockShortcut: true,
  component: TerminalApp,
};
