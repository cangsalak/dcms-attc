"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  UploadCloud,
  FolderOpen,
  Folder,
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
  ChevronRight,
  Eye,
  RefreshCw,
  HardDrive,
  Share2,
  Plus,
  Home,
  Database,
  Info,
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
  const [selectedFolder, setSelectedFolder] = useState<string>("uploads");
  const [category, setCategory] = useState<FileCategory>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
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
      if (selectedFileId === id) setSelectedFileId(null);
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

  const selectedFile = files.find((f) => f.id === selectedFileId);
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
        <div className="absolute inset-0 bg-blue-900/80 backdrop-blur-md border-2 border-dashed border-cyan-400 z-50 flex flex-col items-center justify-center p-6 text-center pointer-events-none animate-in fade-in duration-150">
          <UploadCloud className="w-16 h-16 text-white animate-bounce mb-3" />
          <h2 className="text-xl font-bold text-white">วางไฟล์ลงที่นี่เพื่ออัปโหลดทันที (File Station)</h2>
          <p className="text-xs text-cyan-200 mt-1">
            รองรับรูปภาพ, เอกสาร PDF, Word, Excel, ZIP และไฟล์ทุกประเภท
          </p>
        </div>
      )}

      {/* Synology File Station Action Bar */}
      <div className="px-4 py-2 border-b border-white/10 bg-white/[0.03] flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="cursor-pointer px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-blue-600/30"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{isUploading ? uploadProgress || "กำลังอัปโหลด..." : "อัปโหลด (Upload)"}</span>
          </button>

          <button
            onClick={() => {
              const name = prompt("ตั้งชื่อโฟลเดอร์ใหม่:");
              if (name) alert(`สร้างโฟลเดอร์ "${name}" เรียบร้อยแล้ว`);
            }}
            className="cursor-pointer px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 flex items-center gap-1.5 transition-colors border border-white/10"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>สร้าง (Create)</span>
          </button>

          {selectedFile && (
            <>
              <a
                href={selectedFile.url}
                download={selectedFile.originalName}
                className="cursor-pointer px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 flex items-center gap-1.5 transition-colors border border-white/10"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>ดาวน์โหลด</span>
              </a>

              <button
                onClick={() => handleCopyLink(selectedFile)}
                className="cursor-pointer px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 flex items-center gap-1.5 transition-colors border border-white/10"
              >
                {copiedId === selectedFile.id ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Share2 className="w-3.5 h-3.5 text-blue-400" />
                )}
                <span>แชร์ลิงก์</span>
              </button>

              <button
                onClick={() => handleDelete(selectedFile.id, selectedFile.originalName)}
                className="cursor-pointer px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 flex items-center gap-1.5 transition-colors border border-rose-500/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ลบ</span>
              </button>
            </>
          )}
        </div>

        {/* View mode & Search */}
        <div className="flex items-center gap-2">
          <div className="relative w-44">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหา..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg bg-black/30 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex p-0.5 rounded-lg bg-black/30 border border-white/10">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1 rounded cursor-pointer ${
                viewMode === "grid" ? "bg-white/20 text-white" : "text-slate-400 hover:text-white"
              }`}
              title="Grid"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1 rounded cursor-pointer ${
                viewMode === "list" ? "bg-white/20 text-white" : "text-slate-400 hover:text-white"
              }`}
              title="List"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={fetchFiles}
            className="cursor-pointer p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
            title="รีเฟรช"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Synology Breadcrumb Path Bar */}
      <div className="px-4 py-1.5 border-b border-white/5 bg-black/20 flex items-center gap-1.5 text-xs text-slate-400">
        <Home className="w-3.5 h-3.5 text-slate-500" />
        <span>DCMS Station</span>
        <ChevronRight className="w-3 h-3 text-slate-600" />
        <span>public</span>
        <ChevronRight className="w-3 h-3 text-slate-600" />
        <span className="font-semibold text-white">{selectedFolder}</span>
      </div>

      {/* Main Workspace (Left Sidebar Tree + Right File List) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Tree Pane (Synology Folder Tree) */}
        <div className="w-52 border-r border-white/10 bg-white/[0.01] p-3 flex flex-col gap-1 shrink-0 overflow-y-auto">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
            โฟลเดอร์ที่แชร์
          </div>

          <button
            onClick={() => {
              setSelectedFolder("uploads");
              setCategory("all");
            }}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${
              selectedFolder === "uploads" && category === "all"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-300 hover:bg-white/5"
            }`}
          >
            <FolderOpen className="w-4 h-4 text-cyan-400" />
            <span>uploads (ไฟล์ทั้งหมด)</span>
          </button>

          <button
            onClick={() => {
              setSelectedFolder("photos");
              setCategory("images");
            }}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${
              category === "images"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-300 hover:bg-white/5"
            }`}
          >
            <ImageIcon className="w-4 h-4 text-purple-400" />
            <span>photo (รูปภาพ)</span>
          </button>

          <button
            onClick={() => {
              setSelectedFolder("documents");
              setCategory("documents");
            }}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${
              category === "documents"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-300 hover:bg-white/5"
            }`}
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span>documents (เอกสาร)</span>
          </button>

          <button
            onClick={() => {
              setSelectedFolder("archives");
              setCategory("archives");
            }}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${
              category === "archives"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-300 hover:bg-white/5"
            }`}
          >
            <FileArchive className="w-4 h-4 text-amber-400" />
            <span>archive (ไฟล์บีบอัด)</span>
          </button>

          <div className="border-t border-white/10 my-2" />

          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
            อุปกรณ์จัดเก็บ
          </div>

          <div className="px-2.5 py-2 rounded-lg bg-black/20 border border-white/5 text-[11px] space-y-1">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
              <span>Volume 1</span>
            </div>
            <div className="text-slate-400 text-[10px]">
              พื้นที่: {formatBytes(totalSize)} / 500 GB
            </div>
          </div>
        </div>

        {/* Right Content Pane */}
        <div className="flex-1 overflow-auto p-4 flex flex-col justify-between">
          <div>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mb-2" />
                กำลังโหลด File Station...
              </div>
            ) : filteredFiles.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-white/10 hover:border-cyan-500/50 rounded-2xl p-12 text-center flex flex-col items-center justify-center transition-all bg-white/[0.01] hover:bg-white/[0.03]"
              >
                <UploadCloud className="w-12 h-12 text-slate-500 hover:text-cyan-400 transition-colors mb-3" />
                <h3 className="font-semibold text-white text-sm">โฟลเดอร์นี้ยังไม่มีไฟล์</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
                  คลิกที่นี่ หรือ ลากไฟล์มาวางใน File Station เพื่อเริ่มต้นอัปโหลด
                </p>
              </div>
            ) : viewMode === "grid" ? (
              /* Synology DSM Grid View */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredFiles.map((file) => {
                  const isImage = file.mimeType.startsWith("image/");
                  const isSelected = selectedFileId === file.id;

                  return (
                    <div
                      key={file.id}
                      onClick={() => setSelectedFileId(file.id)}
                      onDoubleClick={() => isImage && setPreviewImage(file.url)}
                      className={`group relative p-2.5 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? "bg-blue-600/20 border-blue-500 shadow-md ring-1 ring-blue-400/30"
                          : "bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="w-full h-28 rounded-lg bg-black/40 border border-white/5 overflow-hidden flex items-center justify-center mb-2 relative">
                        {isImage ? (
                          <img
                            src={file.url}
                            alt={file.originalName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-1 p-2 text-center">
                            {getFileIcon(file.mimeType, file.originalName)}
                            <span className="text-[10px] text-slate-400 uppercase font-mono truncate max-w-[80px]">
                              {file.originalName.split(".").pop()}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div
                          className="text-xs font-medium text-white truncate"
                          title={file.originalName}
                        >
                          {file.originalName}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex justify-between">
                          <span>{formatBytes(file.sizeBytes)}</span>
                          <span className="truncate max-w-[70px]">{file.uploadedBy}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Synology DSM List View */
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="py-2 px-3">ชื่อไฟล์</th>
                      <th className="py-2 px-3">ขนาด</th>
                      <th className="py-2 px-3">ประเภท</th>
                      <th className="py-2 px-3">ผู้อัปโหลด</th>
                      <th className="py-2 px-3">วันที่แก้ไข</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredFiles.map((file) => {
                      const isSelected = selectedFileId === file.id;
                      return (
                        <tr
                          key={file.id}
                          onClick={() => setSelectedFileId(file.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? "bg-blue-600/20" : "hover:bg-white/[0.02]"
                          }`}
                        >
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              {getFileIcon(file.mimeType, file.originalName)}
                              <span className="font-medium text-white truncate max-w-xs">
                                {file.originalName}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-slate-300 font-mono">
                            {formatBytes(file.sizeBytes)}
                          </td>
                          <td className="py-2 px-3 text-slate-400 text-[11px]">
                            {file.mimeType}
                          </td>
                          <td className="py-2 px-3 text-slate-300">{file.uploadedBy}</td>
                          <td className="py-2 px-3 text-slate-400">
                            {new Date(file.uploadedAt).toLocaleDateString("th-TH")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Synology File Station Status Footer */}
          <div className="pt-3 mt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <div>
              <span>{filteredFiles.length} รายการ</span>
              {selectedFile && (
                <span className="ml-2 text-cyan-300">
                  (เลือก 1 รายการ: {selectedFile.originalName} • {formatBytes(selectedFile.sizeBytes)})
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span>Synology File Station Protocol</span>
              <span>•</span>
              <span className="text-emerald-400">Healthy</span>
            </div>
          </div>
        </div>
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
              <span className="text-xs font-semibold text-white">ดูตัวอย่างรูปภาพ (Photo Viewer)</span>
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
