"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Info,
  AlertTriangle,
  Download,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  Eye,
  FileCode,
  Lock,
} from "lucide-react";
import {
  ModuleContainer,
  ModuleToolbar,
  ModuleButton,
  ModuleContextMenu,
  ModuleFooter,
  ModuleModal,
} from "@/core/components/ui/ModuleLayout";

export interface AuditLogItem {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  severity: "info" | "warning" | "danger" | "success";
  ipAddress: string;
  details: string;
}

const initialLogs: AuditLogItem[] = [
  {
    id: "log-101",
    timestamp: "2026-09-29 16:30:12",
    user: "admin@dcms.local",
    action: "AUTH_LOGIN_SUCCESS",
    resource: "/api/auth/login",
    severity: "success",
    ipAddress: "192.168.1.105",
    details: "เข้าสู่ระบบสำเร็จผ่าน Web Desktop Console",
  },
  {
    id: "log-102",
    timestamp: "2026-09-29 15:45:22",
    user: "admin@dcms.local",
    action: "MODULE_INSTALL",
    resource: "app-store/inventory",
    severity: "info",
    ipAddress: "192.168.1.105",
    details: "ติดตั้งโมดูล Inventory & Stock v1.2.0 สำเร็จ",
  },
  {
    id: "log-103",
    timestamp: "2026-09-29 14:12:05",
    user: "system",
    action: "DB_AUTO_MIGRATION",
    resource: "SQLite Adapter",
    severity: "success",
    ipAddress: "127.0.0.1",
    details: "ตรวจสอบและอัปเดตสคีมาฐานข้อมูลอัตโนมัติสำเร็จ",
  },
  {
    id: "log-104",
    timestamp: "2026-09-29 12:20:44",
    user: "somchai@dcms.local",
    action: "FILE_UPLOAD",
    resource: "/documents/report_q3.pdf",
    severity: "info",
    ipAddress: "192.168.1.142",
    details: "อัปโหลดไฟล์ขนาด 4.2 MB ไปยังโฟลเดอร์เอกสารทั่วไป",
  },
  {
    id: "log-105",
    timestamp: "2026-09-29 10:05:19",
    user: "unknown",
    action: "AUTH_LOGIN_FAIL",
    resource: "/api/auth/login",
    severity: "warning",
    ipAddress: "172.16.0.45",
    details: "รหัสผ่านไม่ถูกต้องสำหรับบัญชี operator@dcms.local (ครั้งที่ 2)",
  },
  {
    id: "log-106",
    timestamp: "2026-09-29 08:30:00",
    user: "admin@dcms.local",
    action: "PERMISSION_CHANGE",
    resource: "/folders/finance",
    severity: "danger",
    ipAddress: "192.168.1.105",
    details: "แก้ไขสิทธิ์การเข้าถึงโฟลเดอร์การเงินเป็น Admin Only",
  },
];

