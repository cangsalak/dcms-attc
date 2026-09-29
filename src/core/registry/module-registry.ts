import { AppModule } from "../types/module";
import { usersModule } from "@/modules/users/module.config";
import { appStoreModule } from "@/modules/app-store/module.config";
import { settingsModule } from "@/modules/settings/module.config";
import { filesModule } from "@/modules/files/module.config";
import { inventoryModule } from "@/modules/inventory/module.config";
import { billingModule } from "@/modules/billing/module.config";
import { auditLogsModule } from "@/modules/audit-logs/module.config";
import { terminalModule } from "@/modules/terminal/module.config";

/**
 * Built-in Core System Modules
 */
export const defaultModules: AppModule[] = [
  appStoreModule,
  usersModule,
  filesModule,
  settingsModule,
];

/**
 * All Optional Marketplace Modules (Ready to install via App Store)
 */
export const allMarketplaceModules: AppModule[] = [
  inventoryModule,
  billingModule,
  auditLogsModule,
  terminalModule,
];

/**
 * Complete registry map for dynamic instantiation and resolution
 */
export const allAvailableModulesMap: Record<string, AppModule> = {
  "app-store": appStoreModule,
  users: usersModule,
  files: filesModule,
  settings: settingsModule,
  inventory: inventoryModule,
  billing: billingModule,
  "audit-logs": auditLogsModule,
  terminal: terminalModule,
};

export function getModuleById(
  modules: AppModule[],
  id: string
): AppModule | undefined {
  // First search in passed modules
  const found = modules.find((m) => m.id === id);
  if (found) return found;
  // Fallback to all available modules map
  return allAvailableModulesMap[id];
}

export function getMarketplaceModule(id: string): AppModule | undefined {
  return allMarketplaceModules.find((m) => m.id === id);
}
