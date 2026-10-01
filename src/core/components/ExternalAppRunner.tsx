"use client";

import React, { useState, useRef } from "react";
import {
  Globe,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Lock,
  AlertCircle,
} from "lucide-react";
import {
  ModuleContainer,
  ModuleToolbar,
  ModuleButton,
  ModuleFooter,
} from "./ui/ModuleLayout";

interface ExternalAppRunnerProps {
  windowId: string;
  url: string;
  title: string;
  iconName?: string;
}

export function ExternalAppRunner({
  windowId,
  url,
  title,
  iconName = "globe",
}: ExternalAppRunnerProps) {
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleReload = () => {
    setIsLoading(true);
    setHasError(false);
    setIframeKey((prev) => prev + 1);
  };

  const handleOpenExternal = () => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  let hostname = "";
  try {
    hostname = new URL(url).hostname;
  } catch {
    hostname = url;
  }

  const isHttps = url.startsWith("https://");

  return (
    <ModuleContainer>
      {/* Top Address & Controls Toolbar */}
      <ModuleToolbar
        leftActions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-xs text-slate-300">
              {isHttps ? (
                <Lock className="w-3 h-3 text-emerald-400" />
              ) : (
                <Globe className="w-3 h-3 text-cyan-400" />
              )}
              <span className="font-mono text-[11px] text-slate-300 max-w-xs md:max-w-md truncate">
                {url}
              </span>
            </div>
          </div>
        }
        selectedActions={
          <div className="flex items-center gap-1">
            <ModuleButton
              onClick={handleReload}
              variant="secondary"
              icon={RefreshCw}
              title="โหลดหน้านี้ใหม่"
            >
              รีเฟรช
            </ModuleButton>
            <ModuleButton
              onClick={handleOpenExternal}
              variant="ghost"
              icon={ExternalLink}
              title="เปิดในแท็บเบราว์เซอร์ใหม่"
            >
              เปิดภายนอก
            </ModuleButton>
          </div>
        }
      />

      {/* Frame Viewport */}
      <div className="flex-1 relative bg-white overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-[#120e24]/90 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-white">
            <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
            <span className="text-xs text-slate-300">
              กำลังโหลดแอปพลิเคชันจาก {hostname}...
            </span>
          </div>
        )}

        {hasError ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-[#120e24] text-slate-300">
            <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">
              ไม่สามารถโหลดเนื้อหาจากภายนอกได้
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              เซิร์ฟเวอร์ปลายทางอาจปฏิเสธการฝังแบบ IFrame (X-Frame-Options) หรือเครือข่ายขัดข้อง
            </p>
            <ModuleButton
              onClick={handleOpenExternal}
              variant="primary"
              icon={ExternalLink}
            >
              เปิดในแท็บเบราว์เซอร์ภายนอก
            </ModuleButton>
          </div>
        ) : (
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={url}
            title={title}
            className="w-full h-full border-none bg-white select-text"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
          />
        )}
      </div>

      {/* Footer */}
      <ModuleFooter
        leftContent={`Micro-Frontend Container (Isolated Sandbox) • ${hostname}`}
        rightStatus="Host Connected"
      />
    </ModuleContainer>
  );
}