export function AuditLogsApp({ windowId }: { windowId: string }) {
  const [logs, setLogs] = useState<AuditLogItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dcms_audit_logs");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return initialLogs;
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Context Menu & Preview Modal
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    log: AuditLogItem;
  } | null>(null);
  const [previewLog, setPreviewLog] = useState<AuditLogItem | null>(null);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("dcms_audit_logs", JSON.stringify(logs));
    } catch {}
  }, [logs]);

  const selectedLog = logs.find((l) => l.id === selectedId);

  const filteredLogs = logs.filter((log) => {
    const matchesSeverity =
      severityFilter === "all" || log.severity === severityFilter;
    const matchesSearch =
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.resource.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  const handleClearLogs = () => {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการล้างประวัติกิจกรรมทั้งหมด?")) {
      setLogs([]);
      setSelectedId(null);
    }
  };

  const handleExportJSON = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `dcms-audit-logs-${new Date().toISOString().split("T")[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCSV = () => {
    const headers = "ID,Timestamp,User,Action,Severity,IP,Resource,Details\n";
    const rows = logs
      .map(
        (l) =>
          `"${l.id}","${l.timestamp}","${l.user}","${l.action}","${l.severity}","${l.ipAddress}","${l.resource}","${l.details.replace(/"/g, '""')}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `dcms-audit-logs-${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const getSeverityBadge = (severity: AuditLogItem["severity"]) => {
    switch (severity) {
      case "success":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center gap-1 w-max">
            <ShieldCheck className="w-3 h-3" /> สำเร็จ
          </span>
        );
      case "info":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/15 text-blue-400 border border-blue-500/25 flex items-center gap-1 w-max">
            <Info className="w-3 h-3" /> ข้อมูล
          </span>
        );
      case "warning":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center gap-1 w-max">
            <AlertTriangle className="w-3 h-3" /> แจ้งเตือน
          </span>
        );
      case "danger":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/15 text-rose-400 border border-rose-500/25 flex items-center gap-1 w-max">
            <ShieldAlert className="w-3 h-3" /> ความปลอดภัย
          </span>
        );
    }
  };

  return (
    <ModuleContainer>
      {/* Module Toolbar */}
      <ModuleToolbar
        leftActions={
          <>
            <ModuleButton
              onClick={handleExportCSV}
              variant="secondary"
              icon={Download}
            >
              ส่งออก CSV
            </ModuleButton>
            <ModuleButton
              onClick={handleExportJSON}
              variant="secondary"
              icon={FileCode}
            >
              ส่งออก JSON
            </ModuleButton>
          </>
        }
        selectedActions={
          selectedLog && (
            <>
              <ModuleButton
                onClick={() => setPreviewLog(selectedLog)}
                variant="secondary"
                icon={Eye}
              >
                ดูรายละเอียด ({selectedLog.action})
              </ModuleButton>
            </>
          )
        }
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="ค้นหาผู้ใช้, แอ็กชัน, IP..."
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Severity Filter Bar */}
      <div className="px-4 py-2 bg-black/20 border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { key: "all", label: "ทั้งหมด", count: logs.length },
            {
              key: "success",
              label: "สำเร็จ (Success)",
              count: logs.filter((l) => l.severity === "success").length,
            },
            {
              key: "info",
              label: "ข้อมูล (Info)",
              count: logs.filter((l) => l.severity === "info").length,
            },
            {
              key: "warning",
              label: "แจ้งเตือน (Warning)",
              count: logs.filter((l) => l.severity === "warning").length,
            },
            {
              key: "danger",
              label: "ความปลอดภัย (Security)",
              count: logs.filter((l) => l.severity === "danger").length,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSeverityFilter(tab.key)}
              className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
                severityFilter === tab.key
                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] opacity-75">({tab.count})</span>
            </button>
          ))}
        </div>

        {logs.length > 0 && (
          <button
            onClick={handleClearLogs}
            className="cursor-pointer text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 hover:underline"
          >
            <Trash2 className="w-3.5 h-3.5" /> ล้างประวัติทั้งหมด
          </button>
        )}
      </div>

      {/* Main Table Area */}
      <div
        className="flex-1 overflow-auto p-4"
        onClick={() => setSelectedId(null)}
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <Shield className="w-12 h-12 mb-3 text-slate-600" />
            <p className="text-sm font-medium">ไม่พบรายการประวัติกิจกรรม</p>
            <p className="text-xs mt-1">ลองเปลี่ยนตัวกรอง หรือค้นหาใหม่อีกครั้ง</p>
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 overflow-hidden bg-white/[0.02]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03] text-slate-400 font-medium">
                  <th className="py-2.5 px-3">วันและเวลา</th>
                  <th className="py-2.5 px-3">ระดับ</th>
                  <th className="py-2.5 px-3">กิจกรรม (Action)</th>
                  <th className="py-2.5 px-3">ผู้ใช้งาน (User)</th>
                  <th className="py-2.5 px-3">เป้าหมาย (Resource)</th>
                  <th className="py-2.5 px-3">IP Address</th>
                  <th className="py-2.5 px-3">รายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLogs.map((log) => {
                  const isSelected = selectedId === log.id;

                  return (
                    <tr
                      key={log.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(log.id);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedId(log.id);
                        setContextMenu({
                          x: e.clientX,
                          y: e.clientY,
                          log,
                        });
                      }}
                      className={`transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-rose-500/15 border-l-2 border-rose-400 text-white"
                          : "hover:bg-white/[0.04] text-slate-300"
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-2.5 px-3">
                        {getSeverityBadge(log.severity)}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-white">
                        {log.action}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-indigo-300">
                        {log.user}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                        {log.resource}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                        {log.ipAddress}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate">
                        {log.details}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      <ModuleFooter
        leftContent={`บันทึกรวม ${logs.length} เหตุการณ์ (แสดง ${filteredLogs.length} เหตุการณ์)`}
        selectedText={selectedLog ? `เลือก: ${selectedLog.action}` : null}
        rightStatus="ระบบบันทึกความปลอดภัยกำลังทำงาน"
      />

      {/* Context Menu */}
      {contextMenu && (
        <ModuleContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={[
            {
              label: `ดูรายละเอียดบันทึก (${contextMenu.log.action})`,
              icon: Eye,
              onClick: () => {
                setSelectedId(contextMenu.log.id);
                setPreviewLog(contextMenu.log);
              },
            },
            { divider: true },
            {
              label: "ลบรายการบันทึกนี้",
              icon: Trash2,
              danger: true,
              onClick: () => {
                setLogs((prev) => prev.filter((l) => l.id !== contextMenu.log.id));
                if (selectedId === contextMenu.log.id) setSelectedId(null);
              },
            },
          ]}
        />
      )}

      {/* Preview Modal */}
      {previewLog && (
        <ModuleModal
          isOpen={Boolean(previewLog)}
          onClose={() => setPreviewLog(null)}
          title="รายละเอียดเหตุการณ์ความปลอดภัย (Audit Trail)"
          icon={Shield}
          subtitle={`รหัสบันทึก: ${previewLog.id}`}
        >
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-black/40 border border-white/10">
              <div>
                <span className="text-slate-400 text-[10px] block">กิจกรรม:</span>
                <span className="font-mono font-bold text-white text-sm">
                  {previewLog.action}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">ระดับความสำคัญ:</span>
                <div className="mt-1">{getSeverityBadge(previewLog.severity)}</div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">ผู้ดำเนินการ:</span>
                <span className="font-semibold text-indigo-300">
                  {previewLog.user}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">IP Address:</span>
                <span className="font-mono text-slate-300">
                  {previewLog.ipAddress}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 text-[10px] block">เป้าหมาย (Resource):</span>
                <span className="font-mono text-cyan-300">{previewLog.resource}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 text-[10px] block">วันและเวลา:</span>
                <span className="text-slate-200">{previewLog.timestamp}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] block mb-1">
                รายละเอียดเหตุการณ์ (Event Payload):
              </span>
              <div className="p-3 rounded-xl bg-black/50 border border-white/10 font-mono text-slate-300 leading-relaxed">
                {previewLog.details}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <ModuleButton onClick={() => setPreviewLog(null)} variant="secondary">
                ปิดหน้าต่าง
              </ModuleButton>
            </div>
          </div>
        </ModuleModal>
      )}
    </ModuleContainer>
  );
}
