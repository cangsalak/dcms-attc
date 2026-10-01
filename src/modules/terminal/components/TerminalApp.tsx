"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Terminal as TerminalIcon,
  Trash2,
  HelpCircle,
  Activity,
  Database,
  Users,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  Lock,
} from "lucide-react";
import {
  ModuleContainer,
  ModuleToolbar,
  ModuleButton,
  ModuleFooter,
} from "@/core/components/ui/ModuleLayout";
import { useAuth } from "@/core/context/AuthContext";

interface CommandHistory {
  command: string;
  output: React.ReactNode;
}

export function TerminalApp({ windowId }: { windowId: string }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "Super Admin" || user?.role === "Admin";
  const username = user?.email ? user.email.split("@")[0] : "admin";

  const [history, setHistory] = useState<CommandHistory[]>([
    {
      command: "welcome",
      output: (
        <div className="space-y-1 text-slate-300">
          <div className="text-cyan-400 font-bold">
            DCMS Core Desktop OS [Version 1.0.0 (x86_64-darwin)]
          </div>
          <div className="text-slate-400">
            ระบบปฏิบัติการเว็บเดสก์ท็อป Synology DSM Style Architecture
          </div>
          <div className="text-xs text-indigo-300">
            บัญชีปัจจุบัน: <span className="font-semibold text-white">{user?.name || "ผู้ดูแลระบบ"}</span>{" "}
            (บทบาท: <span className="font-semibold text-amber-300">{user?.role || "Super Admin"}</span>)
          </div>
          <div className="text-slate-500 text-xs">
            พิมพ์ <span className="text-amber-400 font-mono">help</span> เพื่อดูคำสั่งทั้งหมด หรือพิมพ์{" "}
            <span className="text-emerald-400 font-mono">security</span> เพื่อตรวจสอบความปลอดภัยระบบ
          </div>
        </div>
      ),
    },
  ]);

  const [inputVal, setInputVal] = useState("");
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [cmdList, setCmdList] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const runCommand = async (rawCmd: string) => {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;

    setCmdList((prev) => [...prev, trimmed]);
    setHistoryIndex(null);

    const parts = trimmed.split(" ");
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    let output: React.ReactNode = null;

    switch (cmd) {
      case "help":
        output = (
          <div className="space-y-1 text-slate-300">
            <div className="text-cyan-400 font-bold mb-1">คำสั่งที่รองรับใน DCMS Terminal:</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div><span className="text-emerald-400 font-mono font-bold">security</span> / <span className="text-emerald-400 font-mono font-bold">audit</span> - ตรวจสอบความปลอดภัย & ช่องโหว่ (เฉพาะ Admin)</div>
              <div><span className="text-amber-400 font-mono">help</span> - แสดงรายการคำสั่งทั้งหมด</div>
              <div><span className="text-amber-400 font-mono">status</span> / <span className="text-amber-400 font-mono">sysinfo</span> - รายงานสถานะเครื่องและ RAM</div>
              <div><span className="text-amber-400 font-mono">db</span> - รายงานสถานะการเชื่อมต่อฐานข้อมูล</div>
              <div><span className="text-amber-400 font-mono">users</span> - แสดงรายชื่อผู้ใช้งานในระบบ</div>
              <div><span className="text-amber-400 font-mono">modules</span> - แสดงรายการโมดูลที่ติดตั้งแล้ว</div>
              <div><span className="text-amber-400 font-mono">date</span> - แสดงวันและเวลาปัจจุบัน (พ.ศ.)</div>
              <div><span className="text-amber-400 font-mono">uptime</span> - เวลาที่ระบบเปิดทำงานต่อเนื่อง</div>
              <div><span className="text-amber-400 font-mono">echo [ข้อความ]</span> - พิมพ์ข้อความซ้ำ</div>
              <div><span className="text-amber-400 font-mono">clear</span> - ล้างข้อความทั้งหมดบนหน้าจอ</div>
              <div><span className="text-amber-400 font-mono">version</span> - แสดงเวอร์ชันของ DCMS Core</div>
            </div>
          </div>
        );
        break;

      case "security":
      case "audit":
      case "sec-check":
      case "check-sec":
        // Strict Role Check for Security Audit
        if (!isAdmin) {
          output = (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-1.5 my-1.5">
              <div className="flex items-center gap-2 font-bold text-rose-400">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>[ACCESS DENIED] ไม่อนุญาตให้เข้าถึงระบบตรวจสอบความปลอดภัย</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                คำสั่งตรวจสอบความปลอดภัยของระบบ (Security Audit) ถูกจำกัดสิทธิ์เฉพาะผู้ใช้งานระดับ{" "}
                <span className="font-bold text-white underline">Super Admin</span> หรือ{" "}
                <span className="font-bold text-white underline">Admin</span> เท่านั้น
              </p>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-rose-500/20">
                บัญชีปัจจุบัน: <span className="text-indigo-300 font-mono">{user?.name || "ไม่ทราบชื่อ"}</span> | บทบาท:{" "}
                <span className="text-amber-300 font-mono font-bold">{user?.role || "Member"}</span>
              </div>
            </div>
          );
          break;
        }

        try {
          const res = await fetch("/api/security/audit");
          const data = await res.json();

          if (!res.ok) {
            output = (
              <div className="text-rose-400 font-mono p-2 bg-rose-500/10 rounded-lg border border-rose-500/20">
                [ERROR] {data.error || "เกิดข้อผิดพลาดในการตรวจสอบความปลอดภัย"}
              </div>
            );
            break;
          }

          output = (
            <div className="space-y-3 my-2 font-sans select-text">
              {/* Security Header Banner */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/70 via-[#181330] to-indigo-950/70 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      DCMS Core OS Security Audit Report
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      ผู้ตรวจสอบ: <span className="text-cyan-300 font-medium">{data.auditedBy}</span>{" "}
                      (สิทธิ์: <span className="text-emerald-400 font-semibold">{data.auditorRole}</span>)
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Overall Security</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    {data.grade} <span className="text-xs font-semibold text-slate-300">({data.securityScore}/100)</span>
                  </div>
                </div>
              </div>

              {/* Summary Badges */}
              <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 font-semibold">
                  ✓ ผ่าน: {data.summary.passed} รายการ
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/25">
                  ⚠ แจ้งเตือน: {data.summary.warning} รายการ
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/25">
                  ✕ ล้มเหลว: {data.summary.failed} รายการ
                </span>
              </div>

              {/* Checks Table */}
              <div className="border border-white/10 rounded-xl overflow-hidden bg-black/40 text-xs">
                <div className="grid grid-cols-12 bg-white/5 p-2.5 font-semibold text-slate-400 text-[11px] border-b border-white/10">
                  <div className="col-span-2 text-center font-mono">สถานะ</div>
                  <div className="col-span-4">หัวข้อตรวจสอบ</div>
                  <div className="col-span-1 text-center font-mono">ระดับ</div>
                  <div className="col-span-5">ผลการวิเคราะห์และความปลอดภัย</div>
                </div>
                <div className="divide-y divide-white/5">
                  {data.checks.map((c: any) => (
                    <div
                      key={c.id}
                      className="grid grid-cols-12 p-2.5 items-center text-[11px] hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="col-span-2 text-center font-mono font-bold">
                        {c.status === "PASS" ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            [PASS]
                          </span>
                        ) : c.status === "WARN" ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            [WARN]
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            [FAIL]
                          </span>
                        )}
                      </div>
                      <div className="col-span-4 font-medium text-white font-mono truncate pr-2">
                        {c.title}
                      </div>
                      <div className="col-span-1 text-center font-mono">
                        <span className="text-[9px] text-slate-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                          {c.severity}
                        </span>
                      </div>
                      <div className="col-span-5 text-slate-300 leading-relaxed">
                        {c.details}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        } catch {
          output = <div className="text-rose-400">ไม่สามารถเชื่อมต่อระบบตรวจสอบความปลอดภัยได้</div>;
        }
        break;

      case "clear":
        setHistory([]);
        setInputVal("");
        return;

      case "version":
        output = (
          <div className="text-slate-300">
            <span className="text-emerald-400 font-bold">DCMS Core OS</span> v1.0.0 (Production Node.js PM2 Engine)
          </div>
        );
        break;

      case "date":
        output = (
          <div className="text-amber-300 font-mono">
            {new Date().toLocaleDateString("th-TH", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </div>
        );
        break;

      case "uptime":
        output = (
          <div className="text-slate-300">
            System uptime: <span className="text-cyan-400 font-mono">14 วัน 6 ชั่วโมง 23 นาที (Process: PM2 dcms-app online)</span>
          </div>
        );
        break;

      case "status":
      case "sysinfo":
        output = (
          <div className="space-y-1.5 text-slate-300">
            <div className="text-emerald-400 font-bold">--- สถานะระบบ DCMS Core Desktop OS ---</div>
            <div>• โฮสต์: <span className="text-cyan-300 font-mono">dcms-node-primary (Mac / Darwin 24.1.0)</span></div>
            <div>• หน่วยประมวลผล: <span className="text-cyan-300 font-mono">Apple M-Series (ARM64 / Cluster Active)</span></div>
            <div>• สภาพแวดล้อม: <span className="text-cyan-300 font-mono">Node.js {typeof process !== "undefined" ? process.version : "v20+"} / Next.js 15+</span></div>
            <div>• ตัวจัดการโปรเซส: <span className="text-emerald-400 font-mono font-semibold">PM2 (Cluster Mode, 0 Docker Overhead)</span></div>
            <div>• การใช้ RAM: <span className="text-cyan-300 font-mono">184.2 MB / 8.00 GB (ประหยัดพลังงานระดับสูง)</span></div>
            <div>• เครือข่าย: <span className="text-cyan-300 font-mono">http://localhost:3000 (HTTP/1.1 Active)</span></div>
          </div>
        );
        break;

      case "db":
        output = (
          <div className="space-y-1 text-slate-300">
            <div className="text-purple-400 font-bold">--- ข้อมูลฐานข้อมูล (Database Engine) ---</div>
            <div>• ไดอะเลกต์ (Dialect): <span className="text-amber-300 font-mono">SQLite (Multi-DB Ready: SQLite / MySQL / PostgreSQL)</span></div>
            <div>• ตำแหน่งจัดเก็บ: <span className="text-cyan-300 font-mono">./data/dcms.sqlite</span></div>
            <div>• ตารางหลัก (Tables): <span className="text-slate-300 font-mono">users, installed_modules, marketplace_modules, files, folders</span></div>
            <div>• สถานะการเชื่อมต่อ: <span className="text-emerald-400 font-bold">HEALTHY (Auto-migrated & Ready)</span></div>
          </div>
        );
        break;

      case "users":
        try {
          const res = await fetch("/api/users");
          const data = await res.json();
          if (data.users && data.users.length > 0) {
            output = (
              <div className="space-y-1">
                <div className="text-indigo-400 font-bold mb-1">รายชื่อผู้ใช้ในระบบ ({data.users.length}):</div>
                <div className="border border-white/10 rounded-lg overflow-hidden font-mono text-xs">
                  <div className="grid grid-cols-4 bg-white/10 px-2 py-1 font-semibold text-slate-300">
                    <div>ชื่อ</div>
                    <div>อีเมล</div>
                    <div>บทบาท</div>
                    <div>แผนก</div>
                  </div>
                  {data.users.map((u: any) => (
                    <div key={u.id} className="grid grid-cols-4 px-2 py-1 border-t border-white/5 text-slate-300">
                      <div className="text-white font-medium">{u.name}</div>
                      <div className="text-indigo-300">{u.email}</div>
                      <div>{u.role}</div>
                      <div className="text-slate-400">{u.department}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          } else {
            output = <div className="text-slate-400">{data.error || "ไม่พบรายชื่อผู้ใช้งาน"}</div>;
          }
        } catch {
          output = <div className="text-rose-400">เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้</div>;
        }
        break;

      case "modules":
        try {
          const res = await fetch("/api/modules");
          const data = await res.json();
          const mods = data.modules || [];
          output = (
            <div className="space-y-1">
              <div className="text-cyan-400 font-bold mb-1">โมดูลส่วนขยายที่ติดตั้งในฐานข้อมูล ({mods.length}):</div>
              {mods.length === 0 ? (
                <div className="text-slate-400">ยังไม่มีการติดตั้งโมดูลเสริม (มีเฉพาะ Core System Modules)</div>
              ) : (
                <div className="space-y-1">
                  {mods.map((m: any) => (
                    <div key={m.id} className="text-xs flex items-center gap-2">
                      <span className="text-emerald-400 font-bold font-mono">[{m.id}]</span>
                      <span className="text-white font-medium">{m.name}</span>
                      <span className="text-slate-500 font-mono text-[11px]">v{m.version}</span>
                      <span className="text-emerald-400 text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded">Active</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        } catch {
          output = <div className="text-rose-400">ไม่สามารถเชื่อมต่อ API โมดูลได้</div>;
        }
        break;

      case "echo":
        output = <div className="text-slate-200">{args.join(" ")}</div>;
        break;

      default:
        output = (
          <div className="text-rose-400">
            command not found: {cmd}. พิมพ์ <span className="text-amber-400 font-mono">help</span> เพื่อดูคำสั่งที่สามารถใช้งานได้
          </div>
        );
        break;
    }

    setHistory((prev) => [...prev, { command: trimmed, output }]);
    setInputVal("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      runCommand(inputVal);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdList.length === 0) return;
      const nextIndex =
        historyIndex === null
          ? cmdList.length - 1
          : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInputVal(cmdList[nextIndex]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === null) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= cmdList.length) {
        setHistoryIndex(null);
        setInputVal("");
      } else {
        setHistoryIndex(nextIndex);
        setInputVal(cmdList[nextIndex]);
      }
    }
  };

  const handleCopyLogs = () => {
    const text = history
      .map(
        (h) =>
          `${username}@dcms:~$ ${h.command}\n${
            typeof h.output === "string" ? h.output : "[Command Output]"
          }`
      )
      .join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <ModuleContainer>
      {/* Module Toolbar */}
      <ModuleToolbar
        leftActions={
          <>
            <ModuleButton
              onClick={() => runCommand("security")}
              variant="primary"
              icon={isAdmin ? ShieldCheck : Lock}
              className={
                isAdmin
                  ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30"
                  : "bg-slate-800 text-slate-400 opacity-60"
              }
              title={
                isAdmin
                  ? "ตรวจสอบความปลอดภัยและช่องโหว่ของระบบ"
                  : "สงวนสิทธิ์เฉพาะ Super Admin หรือ Admin"
              }
            >
              ตรวจสอบความปลอดภัย (Security)
            </ModuleButton>
            <ModuleButton
              onClick={() => runCommand("status")}
              variant="secondary"
              icon={Activity}
            >
              สถานะเครื่อง
            </ModuleButton>
            <ModuleButton
              onClick={() => runCommand("db")}
              variant="secondary"
              icon={Database}
            >
              ฐานข้อมูล
            </ModuleButton>
            <ModuleButton
              onClick={() => runCommand("users")}
              variant="secondary"
              icon={Users}
            >
              ผู้ใช้
            </ModuleButton>
            <ModuleButton
              onClick={() => runCommand("help")}
              variant="secondary"
              icon={HelpCircle}
            >
              คำสั่งทั้งหมด
            </ModuleButton>
          </>
        }
        selectedActions={
          <>
            <ModuleButton
              onClick={() => setHistory([])}
              variant="ghost"
              icon={Trash2}
            >
              ล้างหน้าจอ
            </ModuleButton>
            <ModuleButton
              onClick={handleCopyLogs}
              variant="ghost"
              icon={copied ? Check : Copy}
            >
              {copied ? "คัดลอกแล้ว" : "คัดลอกข้อความ"}
            </ModuleButton>
          </>
        }
      />

      {/* Terminal Viewport */}
      <div
        onClick={() => inputRef.current?.focus()}
        className="flex-1 bg-[#0b0816] p-4 font-mono text-xs overflow-y-auto cursor-text select-text"
      >
        <div className="space-y-4">
          {history.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">{username}@dcms:~$</span>
                <span className="text-white font-medium">{item.command}</span>
              </div>
              <div className="pl-4 text-slate-300 leading-relaxed">
                {item.output}
              </div>
            </div>
          ))}

          {/* Active Prompt Line */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-emerald-400 font-bold shrink-0">{username}@dcms:~$</span>
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              spellCheck={false}
              className="flex-1 bg-transparent border-none outline-none text-white font-mono text-xs caret-cyan-400 placeholder-slate-600"
              placeholder="พิมพ์ security, help, status, db, users, modules..."
            />
          </div>
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Footer */}
      <ModuleFooter
        leftContent={`TTY: /dev/pts/1 • ผู้ใช้งาน: ${user?.name || "admin"} (${user?.role || "Super Admin"})`}
        rightStatus={isAdmin ? "Security Audit: Enabled" : "Security Audit: Restricted"}
      />
    </ModuleContainer>
  );
}
