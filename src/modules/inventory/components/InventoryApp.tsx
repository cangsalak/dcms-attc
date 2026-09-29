"use client";

import React, { useState, useEffect } from "react";
import {
  Boxes,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  ArrowUpDown,
  TrendingDown,
  PackageCheck,
  Search,
  Filter,
  Layers,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import {
  ModuleContainer,
  ModuleToolbar,
  ModuleButton,
  ModuleContextMenu,
  ModuleFooter,
  ModuleModal,
} from "@/core/components/ui/ModuleLayout";

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  minStock: number;
  unit: string;
  price: number;
  updatedAt: string;
}

const initialProducts: InventoryItem[] = [
  {
    id: "inv-001",
    sku: "NET-CAT6-305M",
    name: "สาย LAN Cat6 UTP 305m (Indoor)",
    category: "อุปกรณ์เครือข่าย",
    quantity: 14,
    minStock: 5,
    unit: "ม้วน",
    price: 3450,
    updatedAt: "2026-09-28",
  },
  {
    id: "inv-002",
    sku: "SW-POE-24G",
    name: "Switch PoE+ 24-Port Gigabit Managed",
    category: "อุปกรณ์เครือข่าย",
    quantity: 3,
    minStock: 4,
    unit: "ตัว",
    price: 14900,
    updatedAt: "2026-09-26",
  },
  {
    id: "inv-003",
    sku: "RAM-DDR5-32G",
    name: "RAM Server DDR5 32GB 5600MHz ECC",
    category: "ฮาร์ดแวร์",
    quantity: 18,
    minStock: 6,
    unit: "แผง",
    price: 5200,
    updatedAt: "2026-09-27",
  },
  {
    id: "inv-004",
    sku: "SSD-NVME-1TB",
    name: "Enterprise SSD NVMe M.2 1TB Gen4",
    category: "ฮาร์ดแวร์",
    quantity: 2,
    minStock: 5,
    unit: "ตัว",
    price: 4600,
    updatedAt: "2026-09-25",
  },
  {
    id: "inv-005",
    sku: "CAM-IP-4MP",
    name: "กล้องวงจรปิด IP Camera 4MP IR 30m PoE",
    category: "ระบบกล้อง CCTV",
    quantity: 25,
    minStock: 8,
    unit: "ตัว",
    price: 2150,
    updatedAt: "2026-09-28",
  },
  {
    id: "inv-006",
    sku: "UPS-1000VA",
    name: "เครื่องสำรองไฟ UPS 1000VA / 600W LCD",
    category: "อุปกรณ์สำรองไฟ",
    quantity: 0,
    minStock: 3,
    unit: "เครื่อง",
    price: 3890,
    updatedAt: "2026-09-22",
  },
];

const categories = [
  "ทั้งหมด",
  "อุปกรณ์เครือข่าย",
  "ฮาร์ดแวร์",
  "ระบบกล้อง CCTV",
  "อุปกรณ์สำรองไฟ",
];

