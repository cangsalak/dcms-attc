"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  Trash2,
  Eye,
  Printer,
  DollarSign,
  TrendingUp,
  Receipt,
  QrCode,
  Building,
} from "lucide-react";
import {
  ModuleContainer,
  ModuleToolbar,
  ModuleButton,
  ModuleContextMenu,
  ModuleFooter,
  ModuleModal,
} from "@/core/components/ui/ModuleLayout";

export interface Invoice {
  id: string;
  invoiceNo: string;
  customerName: string;
  customerTaxId: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  vatAmount: number;
  status: "paid" | "pending" | "overdue";
  items: Array<{ description: string; quantity: number; price: number }>;
}

const initialInvoices: Invoice[] = [
  {
    id: "inv-001",
    invoiceNo: "INV-2026-0089",
    customerName: "บริษัท สยาม ซิสเต็มส์ เทคโนโลยี จำกัด",
    customerTaxId: "0105556012345",
    issueDate: "2026-09-10",
    dueDate: "2026-09-25",
    amount: 45000,
    vatAmount: 3150,
    status: "paid",
    items: [
      { description: "ติดตั้งระบบ Network & Gateway DCMS", quantity: 1, price: 35000 },
      { description: "สายสัญญาณ UTP Cat6 305m x 2 ม้วน", quantity: 2, price: 5000 },
    ],
  },
  {
    id: "inv-002",
    invoiceNo: "INV-2026-0090",
    customerName: "บจก. บางกอก ดิจิทัล โซลูชั่นส์",
    customerTaxId: "0105558098765",
    issueDate: "2026-09-18",
    dueDate: "2026-10-02",
    amount: 128500,
    vatAmount: 8995,
    status: "pending",
    items: [
      { description: "เซิร์ฟเวอร์ DCMS Core OS Rackmount 2U", quantity: 1, price: 98500 },
      { description: "Enterprise SSD Gen4 2TB x 2", quantity: 2, price: 15000 },
    ],
  },
  {
    id: "inv-003",
    invoiceNo: "INV-2026-0091",
    customerName: "ห้างหุ้นส่วนจำกัด ซีเค ซอฟต์แวร์ เซอร์วิส",
    customerTaxId: "0103554011223",
    issueDate: "2026-08-20",
    dueDate: "2026-09-05",
    amount: 18200,
    vatAmount: 1274,
    status: "overdue",
    items: [
      { description: "สัญญาบริการบำรุงรักษาประจำปี (SLA 8x5)", quantity: 1, price: 18200 },
    ],
  },
  {
    id: "inv-004",
    invoiceNo: "INV-2026-0092",
    customerName: "บริษัท ดาต้า เซฟ เทคโนโลยี กรุ๊ป จำกัด",
    customerTaxId: "0105561084512",
    issueDate: "2026-09-22",
    dueDate: "2026-10-06",
    amount: 92000,
    vatAmount: 6440,
    status: "paid",
    items: [
      { description: "Switch Managed 48-Port PoE+ Layer3", quantity: 2, price: 46000 },
    ],
  },
];

