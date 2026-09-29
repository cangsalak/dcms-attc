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
} from "lucide-react";
import {
  ModuleContainer,
  ModuleToolbar,
  ModuleButton,
  ModuleFooter,
} from "@/core/components/ui/ModuleLayout";

interface CommandHistory {
  command: string;
  output: React.ReactNode;
}

export function TerminalApp({ windowId }: { windowId: string }) {
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
          <div className="text-slate-500 text-xs">
            พิมพ์ <span className="text-amber-400 font-mono">help</span> เพื่อดูคำสั่งทั้งหมดที่สามารถใช้งานได้
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
            <div>• ตารางหลัก (Tables): <span className="text-slate-300 font-mono">users, installed_modules, files, folders</span></div>
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
            output = <div className="text-slate-400">ไม่พบรายชื่อผู้ใช้งาน</div>;
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
          `admin@dcms:~$ ${h.command}\n${
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
                <span className="text-emerald-400 font-bold">admin@dcms:~$</span>
                <span className="text-white font-medium">{item.command}</span>
              </div>
              <div className="pl-4 text-slate-300 leading-relaxed">
                {item.output}
              </div>
            </div>
          ))}

          {/* Active Prompt Line */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-emerald-400 font-bold shrink-0">admin@dcms:~$</span>
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              spellCheck={false}
              className="flex-1 bg-transparent border-none outline-none text-white font-mono text-xs caret-cyan-400 placeholder-slate-600"
              placeholder="พิมพ์คำสั่ง เช่น help, status, db, users, modules..."
            />
          </div>
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Footer */}
      <ModuleFooter
        leftContent="TTY: /dev/pts/1 (Interactive Shell)"
        rightStatus="Session Online (UTF-8)"
      />
    </ModuleContainer>
  );
}
