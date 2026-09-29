import { AppModule } from "@/core/types/module";
import { AuditLogsApp } from "./components/AuditLogsApp";

export const auditLogsModule: AppModule = {
  id: "audit-logs",
  name: "Audit & Security Logs",
  nameTh: "ประวัติกิจกรรมและความปลอดภัย",
  description: "เก็บบันทึกประวัติการเข้าใช้งาน (Audit Trail) ตามมาตรฐานความปลอดภัย",
  version: "1.0.5",
  category: "tools",
  iconName: "security",
  colorGradient: "from-rose-500 to-red-600",
  defaultSize: {
    width: 960,
    height: 580,
  },
  minSize: {
    width: 700,
    height: 450,
  },
  enabled: true,
  isSystemApp: false,
  desktopShortcut: true,
  dockShortcut: true,
  component: AuditLogsApp,
};
