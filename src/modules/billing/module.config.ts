import { AppModule } from "@/core/types/module";
import { BillingApp } from "./components/BillingApp";

export const billingModule: AppModule = {
  id: "billing",
  name: "Billing & Invoices",
  nameTh: "ระบบใบเสร็จและใบแจ้งหนี้",
  description: "ออกใบเสนอราคา ใบเสร็จรับเงิน ใบกำกับภาษี และติดตามยอดค้างชำระ",
  version: "2.0.1",
  category: "business",
  iconName: "document",
  colorGradient: "from-emerald-500 to-teal-600",
  defaultSize: {
    width: 980,
    height: 620,
  },
  minSize: {
    width: 700,
    height: 480,
  },
  enabled: true,
  isSystemApp: false,
  desktopShortcut: true,
  dockShortcut: true,
  component: BillingApp,
};
