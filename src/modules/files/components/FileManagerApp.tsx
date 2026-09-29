"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  UploadCloud,
  FolderOpen,
  FileText,
  Image as ImageIcon,
  FileArchive,
  File,
  Trash2,
  Download,
  Copy,
  Check,
  Search,
  Grid,
  List,
  ExternalLink,
  Eye,
  RefreshCw,
  HardDrive,
} from "lucide-react";
import { FileRecord, FileCategory } from "../types";

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function getFileIcon(mime: string, originalName: string) {
  if (mime.startsWith("image/")) return <ImageIcon className="w-5 h-5 text-purple-400" />;
  if (
    mime.includes("pdf") ||
    mime.includes("word") ||
    mime.includes("document") ||
    mime.includes("text") ||
    originalName.endsWith(".doc") ||
    originalName.endsWith(".docx") ||
    originalName.endsWith(".pdf")
  ) {
    return <FileText className="w-5 h-5 text-blue-400" />;
  }
  if (
    mime.includes("zip") ||
    mime.includes("tar") ||
    mime.includes("rar") ||
    originalName.endsWith(".zip") ||
    originalName.endsWith(".rar")
  ) {
    return <FileArchive className="w-5 h-5 text-amber-400" />;
  }
  return <File className="w-5 h-5 text-slate-400" />;
}

