import { AppModule } from "@/core/types/module";
import { inventoryModule } from "./inventory/module.config";
import { billingModule } from "./billing/module.config";
import { auditLogsModule } from "./audit-logs/module.config";
import { terminalModule } from "./terminal/module.config";
import { controlPanelModule } from "./control-panel/module.config";
import { profileModule } from "./profile/module.config";

/**
 * Decoupled Internal Modules Registry
 * นักพัฒนาภายนอกหรือผู้พัฒนาโมดูล สามารถนำโมดูล React ใหม่ที่เขียนขึ้นมาลงทะเบียนไว้ที่นี่
 * โดยระบบ Core จะเรียกใช้งานผ่าน Plugin Registry กลาง โดยไม่ต้องแก้โค้ดใน src/core/
 */
export const internalExtensionModules: AppModule[] = [
  inventoryModule,
  billingModule,
  auditLogsModule,
];

export const internalExtensionModulesMap: Record<string, AppModule> = {
  inventory: inventoryModule,
  billing: billingModule,
  "audit-logs": auditLogsModule,
  terminal: terminalModule,
  "control-panel": controlPanelModule,
  profile: profileModule,
  settings: controlPanelModule,
};

/**
 * ฟังก์ชันสำหรับค้นหาโมดูลภายในตาม ID
 */
export function getInternalModule(id: string): AppModule | undefined {
  return internalExtensionModulesMap[id];
}