export function InventoryApp({ windowId }: { windowId: string }) {
  const [items, setItems] = useState<InventoryItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dcms_inventory_items");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return initialProducts;
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ทั้งหมด");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    item: InventoryItem;
  } | null>(null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState<number>(1);
  const [adjustType, setAdjustType] = useState<"in" | "out">("in");

  // Form state
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    category: "อุปกรณ์เครือข่าย",
    quantity: 1,
    minStock: 5,
    unit: "ชิ้น",
    price: 0,
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("dcms_inventory_items", JSON.stringify(items));
    } catch {}
  }, [items]);

  const selectedItem = items.find((i) => i.id === selectedId);

  // Statistics
  const totalStockCount = items.reduce((acc, curr) => acc + curr.quantity, 0);
  const lowStockCount = items.filter(
    (i) => i.quantity > 0 && i.quantity <= i.minStock
  ).length;
  const outOfStockCount = items.filter((i) => i.quantity === 0).length;
  const totalValue = items.reduce(
    (acc, curr) => acc + curr.quantity * curr.price,
    0
  );

  const filteredItems = items.filter((item) => {
    const matchesCategory =
      selectedCategory === "ทั้งหมด" || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sku.trim()) return;

    const newItem: InventoryItem = {
      id: `inv-${Date.now().toString().slice(-4)}`,
      sku: formData.sku.toUpperCase(),
      name: formData.name,
      category: formData.category,
      quantity: Number(formData.quantity) || 0,
      minStock: Number(formData.minStock) || 0,
      unit: formData.unit,
      price: Number(formData.price) || 0,
      updatedAt: new Date().toISOString().split("T")[0],
    };

    setItems((prev) => [newItem, ...prev]);
    setIsAddModalOpen(false);
    setFormData({
      sku: "",
      name: "",
      category: "อุปกรณ์เครือข่าย",
      quantity: 1,
      minStock: 5,
      unit: "ชิ้น",
      price: 0,
    });
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleAdjustStock = () => {
    if (!selectedItem) return;
    const change = adjustType === "in" ? adjustAmount : -adjustAmount;
    const nextQty = Math.max(0, selectedItem.quantity + change);

    setItems((prev) =>
      prev.map((i) =>
        i.id === selectedItem.id
          ? {
              ...i,
              quantity: nextQty,
              updatedAt: new Date().toISOString().split("T")[0],
            }
          : i
      )
    );
    setIsAdjustModalOpen(false);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <ModuleContainer>
      {/* Module Toolbar */}
      <ModuleToolbar
        leftActions={
          <>
            <ModuleButton
              onClick={() => setIsAddModalOpen(true)}
              variant="primary"
              icon={Plus}
            >
              เพิ่มสินค้าใหม่
            </ModuleButton>
          </>
        }
        selectedActions={
          selectedItem && (
            <>
              <ModuleButton
                onClick={() => {
                  setAdjustAmount(1);
                  setIsAdjustModalOpen(true);
                }}
                variant="secondary"
                icon={ArrowUpDown}
              >
                ปรับปรุงสต็อก ({selectedItem.sku})
              </ModuleButton>
              <ModuleButton
                onClick={() => handleDeleteItem(selectedItem.id)}
                variant="danger"
                icon={Trash2}
              >
                ลบรายการ
              </ModuleButton>
            </>
          )
        }
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="ค้นหา SKU หรือชื่อสินค้า..."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={() => {}}
      />

      {/* KPI Status Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 py-3 bg-white/[0.02] border-b border-white/5 shrink-0">
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">จำนวนสินค้าทั้งหมด</div>
            <div className="text-base font-bold text-white">
              {items.length}{" "}
              <span className="text-xs font-normal text-slate-400">รายการ</span>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">ยอดคงเหลือรวม</div>
            <div className="text-base font-bold text-white">
              {totalStockCount}{" "}
              <span className="text-xs font-normal text-slate-400">หน่วย</span>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">ใกล้หมด / สินค้าหมด</div>
            <div className="text-base font-bold text-amber-300">
              {lowStockCount + outOfStockCount}{" "}
              <span className="text-xs font-normal text-slate-400">รายการ</span>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">มูลค่าสต็อกรวม</div>
            <div className="text-base font-bold text-cyan-300">
              {formatCurrency(totalValue)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Container with Category Sidebar and Product List */}
      <div className="flex-1 flex overflow-hidden">
        {/* Category Sidebar */}
        <div className="w-48 border-r border-white/10 bg-black/20 p-2.5 flex flex-col gap-1 shrink-0 overflow-y-auto">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
            หมวดหมู่สินค้า
          </div>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                selectedCategory === cat
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>{cat}</span>
              <span className="text-[10px] opacity-60">
                {cat === "ทั้งหมด"
                  ? items.length
                  : items.filter((i) => i.category === cat).length}
              </span>
            </button>
          ))}
        </div>

        {/* Product Table / Grid Area */}
        <div
          className="flex-1 overflow-auto p-4"
          onClick={() => setSelectedId(null)}
        >
          {filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <Boxes className="w-12 h-12 mb-3 text-slate-600" />
              <p className="text-sm font-medium">ไม่พบรายการสินค้า</p>
              <p className="text-xs mt-1">ลองเปลี่ยนคำค้นหา หรือกดเพิ่มสินค้าใหม่</p>
            </div>
          ) : viewMode === "list" ? (
            <div className="rounded-xl border border-white/10 overflow-hidden bg-white/[0.02]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03] text-slate-400 font-medium">
                    <th className="py-2.5 px-3">รหัส SKU</th>
                    <th className="py-2.5 px-3">ชื่อสินค้า</th>
                    <th className="py-2.5 px-3">หมวดหมู่</th>
                    <th className="py-2.5 px-3 text-right">คงเหลือ</th>
                    <th className="py-2.5 px-3 text-right">ราคาต่อหน่วย</th>
                    <th className="py-2.5 px-3 text-center">สถานะ</th>
                    <th className="py-2.5 px-3 text-right">อัปเดต</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredItems.map((item) => {
                    const isSelected = selectedId === item.id;
                    const isLow =
                      item.quantity > 0 && item.quantity <= item.minStock;
                    const isOut = item.quantity === 0;

                    return (
                      <tr
                        key={item.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(item.id);
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedId(item.id);
                          setContextMenu({
                            x: e.clientX,
                            y: e.clientY,
                            item,
                          });
                        }}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-amber-500/15 border-l-2 border-amber-400 text-white"
                            : "hover:bg-white/[0.04] text-slate-300"
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono font-medium text-amber-300">
                          {item.sku}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-white">
                          {item.name}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">
                          {item.category}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold">
                          <span
                            className={
                              isOut
                                ? "text-rose-400"
                                : isLow
                                ? "text-amber-400"
                                : "text-emerald-400"
                            }
                          >
                            {item.quantity}
                          </span>{" "}
                          <span className="text-[10px] text-slate-400 font-normal">
                            {item.unit}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {isOut ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              สินค้าหมด
                            </span>
                          ) : isLow ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              สต็อกใกล้หมด
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              พร้อมจำหน่าย
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-500 text-[11px]">
                          {item.updatedAt}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredItems.map((item) => {
                const isSelected = selectedId === item.id;
                const isLow =
                  item.quantity > 0 && item.quantity <= item.minStock;
                const isOut = item.quantity === 0;

                return (
                  <div
                    key={item.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(item.id);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedId(item.id);
                      setContextMenu({
                        x: e.clientX,
                        y: e.clientY,
                        item,
                      });
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10"
                        : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-mono text-amber-400 font-semibold">
                          {item.sku}
                        </span>
                        <span className="text-slate-400">{item.category}</span>
                      </div>
                      <h4 className="font-semibold text-white text-sm line-clamp-1">
                        {item.name}
                      </h4>
                    </div>

                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400">ราคา/หน่วย</div>
                        <div className="text-xs font-bold text-white">
                          {formatCurrency(item.price)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400">คงเหลือ</div>
                        <div
                          className={`text-sm font-bold ${
                            isOut
                              ? "text-rose-400"
                              : isLow
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {item.quantity} {item.unit}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <ModuleFooter
        leftContent={`รวมทั้งหมด ${items.length} รายการ (แสดง ${filteredItems.length} รายการ)`}
        selectedText={
          selectedItem
            ? `เลือก: ${selectedItem.name} (${selectedItem.sku})`
            : null
        }
        rightStatus="คลังสินค้าเชื่อมต่อแล้ว"
      />

      {/* Context Menu (Right Click) */}
      {contextMenu && (
        <ModuleContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={[
            {
              label: `ปรับปรุงสต็อก (${contextMenu.item.sku})`,
              icon: ArrowUpDown,
              onClick: () => {
                setSelectedId(contextMenu.item.id);
                setAdjustAmount(1);
                setIsAdjustModalOpen(true);
              },
            },
            { divider: true },
            {
              label: "ลบรายการสินค้านี้",
              icon: Trash2,
              danger: true,
              onClick: () => handleDeleteItem(contextMenu.item.id),
            },
          ]}
        />
      )}

      {/* Add Item Modal */}
      <ModuleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="เพิ่มรายการสินค้าใหม่"
        icon={Boxes}
        subtitle="บันทึกข้อมูลเข้าสู่ฐานข้อมูลสต็อกสินค้าของ DCMS"
      >
        <form onSubmit={handleAddItem} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-300">
                รหัสสินค้า (SKU)
              </label>
              <input
                type="text"
                required
                placeholder="เช่น NET-CAT6-305M"
                value={formData.sku}
                onChange={(e) =>
                  setFormData({ ...formData, sku: e.target.value })
                }
                className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-300">
                หมวดหมู่
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg bg-black/40 border border-white/10 text-white focus:outline-none focus:border-amber-500"
              >
                {categories
                  .filter((c) => c !== "ทั้งหมด")
                  .map((c) => (
                    <option key={c} value={c} className="bg-slate-900 text-white">
                      {c}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-300">
              ชื่อสินค้า / รายละเอียด
            </label>
            <input
              type="text"
              required
              placeholder="ระบุชื่อรุ่น หรือยี่ห้อสินค้า..."
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-300">
                จำนวนเริ่มต้น
              </label>
              <input
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg bg-black/40 border border-white/10 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-300">
                จุดสั่งซื้อซ้ำ (Min)
              </label>
              <input
                type="number"
                min="0"
                value={formData.minStock}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minStock: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg bg-black/40 border border-white/10 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-300">
                หน่วยนับ
              </label>
              <input
                type="text"
                placeholder="ชิ้น / กล่อง / ตัว"
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
                className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg bg-black/40 border border-white/10 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-300">
              ราคาต่อหน่วย (บาท)
            </label>
            <input
              type="number"
              min="0"
              placeholder="0.00"
              value={formData.price}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  price: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg bg-black/40 border border-white/10 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <ModuleButton
              onClick={() => setIsAddModalOpen(false)}
              variant="secondary"
            >
              ยกเลิก
            </ModuleButton>
            <ModuleButton variant="primary" icon={Plus}>
              บันทึกสินค้า
            </ModuleButton>
          </div>
        </form>
      </ModuleModal>

      {/* Adjust Stock Modal */}
      <ModuleModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="ปรับปรุงยอดคงเหลือสินค้า"
        icon={ArrowUpDown}
        subtitle={
          selectedItem
            ? `${selectedItem.name} (ปัจจุบัน: ${selectedItem.quantity} ${selectedItem.unit})`
            : undefined
        }
      >
        <div className="space-y-4">
          <div className="flex gap-2 p-1 rounded-xl bg-black/30 border border-white/10">
            <button
              type="button"
              onClick={() => setAdjustType("in")}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
                adjustType === "in"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" /> รับเข้าสต็อก (+)
            </button>
            <button
              type="button"
              onClick={() => setAdjustType("out")}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
                adjustType === "out"
                  ? "bg-rose-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" /> จ่าย/เบิกออก (-)
            </button>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-300">
              จำนวนที่ต้องการปรับปรุง ({selectedItem?.unit || "หน่วย"})
            </label>
            <input
              type="number"
              min="1"
              value={adjustAmount}
              onChange={(e) =>
                setAdjustAmount(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="w-full mt-1 px-3 py-2 text-sm rounded-lg bg-black/40 border border-white/10 text-white font-bold focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="p-3 rounded-lg bg-white/5 text-xs text-slate-300 flex items-center justify-between">
            <span>ยอดคงเหลือใหม่หลังปรับปรุง:</span>
            <span className="font-bold text-amber-300 text-sm">
              {selectedItem
                ? Math.max(
                    0,
                    selectedItem.quantity +
                      (adjustType === "in" ? adjustAmount : -adjustAmount)
                  )
                : 0}{" "}
              {selectedItem?.unit}
            </span>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <ModuleButton
              onClick={() => setIsAdjustModalOpen(false)}
              variant="secondary"
            >
              ยกเลิก
            </ModuleButton>
            <ModuleButton
              onClick={handleAdjustStock}
              variant="primary"
              icon={ArrowUpDown}
            >
              ยืนยันการปรับปรุง
            </ModuleButton>
          </div>
        </div>
      </ModuleModal>
    </ModuleContainer>
  );
}