export function FileManagerApp({ windowId }: { windowId: string }) {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<FileCategory>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/upload");
      const data = await res.json();
      if (data.files) {
        setFiles(data.files);
      }
    } catch (e) {
      console.error("Failed to load files:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUploadFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setIsUploading(true);
    setUploadProgress(`กำลังอัปโหลด ${fileList.length} ไฟล์...`);

    const formData = new FormData();
    for (let i = 0; i < fileList.length; i++) {
      formData.append("files", fileList[i]);
    }

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.files) {
        setFiles((prev) => [...data.files, ...prev]);
        setUploadProgress(null);
      }
    } catch (e) {
      console.error("Upload error:", e);
      alert("เกิดข้อผิดพลาดในการอัปโหลด");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`คุณต้องการลบไฟล์ "${name}" หรือไม่?`)) return;

    try {
      await fetch(`/api/upload?id=${id}`, { method: "DELETE" });
      setFiles((prev) => prev.filter((f) => f.id !== id));
    } catch (e) {
      console.error("Delete error:", e);
    }
  };

  const handleCopyLink = (file: FileRecord) => {
    const fullUrl = `${window.location.origin}${file.url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(file.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredFiles = files.filter((f) => {
    const matchesSearch =
      f.originalName.toLowerCase().includes(search.toLowerCase()) ||
      f.uploadedBy.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (category === "images") return f.mimeType.startsWith("image/");
    if (category === "documents") {
      return (
        f.mimeType.includes("pdf") ||
        f.mimeType.includes("word") ||
        f.mimeType.includes("document") ||
        f.mimeType.includes("text") ||
        f.originalName.endsWith(".pdf") ||
        f.originalName.endsWith(".docx")
      );
    }
    if (category === "archives") {
      return (
        f.mimeType.includes("zip") ||
        f.mimeType.includes("rar") ||
        f.originalName.endsWith(".zip") ||
        f.originalName.endsWith(".rar")
      );
    }
    return true;
  });

  const totalSize = files.reduce((acc, f) => acc + Number(f.sizeBytes || 0), 0);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        handleUploadFiles(e.dataTransfer.files);
      }}
      className="flex flex-col h-full bg-[#120e24] text-slate-100 select-text font-sans relative"
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleUploadFiles(e.target.files)}
      />

      {/* Drag & Drop Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-indigo-900/80 backdrop-blur-md border-2 border-dashed border-indigo-400 z-50 flex flex-col items-center justify-center p-6 text-center pointer-events-none animate-in fade-in duration-150">
          <UploadCloud className="w-16 h-16 text-white animate-bounce mb-3" />
          <h2 className="text-xl font-bold text-white">วางไฟล์ลงที่นี่เพื่ออัปโหลดทันที</h2>
          <p className="text-xs text-indigo-200 mt-1">
            รองรับรูปภาพ, เอกสาร PDF, Word, Excel, ZIP และอื่นๆ
          </p>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="px-6 py-4 border-b border-white/10 bg-white/[0.02] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <FolderOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              จัดการไฟล์ & อัปโหลด (File & Upload Manager)
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                v1.0.0
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              อัปโหลด จัดเก็บ ดาวน์โหลด และจัดการไฟล์ระบบบน Server
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="cursor-pointer px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-95 disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4" />
            {isUploading ? uploadProgress || "กำลังอัปโหลด..." : "อัปโหลดไฟล์ (Upload)"}
          </button>
        </div>
      </div>

      {/* Storage Metrics & Sub-Bar */}
      <div className="px-6 py-3 border-b border-white/5 bg-white/[0.01] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {/* Category Tabs */}
          <button
            onClick={() => setCategory("all")}
            className={`cursor-pointer px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              category === "all"
                ? "bg-white/15 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ทั้งหมด ({files.length})
          </button>
          <button
            onClick={() => setCategory("images")}
            className={`cursor-pointer px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              category === "images"
                ? "bg-white/15 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            รูปภาพ
          </button>
          <button
            onClick={() => setCategory("documents")}
            className={`cursor-pointer px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              category === "documents"
                ? "bg-white/15 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            เอกสาร
          </button>
          <button
            onClick={() => setCategory("archives")}
            className={`cursor-pointer px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              category === "archives"
                ? "bg-white/15 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ไฟล์บีบอัด
          </button>
        </div>

        {/* View Mode & Metrics */}
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
            <span>พื้นที่ใช้งาน:</span>
            <span className="font-semibold text-white">{formatBytes(totalSize)}</span>
          </div>

          <div className="flex p-0.5 rounded-lg bg-white/5 border border-white/10">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded cursor-pointer ${
                viewMode === "grid" ? "bg-white/20 text-white" : "text-slate-400 hover:text-white"
              }`}
              title="แบบ Grid"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded cursor-pointer ${
                viewMode === "list" ? "bg-white/20 text-white" : "text-slate-400 hover:text-white"
              }`}
              title="แบบ List"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={fetchFiles}
            className="cursor-pointer p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="px-6 py-2.5 bg-white/[0.01] border-b border-white/5">
        <div className="relative max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาชื่อไฟล์ หรือผู้อัปโหลด..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
      </div>

      {/* Main Files Display */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mb-2" />
            กำลังโหลดรายการไฟล์...
          </div>
        ) : filteredFiles.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer border-2 border-dashed border-white/15 hover:border-cyan-500/50 rounded-3xl p-12 text-center flex flex-col items-center justify-center transition-all bg-white/[0.01] hover:bg-white/[0.03]"
          >
            <UploadCloud className="w-12 h-12 text-slate-500 hover:text-cyan-400 transition-colors mb-3" />
            <h3 className="font-semibold text-white text-sm">ยังไม่มีไฟล์ในระบบ</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
              คลิกที่นี่ หรือ ลากไฟล์มาวางในหน้าต่างนี้เพื่อเริ่มต้นอัปโหลดไฟล์
            </p>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredFiles.map((file) => {
              const isImage = file.mimeType.startsWith("image/");
              const isCopied = copiedId === file.id;

              return (
                <div
                  key={file.id}
                  className="group relative p-3 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/40 hover:bg-white/[0.06] transition-all flex flex-col justify-between"
                >
                  {/* Thumbnail / Icon Container */}
                  <div
                    onClick={() => isImage && setPreviewImage(file.url)}
                    className={`w-full h-32 rounded-xl bg-black/40 border border-white/5 overflow-hidden flex items-center justify-center mb-2 relative ${
                      isImage ? "cursor-pointer group-hover:scale-[1.02]" : ""
                    } transition-transform`}
                  >
                    {isImage ? (
                      <img
                        src={file.url}
                        alt={file.originalName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 p-3 text-center">
                        {getFileIcon(file.mimeType, file.originalName)}
                        <span className="text-[10px] text-slate-400 uppercase font-mono truncate max-w-[90px]">
                          {file.originalName.split(".").pop()}
                        </span>
                      </div>
                    )}

                    {/* Quick Preview overlay for images */}
                    {isImage && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs gap-1 font-medium">
                        <Eye className="w-4 h-4" /> ดูรูป
                      </div>
                    )}
                  </div>

                  {/* File Metadata */}
                  <div className="min-w-0">
                    <div
                      className="text-xs font-medium text-white truncate"
                      title={file.originalName}
                    >
                      {file.originalName}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>{formatBytes(file.sizeBytes)}</span>
                      <span className="truncate max-w-[80px]" title={file.uploadedBy}>
                        {file.uploadedBy}
                      </span>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-white/5">
                    <div className="flex items-center gap-1">
                      <a
                        href={file.url}
                        download={file.originalName}
                        className="cursor-pointer p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        title="ดาวน์โหลด (Download)"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => handleCopyLink(file)}
                        className="cursor-pointer p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        title="คัดลอกลิงก์ (Copy URL)"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <button
                      onClick={() => handleDelete(file.id, file.originalName)}
                      className="cursor-pointer p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                      title="ลบไฟล์"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table List View */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">ชื่อไฟล์</th>
                  <th className="py-2.5 px-3">ประเภท (MIME)</th>
                  <th className="py-2.5 px-3">ขนาด</th>
                  <th className="py-2.5 px-3">ผู้อัปโหลด</th>
                  <th className="py-2.5 px-3">วันที่อัปโหลด</th>
                  <th className="py-2.5 px-3 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5">
                        {getFileIcon(file.mimeType, file.originalName)}
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-white hover:text-cyan-400 truncate max-w-xs transition-colors"
                        >
                          {file.originalName}
                        </a>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                      {file.mimeType}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-mono">
                      {formatBytes(file.sizeBytes)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{file.uploadedBy}</td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {new Date(file.uploadedAt).toLocaleString("th-TH")}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleCopyLink(file)}
                          className="cursor-pointer p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                          title="คัดลอกลิงก์"
                        >
                          {copiedId === file.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <a
                          href={file.url}
                          download={file.originalName}
                          className="cursor-pointer p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                          title="ดาวน์โหลด"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleDelete(file.id, file.originalName)}
                          className="cursor-pointer p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                          title="ลบ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl max-h-[85vh] bg-[#16112a] border border-white/20 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="p-3 border-b border-white/10 flex items-center justify-between bg-black/30">
              <span className="text-xs font-semibold text-white">ดูตัวอย่างรูปภาพ</span>
              <button
                onClick={() => setPreviewImage(null)}
                className="cursor-pointer px-2.5 py-1 rounded-lg bg-white/10 text-white text-xs hover:bg-white/20 transition-colors"
              >
                ปิด
              </button>
            </div>
            <div className="p-4 flex items-center justify-center overflow-auto max-h-[75vh]">
              <img
                src={previewImage}
                alt="Preview"
                className="max-w-full max-h-[70vh] rounded-lg object-contain shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
