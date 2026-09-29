import { AppModule } from "@/core/types/module";
import { InventoryApp } from "./components/InventoryApp";

export const inventoryModule: AppModule = {
  id: "inventory",
  name: "Inventory & Stock",
  nameTh: "ระบบจัดการสต็อกและคลังสินค้า",
  description: "ติดตามสินค้าคงคลัง ล็อตสินค้า การรับเข้า-เบิกออก และแจ้งเตือนสต็อกใกล้หมด",
  version: "1.2.0",
  category: "business",
  iconName: "packages",
  colorGradient: "from-amber-500 to-orange-600",
  defaultSize: {
    width: 960,
    height: 600,
  },
  minSize: {
    width: 650,
    height: 450,
  },
  enabled: true,
  isSystemApp: false,
  desktopShortcut: true,
  dockShortcut: true,
  component: InventoryApp,
};
