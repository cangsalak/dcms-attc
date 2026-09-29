"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  UploadCloud,
  FolderOpen,
  Folder,
  FolderPlus,
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
  ArrowLeft,
  Eye,
  RefreshCw,
  HardDrive,
  Share2,
  Plus,
  Home,
  X,
  AlertCircle,
} from "lucide-react";
import { FileRecord, FolderItem, FileCategory } from "../types";

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
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [allFolders, setAllFolders] = useState<FolderItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string>("root");
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([
    { id: "root", name: "uploads" },
  ]);

  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<FileCategory>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // New folder modal state
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderError, setFolderError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async (folderId: string = currentFolderId) => {
    try {
      setIsLoading(true);
      // Fetch files in this folder
      const filesUrl =
        category === "all"
          ? `/api/upload?folderId=${folderId}`
          : `/api/upload?folderId=all`;
      const filesRes = await fetch(filesUrl);
      const filesData = await filesRes.json();
      if (filesData.files) {
        setFiles(filesData.files);
      }

      // Fetch folders in this folder
      const foldersRes = await fetch(`/api/folders?parentId=${folderId}`);
      const foldersData = await foldersRes.json();
      if (foldersData.folders) {
        setFolders(foldersData.folders);
      }

      // Also fetch all root/main folders for sidebar
      const allFoldersRes = await fetch(`/api/folders?parentId=root`);
      const allFoldersData = await allFoldersRes.json();
      if (allFoldersData.folders) {
        setAllFolders(allFoldersData.folders);
      }
    } catch (e) {
      console.error("Failed to load folder data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(currentFolderId);
  }, [currentFolderId, category]);

  // Navigate into a folder
  const handleOpenFolder = (f: FolderItem) => {
    setCurrentFolderId(f.id);
    setBreadcrumbs((prev) => [...prev, { id: f.id, name: f.name }]);
    setSelectedFileId(null);
    setSelectedFolderId(null);
  };

  // Navigate to breadcrumb
  const handleNavigateBreadcrumb = (index: number) => {
    const target = breadcrumbs[index];
    const newCrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newCrumbs);
    setCurrentFolderId(target.id);
    setSelectedFileId(null);
    setSelectedFolderId(null);
  };

  // Step up one folder
  const handleGoBack = () => {
    if (breadcrumbs.length > 1) {
      handleNavigateBreadcrumb(breadcrumbs.length - 2);
    }
  };

  // Create folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setFolderError(null);
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parentId: currentFolderId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFolderError(data.error || "เกิดข้อผิดพลาดในการสร้างโฟลเดอร์");
        return;
      }

      setFolders((prev) => [...prev, data.folder]);
      setNewFolderName("");
      setShowFolderModal(false);
      loadData(currentFolderId);
    } catch (e: any) {
      setFolderError(e.message || "เกิดข้อผิดพลาด");
    }
  };

  // Delete folder
  const handleDeleteFolder = async (id: string, name: string) => {
    if (!confirm(`คุณต้องการลบโฟลเดอร์ "${name}" และไฟล์ทั้งหมดข้างในหรือไม่?`)) return;

    try {
      await fetch(`/api/folders?id=${id}`, { method: "DELETE" });
      setFolders((prev) => prev.filter((f) => f.id !== id));
      if (selectedFolderId === id) setSelectedFolderId(null);
      loadData(currentFolderId);
    } catch (e) {
      console.error("Delete folder error:", e);
    }
  };

  // Upload files to current folder
  const handleUploadFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setIsUploading(true);
    setUploadProgress(`กำลังอัปโหลด ${fileList.length} ไฟล์ลงโฟลเดอร์...`);

    const formData = new FormData();
    for (let i = 0; i < fileList.length; i++) {
      formData.append("files", fileList[i]);
    }
    formData.append("folderId", currentFolderId);

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

  // Delete file
  const handleDeleteFile = async (id: string, name: string) => {
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

  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

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
          <h2 className="text-xl font-bold text-white">วางไฟล์ลงที่นี่เพื่ออัปโหลดลงโฟลเดอร์นี้</h2>
          <p className="text-xs text-cyan-200 mt-1">
            ปลายทาง: {breadcrumbs.map((b) => b.name).join(" / ")}
          </p>
        </div>
      )}

      {/* Synology File Station Action Bar */}
      <div className="px-4 py-2 border-b border-white/10 bg-white/[0.03] flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="cursor-pointer px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-blue-600/30"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{isUploading ? uploadProgress || "กำลังอัปโหลด..." : "อัปโหลด (Upload)"}</span>
          </button>

          {/* New Folder Button */}
          <button
            onClick={() => {
              setFolderError(null);
              setNewFolderName("");
              setShowFolderModal(true);
            }}
            className="cursor-pointer px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium flex items-center gap-1.5 transition-colors border border-white/15"
          >
            <FolderPlus className="w-4 h-4 text-amber-400" />
            <span>สร้างโฟลเดอร์ (New Folder)</span>
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
                onClick={() => handleDeleteFile(selectedFile.id, selectedFile.originalName)}
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
            onClick={() => loadData(currentFolderId)}
            className="cursor-pointer p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
            title="รีเฟรช"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Synology Breadcrumb Path Bar */}
      <div className="px-4 py-1.5 border-b border-white/5 bg-black/20 flex items-center gap-1.5 text-xs text-slate-400">
        <button
          onClick={handleGoBack}
          disabled={breadcrumbs.length <= 1}
          className="cursor-pointer p-1 rounded hover:bg-white/10 text-slate-300 disabled:opacity-30 disabled:pointer-events-none mr-1"
          title="ย้อนกลับ"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>

        <Home className="w-3.5 h-3.5 text-slate-500" />
        <span>DCMS Station</span>

        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={crumb.id}>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <button
              onClick={() => handleNavigateBreadcrumb(idx)}
              className={`cursor-pointer hover:text-cyan-300 font-medium transition-colors ${
                idx === breadcrumbs.length - 1 ? "text-white font-bold" : "text-slate-400"
              }`}
            >
              {crumb.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Main Workspace (Left Sidebar Tree + Right Content) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Tree Pane (Synology Folder Tree) */}
        <div className="w-56 border-r border-white/10 bg-white/[0.01] p-3 flex flex-col gap-1 shrink-0 overflow-y-auto">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
            โฟลเดอร์หลัก (Root)
          </div>

          <button
            onClick={() => {
              setCurrentFolderId("root");
              setBreadcrumbs([{ id: "root", name: "uploads" }]);
              setCategory("all");
            }}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${
              currentFolderId === "root" && category === "all"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-300 hover:bg-white/5"
            }`}
          >
            <FolderOpen className="w-4 h-4 text-cyan-400" />
            <span>uploads (รูท)</span>
          </button>

          {/* Subfolders in Root */}
          {allFolders.length > 0 && (
            <div className="pl-3 space-y-0.5 border-l border-white/10 my-1">
              {allFolders.map((fld) => (
                <button
                  key={fld.id}
                  onClick={() => {
                    setCurrentFolderId(fld.id);
                    setBreadcrumbs([
                      { id: "root", name: "uploads" },
                      { id: fld.id, name: fld.name },
                    ]);
                    setCategory("all");
                  }}
                  className={`w-full flex items-center justify-between px-2 py-1 rounded-md text-[11px] font-medium transition-all text-left ${
                    currentFolderId === fld.id
                      ? "bg-blue-600/30 text-white border border-blue-500/40"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{fld.name}</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {fld.fileCount}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-white/10 my-2" />

          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
            หมวดหมู่ (Categories)
          </div>

          <button
            onClick={() => setCategory("images")}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${
              category === "images"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-300 hover:bg-white/5"
            }`}
          >
            <ImageIcon className="w-4 h-4 text-purple-400" />
            <span>รูปภาพ (Photos)</span>
          </button>

          <button
            onClick={() => setCategory("documents")}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${
              category === "documents"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-300 hover:bg-white/5"
            }`}
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span>เอกสาร (Documents)</span>
          </button>

          <button
            onClick={() => setCategory("archives")}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${
              category === "archives"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-300 hover:bg-white/5"
            }`}
          >
            <FileArchive className="w-4 h-4 text-amber-400" />
            <span>ไฟล์บีบอัด (Archives)</span>
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
            ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-white/10 hover:border-cyan-500/50 rounded-2xl p-12 text-center flex flex-col items-center justify-center transition-all bg-white/[0.01] hover:bg-white/[0.03]"
              >
                <UploadCloud className="w-12 h-12 text-slate-500 hover:text-cyan-400 transition-colors mb-3" />
                <h3 className="font-semibold text-white text-sm">โฟลเดอร์นี้ยังว่างเปล่า</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
                  คลิกปุ่ม <strong>สร้างโฟลเดอร์</strong> เพื่อสร้างโฟลเดอร์ย่อย หรือคลิก <strong>อัปโหลดไฟล์</strong> เพื่อเพิ่มไฟล์ใหม่
                </p>
              </div>
            ) : viewMode === "grid" ? (
              /* Synology DSM Grid View (Folders first, then Files) */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {/* 1. Folders in current directory */}
                {category === "all" &&
                  filteredFolders.map((fld) => {
                    const isSelected = selectedFolderId === fld.id;

                    return (
                      <div
                        key={fld.id}
                        onClick={() => {
                          setSelectedFolderId(fld.id);
                          setSelectedFileId(null);
                        }}
                        onDoubleClick={() => handleOpenFolder(fld)}
                        className={`group relative p-3 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? "bg-amber-500/20 border-amber-400 shadow-md ring-1 ring-amber-400/30"
                            : "bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.05]"
                        }`}
                      >
                        <div className="w-full h-24 rounded-lg bg-black/30 border border-white/5 flex flex-col items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                          <Folder className="w-10 h-10 text-amber-400 fill-amber-400/20 drop-shadow" />
                          <span className="text-[10px] text-amber-200/80 font-mono mt-1">
                            {fld.fileCount} ไฟล์
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div
                            className="text-xs font-semibold text-white truncate"
                            title={fld.name}
                          >
                            {fld.name}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex justify-between items-center">
                            <span>โฟลเดอร์</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFolder(fld.id, fld.name);
                              }}
                              className="cursor-pointer opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 text-slate-500 transition-opacity"
                              title="ลบโฟลเดอร์"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {/* 2. Files in current directory */}
                {filteredFiles.map((file) => {
                  const isImage = file.mimeType.startsWith("image/");
                  const isSelected = selectedFileId === file.id;

                  return (
                    <div
                      key={file.id}
                      onClick={() => {
                        setSelectedFileId(file.id);
                        setSelectedFolderId(null);
                      }}
                      onDoubleClick={() => isImage && setPreviewImage(file.url)}
                      className={`group relative p-2.5 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? "bg-blue-600/20 border-blue-500 shadow-md ring-1 ring-blue-400/30"
                          : "bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="w-full h-24 rounded-lg bg-black/40 border border-white/5 overflow-hidden flex items-center justify-center mb-2 relative">
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
                      <th className="py-2 px-3">ชื่อ</th>
                      <th className="py-2 px-3">ขนาด</th>
                      <th className="py-2 px-3">ประเภท</th>
                      <th className="py-2 px-3">สร้างโดย</th>
                      <th className="py-2 px-3">วันที่แก้ไข</th>
                      <th className="py-2 px-3 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {/* Folders in List view */}
                    {category === "all" &&
                      filteredFolders.map((fld) => (
                        <tr
                          key={fld.id}
                          onClick={() => setSelectedFolderId(fld.id)}
                          onDoubleClick={() => handleOpenFolder(fld)}
                          className={`cursor-pointer transition-colors ${
                            selectedFolderId === fld.id
                              ? "bg-amber-500/20"
                              : "hover:bg-white/[0.02]"
                          }`}
                        >
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <Folder className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                              <span className="font-semibold text-white truncate max-w-xs">
                                {fld.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-slate-400 font-mono">
                            {fld.fileCount} รายการ
                          </td>
                          <td className="py-2 px-3 text-slate-400 text-[11px]">
                            โฟลเดอร์ไฟล์
                          </td>
                          <td className="py-2 px-3 text-slate-300">{fld.createdBy}</td>
                          <td className="py-2 px-3 text-slate-400">
                            {new Date(fld.createdAt).toLocaleDateString("th-TH")}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFolder(fld.id, fld.name);
                              }}
                              className="cursor-pointer p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                              title="ลบโฟลเดอร์"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}

                    {/* Files in List view */}
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
                          <td className="py-2 px-3 text-right">
                            <button
                              onClick={() => handleDeleteFile(file.id, file.originalName)}
                              className="cursor-pointer p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                              title="ลบไฟล์"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
              <span>
                {filteredFolders.length} โฟลเดอร์, {filteredFiles.length} ไฟล์
              </span>
              {selectedFile && (
                <span className="ml-2 text-cyan-300">
                  (เลือก 1 ไฟล์: {selectedFile.originalName} • {formatBytes(selectedFile.sizeBytes)})
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span>ตำแหน่ง: /{breadcrumbs.map((b) => b.name).join("/")}</span>
              <span>•</span>
              <span className="text-emerald-400">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Create New Folder */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#181330] border border-white/20 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-amber-400" /> สร้างโฟลเดอร์ใหม่
              </h3>
              <button
                onClick={() => setShowFolderModal(false)}
                className="cursor-pointer text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              สร้างโฟลเดอร์ย่อยใน: <span className="text-cyan-300 font-mono">/{breadcrumbs.map((b) => b.name).join("/")}</span>
            </p>

            {folderError && (
              <div className="mb-3 p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{folderError}</span>
              </div>
            )}

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  ชื่อโฟลเดอร์ (Folder Name)
                </label>
                <input
                  autoFocus
                  type="text"
                  required
                  placeholder="เช่น เอกสารบัญชี, รูปกิจกรรม 2026"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  className="cursor-pointer px-3.5 py-1.5 text-xs rounded-lg hover:bg-white/10 text-slate-300"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="cursor-pointer px-4 py-1.5 text-xs rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-md shadow-amber-500/20"
                >
                  สร้างโฟลเดอร์
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