export function BillingApp({ windowId }: { windowId: string }) {
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dcms_billing_invoices");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return initialInvoices;
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid" | "overdue">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // Context Menu
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    invoice: Invoice;
  } | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  // New Invoice Form
  const [formData, setFormData] = useState({
    customerName: "",
    customerTaxId: "",
    dueDate: "",
    itemDescription: "",
    itemPrice: 0,
    itemQty: 1,
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("dcms_billing_invoices", JSON.stringify(invoices));
    } catch {}
  }, [invoices]);

  const selectedInvoice = invoices.find((i) => i.id === selectedId);

  // KPI Calculations
  const totalBilled = invoices.reduce((acc, curr) => acc + curr.amount + curr.vatAmount, 0);
  const totalPaid = invoices
    .filter((i) => i.status === "paid")
    .reduce((acc, curr) => acc + curr.amount + curr.vatAmount, 0);
  const totalPending = invoices
    .filter((i) => i.status === "pending" || i.status === "overdue")
    .reduce((acc, curr) => acc + curr.amount + curr.vatAmount, 0);
  const overdueCount = invoices.filter((i) => i.status === "overdue").length;

  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    const matchesSearch =
      inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName.trim() || !formData.itemDescription.trim()) return;

    const baseAmount = (Number(formData.itemPrice) || 0) * (Number(formData.itemQty) || 1);
    const vat = Math.round(baseAmount * 0.07);
    const issueDate = new Date().toISOString().split("T")[0];
    const seq = (invoices.length + 90).toString().padStart(4, "0");

    const newInv: Invoice = {
      id: `inv-${Date.now().toString().slice(-4)}`,
      invoiceNo: `INV-2026-${seq}`,
      customerName: formData.customerName,
      customerTaxId: formData.customerTaxId || "0100000000000",
      issueDate,
      dueDate: formData.dueDate || issueDate,
      amount: baseAmount,
      vatAmount: vat,
      status: "pending",
      items: [
        {
          description: formData.itemDescription,
          quantity: Number(formData.itemQty) || 1,
          price: Number(formData.itemPrice) || 0,
        },
      ],
    };

    setInvoices((prev) => [newInv, ...prev]);
    setIsAddModalOpen(false);
    setFormData({
      customerName: "",
      customerTaxId: "",
      dueDate: "",
      itemDescription: "",
      itemPrice: 0,
      itemQty: 1,
    });
  };

  const handleToggleStatus = (id: string) => {
    setInvoices((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const nextStatus = i.status === "paid" ? "pending" : "paid";
        return { ...i, status: nextStatus };
      })
    );
  };

  const handleDeleteInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((i) => i.id !== id));
    if (selectedId === id) setSelectedId(null);
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
              ออกใบแจ้งหนี้ใหม่
            </ModuleButton>
          </>
        }
        selectedActions={
          selectedInvoice && (
            <>
              <ModuleButton
                onClick={() => setPreviewInvoice(selectedInvoice)}
                variant="secondary"
                icon={Eye}
              >
                ดูใบเสร็จ ({selectedInvoice.invoiceNo})
              </ModuleButton>
              <ModuleButton
                onClick={() => handleToggleStatus(selectedInvoice.id)}
                variant="warning"
                icon={CheckCircle}
              >
                {selectedInvoice.status === "paid" ? "ยกเลิกชำระ" : "ทำเครื่องหมายชำระแล้ว"}
              </ModuleButton>
              <ModuleButton
                onClick={() => handleDeleteInvoice(selectedInvoice.id)}
                variant="danger"
                icon={Trash2}
              >
                ลบเอกสาร
              </ModuleButton>
            </>
          )
        }
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="ค้นหาเลขที่ หรือชื่อลูกค้า..."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={() => {}}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 py-3 bg-white/[0.02] border-b border-white/5 shrink-0">
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">ยอดรวมออกบิล (Inc. VAT)</div>
            <div className="text-base font-bold text-white">{formatCurrency(totalBilled)}</div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">รับชำระแล้ว</div>
            <div className="text-base font-bold text-emerald-400">{formatCurrency(totalPaid)}</div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">ยอดรอชำระ</div>
            <div className="text-base font-bold text-amber-300">{formatCurrency(totalPending)}</div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">เกินกำหนดชำระ</div>
            <div className="text-base font-bold text-rose-400">
              {overdueCount} <span className="text-xs font-normal text-slate-400">รายการ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="px-4 py-2 bg-black/20 border-b border-white/5 flex items-center gap-1.5 shrink-0">
        {[
          { key: "all", label: "ทั้งหมด", count: invoices.length },
          { key: "pending", label: "รอชำระ (Pending)", count: invoices.filter((i) => i.status === "pending").length },
          { key: "paid", label: "ชำระแล้ว (Paid)", count: invoices.filter((i) => i.status === "paid").length },
          { key: "overdue", label: "เกินกำหนด (Overdue)", count: invoices.filter((i) => i.status === "overdue").length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key as any)}
            className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
              statusFilter === tab.key
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <span>{tab.label}</span>
            <span className="text-[10px] opacity-75">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Main Invoices Area */}
      <div className="flex-1 overflow-auto p-4" onClick={() => setSelectedId(null)}>
        {filteredInvoices.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <FileText className="w-12 h-12 mb-3 text-slate-600" />
            <p className="text-sm font-medium">ไม่พบใบแจ้งหนี้</p>
            <p className="text-xs mt-1">ลองเปลี่ยนคำค้นหา หรือออกใบแจ้งหนี้ใหม่</p>
          </div>
        ) : viewMode === "list" ? (
          <div className="rounded-xl border border-white/10 overflow-hidden bg-white/[0.02]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03] text-slate-400 font-medium">
                  <th className="py-2.5 px-3">เลขที่เอกสาร</th>
                  <th className="py-2.5 px-3">ลูกค้า / บริษัท</th>
                  <th className="py-2.5 px-3 text-right">ยอดก่อน VAT</th>
                  <th className="py-2.5 px-3 text-right">รวม VAT 7%</th>
                  <th className="py-2.5 px-3 text-center">วันที่ออกบิล</th>
                  <th className="py-2.5 px-3 text-center">ครบกำหนด</th>
                  <th className="py-2.5 px-3 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredInvoices.map((inv) => {
                  const isSelected = selectedId === inv.id;
                  const totalIncVat = inv.amount + inv.vatAmount;

                  return (
                    <tr
                      key={inv.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(inv.id);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedId(inv.id);
                        setContextMenu({
                          x: e.clientX,
                          y: e.clientY,
                          invoice: inv,
                        });
                      }}
                      className={`transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-emerald-500/15 border-l-2 border-emerald-400 text-white"
                          : "hover:bg-white/[0.04] text-slate-300"
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-medium text-emerald-400">
                        {inv.invoiceNo}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-white">{inv.customerName}</td>
                      <td className="py-2.5 px-3 text-right text-slate-400 font-mono">
                        {formatCurrency(inv.amount)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-white font-mono">
                        {formatCurrency(totalIncVat)}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-400 text-[11px]">
                        {inv.issueDate}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-400 text-[11px]">
                        {inv.dueDate}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {inv.status === "paid" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                            ชำระแล้ว
                          </span>
                        ) : inv.status === "overdue" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium">
                            เกินกำหนด
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                            รอชำระ
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredInvoices.map((inv) => {
              const isSelected = selectedId === inv.id;
              const totalIncVat = inv.amount + inv.vatAmount;

              return (
                <div
                  key={inv.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(inv.id);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedId(inv.id);
                    setContextMenu({
                      x: e.clientX,
                      y: e.clientY,
                      invoice: inv,
                    });
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/10"
                      : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-mono text-emerald-400 font-semibold">{inv.invoiceNo}</span>
                      {inv.status === "paid" ? (
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          ชำระแล้ว
                        </span>
                      ) : inv.status === "overdue" ? (
                        <span className="text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                          เกินกำหนด
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          รอชำระ
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold text-white text-sm line-clamp-1 mt-1">
                      {inv.customerName}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">ครบกำหนด: {inv.dueDate}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400">ยอดรวมสุทธิ</div>
                      <div className="text-sm font-bold text-white font-mono">
                        {formatCurrency(totalIncVat)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewInvoice(inv);
                      }}
                      className="cursor-pointer px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> ดูบิล
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <ModuleFooter
        leftContent={`จำนวนเอกสาร ${invoices.length} รายการ (ตรงกับเงื่อนไข ${filteredInvoices.length} รายการ)`}
        selectedText={selectedInvoice ? `เลือก: ${selectedInvoice.invoiceNo}` : null}
        rightStatus="ระบบบัญชีพร้อมทำงาน"
      />

      {/* Context Menu */}
      {contextMenu && (
        <ModuleContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={[
            {
              label: `ดูเอกสาร (${contextMenu.invoice.invoiceNo})`,
              icon: Eye,
              onClick: () => {
                setSelectedId(contextMenu.invoice.id);
                setPreviewInvoice(contextMenu.invoice);
              },
            },
            {
              label:
                contextMenu.invoice.status === "paid"
                  ? "เปลี่ยนเป็นรอชำระ"
                  : "ทำเครื่องหมายชำระแล้ว",
              icon: CheckCircle,
              onClick: () => handleToggleStatus(contextMenu.invoice.id),
            },
            { divider: true },
            {
              label: "ลบใบแจ้งหนี้นี้",
              icon: Trash2,
              danger: true,
              onClick: () => handleDeleteInvoice(contextMenu.invoice.id),
            },
          ]}
        />
      )}

      {/* Create Invoice Modal */}
      <ModuleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="ออกใบแจ้งหนี้ / ใบเรียกเก็บเงิน"
        icon={Receipt}
        subtitle="บันทึกข้อมูลและคำนวณภาษีมูลค่าเพิ่ม 7% โดยอัตโนมัติ"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-300">ชื่อลูกค้า / บริษัท</label>
              <input
                type="text"
                required
                placeholder="ระบุชื่อบริษัทผู้รับวางบิล..."
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-300">เลขประจำตัวผู้เสียภาษี</label>
              <input
                type="text"
                placeholder="010xxxxxxxxxx"
                value={formData.customerTaxId}
                onChange={(e) => setFormData({ ...formData, customerTaxId: e.target.value })}
                className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-300">วันครบกำหนดชำระ</label>
            <input
              type="date"
              required
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg bg-black/40 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
            <div className="text-[11px] font-semibold text-emerald-400">รายการสินค้า / บริการ</div>
            <div>
              <label className="text-[11px] text-slate-400">รายละเอียดรายการ</label>
              <input
                type="text"
                required
                placeholder="เช่น ค่าบริการระบบ Cloud / อุปกรณ์จัดเก็บข้อมูล"
                value={formData.itemDescription}
                onChange={(e) => setFormData({ ...formData, itemDescription: e.target.value })}
                className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg bg-black/40 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400">จำนวน</label>
                <input
                  type="number"
                  min="1"
                  value={formData.itemQty}
                  onChange={(e) =>
                    setFormData({ ...formData, itemQty: parseInt(e.target.value) || 1 })
                  }
                  className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg bg-black/40 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400">ราคาต่อหน่วย (บาท)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0.00"
                  value={formData.itemPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, itemPrice: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg bg-black/40 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs flex justify-between items-center">
            <span className="text-slate-300">ประมาณการรวม VAT 7%:</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">
              {formatCurrency(
                (Number(formData.itemPrice) || 0) * (Number(formData.itemQty) || 1) * 1.07
              )}
            </span>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <ModuleButton onClick={() => setIsAddModalOpen(false)} variant="secondary">
              ยกเลิก
            </ModuleButton>
            <ModuleButton variant="primary" icon={Plus}>
              ออกเอกสาร
            </ModuleButton>
          </div>
        </form>
      </ModuleModal>

      {/* Invoice Preview Modal */}
      {previewInvoice && (
        <ModuleModal
          isOpen={Boolean(previewInvoice)}
          onClose={() => setPreviewInvoice(null)}
          title={`ใบแจ้งหนี้ / ใบเสร็จ (${previewInvoice.invoiceNo})`}
          icon={Receipt}
          maxWidth="max-w-2xl"
        >
          <div className="bg-white text-slate-900 rounded-xl p-6 shadow-inner text-xs space-y-5">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
                    DC
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">DCMS ENTERPRISE CO., LTD.</h2>
                    <p className="text-[10px] text-slate-500">เลขประจำตัวผู้เสียภาษี: 0105565099881</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-bold text-emerald-700">INVOICE / ใบแจ้งหนี้</span>
                <p className="text-[11px] font-mono text-slate-600 mt-1">{previewInvoice.invoiceNo}</p>
              </div>
            </div>

            {/* Bill To & Dates */}
            <div className="grid grid-cols-2 gap-4 text-[11px]">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-700 mb-1">ผู้รับวางบิล / ลูกค้า:</div>
                <div className="font-semibold text-slate-900">{previewInvoice.customerName}</div>
                <div className="text-slate-500 mt-0.5">เลขประจำตัวผู้เสียภาษี: {previewInvoice.customerTaxId}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col justify-between">
                <div className="flex justify-between">
                  <span className="text-slate-500">วันที่ออกเอกสาร:</span>
                  <span className="font-medium text-slate-800">{previewInvoice.issueDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ครบกำหนดชำระ:</span>
                  <span className="font-bold text-rose-600">{previewInvoice.dueDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">สถานะ:</span>
                  <span className="font-bold text-emerald-600 uppercase">{previewInvoice.status}</span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">รายการ</th>
                    <th className="py-2 px-3 text-center">จำนวน</th>
                    <th className="py-2 px-3 text-right">ราคาต่อหน่วย</th>
                    <th className="py-2 px-3 text-right">จำนวนเงิน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {previewInvoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 font-medium">{item.description}</td>
                      <td className="py-2 px-3 text-center">{item.quantity}</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(item.price)}</td>
                      <td className="py-2 px-3 text-right font-medium">
                        {formatCurrency(item.quantity * item.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary & QR */}
            <div className="flex justify-between items-center pt-2">
              <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <QrCode className="w-12 h-12 text-slate-800" />
                <div>
                  <div className="text-[10px] font-bold text-slate-700">PromptPay / สแกนชำระเงิน</div>
                  <div className="text-[9px] text-slate-500">รองรับทุกธนาคารในประเทศไทย</div>
                </div>
              </div>

              <div className="w-60 space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>รวมเป็นเงิน (Subtotal):</span>
                  <span>{formatCurrency(previewInvoice.amount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>ภาษีมูลค่าเพิ่ม (VAT 7%):</span>
                  <span>{formatCurrency(previewInvoice.vatAmount)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-emerald-700 pt-2 border-t border-slate-200">
                  <span>ยอดสุทธิ (Total):</span>
                  <span>{formatCurrency(previewInvoice.amount + previewInvoice.vatAmount)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => window.print()}
                className="cursor-pointer px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4" /> พิมพ์เอกสาร
              </button>
            </div>
          </div>
        </ModuleModal>
      )}
    </ModuleContainer>
  );
}
