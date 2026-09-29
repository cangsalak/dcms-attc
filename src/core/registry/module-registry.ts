import { AppModule } from "../types/module";
import { usersModule } from "@/modules/users/module.config";
import { appStoreModule } from "@/modules/app-store/module.config";
import { settingsModule } from "@/modules/settings/module.config";

/**
 * Core Module Registry
 * รวมโมดูลที่ติดตั้งไว้เริ่มต้นของระบบ
 * เมื่อมีการพัฒนาโมดูลใหม่ แค่ import และใส่ใน array นี้ (หรือติดตั้งผ่าน App Store)
 */
export const defaultModules: AppModule[] = [
  appStoreModule,
  usersModule,
  settingsModule,
];

export function getModuleById(
  modules: AppModule[],
  id: string
): AppModule | undefined {
  return modules.find((m) => m.id === id);
}
