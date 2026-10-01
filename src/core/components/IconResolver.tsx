"use client";

import React from "react";
import {
  Users,
  LayoutGrid,
  Settings,
  FolderOpen,
  Terminal,
  ShoppingBag,
  FileText,
  Shield,
  Activity,
  Boxes,
  Database,
  HelpCircle,
  SlidersHorizontal,
  Sliders,
  LucideProps,
} from "lucide-react";

export const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  users: Users,
  "app-store": LayoutGrid,
  settings: Settings,
  "control-panel": SlidersHorizontal,
  sliders: Sliders,
  folder: FolderOpen,
  terminal: Terminal,
  store: ShoppingBag,
  document: FileText,
  security: Shield,
  analytics: Activity,
  packages: Boxes,
  database: Database,
  help: HelpCircle,
};

export function DynamicIcon({
  name,
  className = "w-5 h-5",
}: {
  name: string;
  className?: string;
}) {
  const IconComponent = iconMap[name] || HelpCircle;
  return <IconComponent className={className} />;
}
