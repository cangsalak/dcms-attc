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
  Lock,
  Shield,
  Users,
  Building2,
  Sliders,
  Settings2,
  CheckCircle2,
} from "lucide-react";
import { FileRecord, FolderItem, FileCategory, FolderAccessType, FolderPermissionLevel } from "../types";
import { useAuth } from "@/core/context/AuthContext";

const AVAILABLE_ROLES = ["Super Admin", "Admin", "Manager", "Member"];

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
  const { user } = useAuth();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [allFolders, setAllFolders] = useState<FolderItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string>("root");
  const [currentFolderInfo, setCurrentFolderInfo] = useState<FolderItem | null>(null);
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
  const [newFolderAccessType, setNewFolderAccessType] = useState<FolderAccessType>("public");
  const [newFolderAllowedRoles, setNewFolderAllowedRoles] = useState<string[]>(AVAILABLE_ROLES);
  const [newFolderDept, setNewFolderDept] = useState<string>(user?.department || "");
  const [newFolderPermLevel, setNewFolderPermLevel] = useState<FolderPermissionLevel>("read_write");
  const [folderError, setFolderError] = useState<string | null>(null);

  // Permissions & Properties Modal state
  const [showPermModal, setShowPermModal] = useState(false);
  const [permTargetFolder, setPermTargetFolder] = useState<FolderItem | null>(null);
  const [permTab, setPermTab] = useState<"general" | "permissions">("permissions");
  const [editName, setEditName] = useState("");
  const [editAccessType, setEditAccessType] = useState<FolderAccessType>("public");
  const [editAllowedRoles, setEditAllowedRoles] = useState<string[]>(AVAILABLE_ROLES);
  const [editDept, setEditDept] = useState("");
  const [editPermLevel, setEditPermLevel] = useState<FolderPermissionLevel>("read_write");
  const [permLoading, setPermLoading] = useState(false);
  const [permError, setPermError] = useState<string | null>(null);
  const [permSuccess, setPermSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async (folderId: string = currentFolderId) => {
    try {
      setIsLoading(true);

      // 1. Fetch current folder details if not root
      if (folderId !== "root") {
        try {
          const singleRes = await fetch(`/api/folders?id=${folderId}`);
          const singleData = await singleRes.json();
          if (singleData.folder) {
            setCurrentFolderInfo(singleData.folder);
          } else {
            setCurrentFolderInfo(null);
          }
        } catch {
          setCurrentFolderInfo(null);
        }
      } else {
        setCurrentFolderInfo(null);
      }

      // 2. Fetch files in this folder
      const filesUrl =
        category === "all"
          ? `/api/upload?folderId=${folderId}`
          : `/api/upload?folderId=all`;
      const filesRes = await fetch(filesUrl);
      const filesData = await filesRes.json();
      if (filesData.files) {
        setFiles(filesData.files);
      }

      // 3. Fetch subfolders in this folder
      const foldersRes = await fetch(`/api/folders?parentId=${folderId}`);
      const foldersData = await foldersRes.json();
      if (foldersData.folders) {
        setFolders(foldersData.folders);
      }

      // 4. Also fetch all root/main folders for sidebar
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

  // Open Permission Modal for a folder
  const handleOpenPermissions = (fld: FolderItem) => {
    setPermTargetFolder(fld);
    setEditName(fld.name);
    setEditAccessType(fld.accessType || "public");
    setEditAllowedRoles(fld.allowedRoles || AVAILABLE_ROLES);
    setEditDept(fld.department || "");
    setEditPermLevel(fld.permissionLevel || "read_write");
    setPermTab("permissions");
    setPermError(null);
    setPermSuccess(null);
    setShowPermModal(true);
  };

  // Save updated permissions
  const handleSavePermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permTargetFolder) return;

    setPermLoading(true);
    setPermError(null);
    setPermSuccess(null);

    try {
      const res = await fetch("/api/folders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: permTargetFolder.id,
          name: editName.trim(),
          accessType: editAccessType,
          allowedRoles: editAllowedRoles,
          department: editDept.trim(),
          permissionLevel: editPermLevel,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setPermError(data.error || "เกิดข้อผิดพลาดในการบันทึกสิทธิ์");
        return;
      }

      setPermSuccess("บันทึกการตั้งค่าสิทธิ์เรียบร้อยแล้ว");
      setTimeout(() => {
        setShowPermModal(false);
        loadData(currentFolderId);
      }, 700);
    } catch (e: any) {
      setPermError(e.message || "เกิดข้อผิดพลาด");
    } finally {
      setPermLoading(false);
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
          accessType: newFolderAccessType,
          allowedRoles: newFolderAllowedRoles,
          department: newFolderDept.trim(),
          permissionLevel: newFolderPermLevel,
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
      const res = await fetch(`/api/folders?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "ไม่สามารถลบโฟลเดอร์ได้");
        return;
      }
      setFolders((prev) => prev.filter((f) => f.id !== id));
      if (selectedFolderId === id) setSelectedFolderId(null);
      loadData(currentFolderId);
    } catch (e) {
      console.error("Delete folder error:", e);
    }
  };

  // Check if current user has write access to current folder
  const isReadOnlyCurrentFolder =
    currentFolderInfo !== null && currentFolderInfo.currentUserCanWrite === false;

  // Upload files to current folder
  const handleUploadFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    if (isReadOnlyCurrentFolder) {
      alert("คุณไม่มีสิทธิ์อัปโหลดไฟล์ในโฟลเดอร์นี้ (สิทธิ์เปิดให้อ่านอย่างเดียว หรือไม่มีสิทธิ์เขียน)");
      return;
    }

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
      if (!res.ok) {
        alert(data.error || "เกิดข้อผิดพลาดในการอัปโหลด");
        return;
      }
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
      const res = await fetch(`/api/upload?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "ไม่สามารถลบไฟล์ได้");
        return;
      }
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
  const selectedFolder = folders.find((f) => f.id === selectedFolderId);
  const totalSize = files.reduce((acc, f) => acc + Number(f.sizeBytes || 0), 0);

  // Helper badge render for folder permissions
  const renderFolderPermissionBadge = (fld: FolderItem) => {
    const access = fld.accessType || "public";
    const isReadOnly = fld.permissionLevel === "read_only";

    return (
      <div className="flex items-center gap-1 flex-wrap">
        {access === "private" && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <Lock className="w-2.5 h-2.5" /> ส่วนตัว
          </span>
        )}
        {access === "role" && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Users className="w-2.5 h-2.5" /> บทบาท
          </span>
        )}
        {access === "department" && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <Building2 className="w-2.5 h-2.5" /> {fld.department || "แผนก"}
          </span>
        )}
        {isReadOnly && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Eye className="w-2.5 h-2.5" /> อ่านอย่างเดียว
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!isReadOnlyCurrentFolder) setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (!isReadOnlyCurrentFolder) handleUploadFiles(e.dataTransfer.files);
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
      <div className="px-4 py-2 border-b border-white/10 bg-white/[0.03] flex items-center justify-between gap-3 text-xs flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isReadOnlyCurrentFolder}
            title={isReadOnlyCurrentFolder ? "โฟลเดอร์นี้เปิดให้อ่านอย่างเดียว" : "อัปโหลดไฟล์"}
            className="cursor-pointer px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-600/30"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{isUploading ? uploadProgress || "กำลังอัปโหลด..." : "อัปโหลด (Upload)"}</span>
          </button>

          {/* New Folder Button */}
          <button
            onClick={() => {
              setFolderError(null);
              setNewFolderName("");
              setNewFolderAccessType("public");
              setNewFolderAllowedRoles(AVAILABLE_ROLES);
              setNewFolderDept(user?.department || "");
              setNewFolderPermLevel("read_write");
              setShowFolderModal(true);
            }}
            disabled={isReadOnlyCurrentFolder}
            title={isReadOnlyCurrentFolder ? "โฟลเดอร์นี้เปิดให้อ่านอย่างเดียว" : "สร้างโฟลเดอร์ใหม่"}
            className="cursor-pointer px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium flex items-center gap-1.5 transition-colors border border-white/15 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FolderPlus className="w-4 h-4 text-amber-400" />
            <span>สร้างโฟลเดอร์ (New Folder)</span>
          </button>

          {/* Folder Selected Actions */}
          {selectedFolder && (
            <>
              <button
                onClick={() => handleOpenPermissions(selectedFolder)}
                className="cursor-pointer px-2.5 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 flex items-center gap-1.5 transition-colors border border-indigo-500/40"
                title="จัดการสิทธิ์และการเข้าถึงโฟลเดอร์"
              >
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span>สิทธิ์ & คุณสมบัติ (Permissions)</span>
              </button>

              {selectedFolder.currentUserCanManage !== false && (
                <button
                  onClick={() => handleDeleteFolder(selectedFolder.id, selectedFolder.name)}
                  className="cursor-pointer px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 flex items-center gap-1.5 transition-colors border border-rose-500/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ลบโฟลเดอร์</span>
                </button>
              )}
            </>
          )}

          {/* Inside Folder Actions (When no item selected, can view current folder permissions) */}
          {!selectedFolder && !selectedFile && currentFolderInfo && (
            <button
              onClick={() => handleOpenPermissions(currentFolderInfo)}
              className="cursor-pointer px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 flex items-center gap-1.5 transition-colors border border-white/10"
              title="ดูสิทธิ์ของโฟลเดอร์ปัจจุบัน"
            >
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>สิทธิ์โฟลเดอร์นี้</span>
            </button>
          )}

          {/* File Selected Actions */}
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

              {!isReadOnlyCurrentFolder && (
                <button
                  onClick={() => handleDeleteFile(selectedFile.id, selectedFile.originalName)}
                  className="cursor-pointer px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 flex items-center gap-1.5 transition-colors border border-rose-500/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ลบ</span>
                </button>
              )}
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
      <div className="px-4 py-1.5 border-b border-white/5 bg-black/20 flex items-center justify-between gap-1.5 text-xs text-slate-400">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <button
            onClick={handleGoBack}
            disabled={breadcrumbs.length <= 1}
            className="cursor-pointer p-1 rounded hover:bg-white/10 text-slate-300 disabled:opacity-30 disabled:pointer-events-none mr-1"
            title="ย้อนกลับ"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>

          <Home className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="shrink-0">DCMS Station</span>

          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.id}>
              <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
              <button
                onClick={() => handleNavigateBreadcrumb(idx)}
                className={`cursor-pointer hover:text-cyan-300 font-medium transition-colors truncate max-w-[120px] ${
                  idx === breadcrumbs.length - 1 ? "text-white font-bold" : "text-slate-400"
                }`}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Current folder permission indicator */}
        {currentFolderInfo && (
          <div className="shrink-0 flex items-center gap-1.5">
            {renderFolderPermissionBadge(currentFolderInfo)}
          </div>
        )}
      </div>

      {/* Read-Only Warning Banner */}
      {isReadOnlyCurrentFolder && (
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400 shrink-0" />
            <span>โฟลเดอร์นี้เปิดให้อ่านอย่างเดียว (Read-Only) คุณสามารถเปิดดูและดาวน์โหลดไฟล์ได้เท่านั้น</span>
          </div>
          <span className="text-[11px] text-amber-400 font-medium">สิทธิ์: ดูข้อมูล</span>
        </div>
      )}

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
            <FolderOpen className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="truncate">uploads (รูท)</span>
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
                    {fld.accessType === "private" ? (
                      <Lock className="w-3 h-3 text-rose-400 shrink-0" />
                    ) : (
                      <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
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
                onClick={() => {
                  if (!isReadOnlyCurrentFolder) fileInputRef.current?.click();
                }}
                className={`border-2 border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center transition-all ${
                  isReadOnlyCurrentFolder
                    ? "border-white/10 bg-white/[0.01]"
                    : "cursor-pointer border-white/10 hover:border-cyan-500/50 bg-white/[0.01] hover:bg-white/[0.03]"
                }`}
              >
                <UploadCloud className="w-12 h-12 text-slate-500 mb-3" />
                <h3 className="font-semibold text-white text-sm">
                  {isReadOnlyCurrentFolder ? "ไม่มีไฟล์ในโฟลเดอร์นี้" : "โฟลเดอร์นี้ยังว่างเปล่า"}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
                  {isReadOnlyCurrentFolder
                    ? "คุณมีสิทธิ์อ่านอย่างเดียวในโฟลเดอร์นี้"
                    : "คลิกปุ่ม สร้างโฟลเดอร์ เพื่อจัดหมวดหมู่ หรือคลิก อัปโหลดไฟล์ เพื่อเพิ่มไฟล์ใหม่"}
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
                        <div className="w-full h-24 rounded-lg bg-black/30 border border-white/5 flex flex-col items-center justify-center mb-2 group-hover:scale-105 transition-transform relative">
                          <Folder className="w-10 h-10 text-amber-400 fill-amber-400/20 drop-shadow" />
                          <span className="text-[10px] text-amber-200/80 font-mono mt-1">
                            {fld.fileCount} ไฟล์
                          </span>

                          {/* Quick Permission Badge Top Right */}
                          <div className="absolute top-1.5 right-1.5">
                            {fld.accessType === "private" && (
                              <span title="โฟลเดอร์ส่วนตัว" className="p-1 rounded bg-rose-500/30 text-rose-300 inline-block">
                                <Lock className="w-3 h-3" />
                              </span>
                            )}
                            {fld.accessType === "role" && (
                              <span title="จำกัดตามบทบาท" className="p-1 rounded bg-indigo-500/30 text-indigo-300 inline-block">
                                <Users className="w-3 h-3" />
                              </span>
                            )}
                            {fld.accessType === "department" && (
                              <span title={`แผนก: ${fld.department}`} className="p-1 rounded bg-emerald-500/30 text-emerald-300 inline-block">
                                <Building2 className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div
                            className="text-xs font-semibold text-white truncate"
                            title={fld.name}
                          >
                            {fld.name}
                          </div>
                          <div className="mt-1 flex items-center justify-between">
                            {renderFolderPermissionBadge(fld)}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenPermissions(fld);
                              }}
                              className="cursor-pointer opacity-0 group-hover:opacity-100 p-1 hover:text-indigo-300 text-slate-500 transition-opacity"
                              title="ตั้งค่าสิทธิ์"
                            >
                              <Shield className="w-3 h-3" />
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
                      <th className="py-2 px-3">สิทธิ์การเข้าถึง</th>
                      <th className="py-2 px-3">ขนาด</th>
                      <th className="py-2 px-3">เจ้าของ / สร้างโดย</th>
                      <th className="py-2 px-3">วันที่</th>
                      <th className="py-2 px-3 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {/* Folders in List view */}
                    {category === "all" &&
                      filteredFolders.map((fld) => (
                        <tr
                          key={fld.id}
                          onClick={() => {
                            setSelectedFolderId(fld.id);
                            setSelectedFileId(null);
                          }}
                          onDoubleClick={() => handleOpenFolder(fld)}
                          className={`cursor-pointer transition-colors ${
                            selectedFolderId === fld.id
                              ? "bg-amber-500/20"
                              : "hover:bg-white/[0.02]"
                          }`}
                        >
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              {fld.accessType === "private" ? (
                                <Lock className="w-4 h-4 text-rose-400" />
                              ) : (
                                <Folder className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                              )}
                              <span className="font-semibold text-white truncate max-w-xs">
                                {fld.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 px-3">{renderFolderPermissionBadge(fld)}</td>
                          <td className="py-2 px-3 text-slate-400 font-mono">
                            {fld.fileCount} รายการ
                          </td>
                          <td className="py-2 px-3 text-slate-300">{fld.createdBy}</td>
                          <td className="py-2 px-3 text-slate-400">
                            {new Date(fld.createdAt).toLocaleDateString("th-TH")}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenPermissions(fld);
                                }}
                                className="cursor-pointer p-1 rounded hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300"
                                title="ตั้งค่าสิทธิ์"
                              >
                                <Shield className="w-3.5 h-3.5" />
                              </button>
                              {fld.currentUserCanManage !== false && (
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
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}

                    {/* Files in List view */}
                    {filteredFiles.map((file) => {
                      const isSelected = selectedFileId === file.id;
                      return (
                        <tr
                          key={file.id}
                          onClick={() => {
                            setSelectedFileId(file.id);
                            setSelectedFolderId(null);
                          }}
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
                          <td className="py-2 px-3 text-slate-400 text-[11px]">
                            {file.mimeType}
                          </td>
                          <td className="py-2 px-3 text-slate-300 font-mono">
                            {formatBytes(file.sizeBytes)}
                          </td>
                          <td className="py-2 px-3 text-slate-300">{file.uploadedBy}</td>
                          <td className="py-2 px-3 text-slate-400">
                            {new Date(file.uploadedAt).toLocaleDateString("th-TH")}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {!isReadOnlyCurrentFolder && (
                              <button
                                onClick={() => handleDeleteFile(file.id, file.originalName)}
                                className="cursor-pointer p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                                title="ลบไฟล์"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
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
              {selectedFolder && (
                <span className="ml-2 text-amber-300">
                  (เลือกโฟลเดอร์: {selectedFolder.name})
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

      {/* Modal: Create New Folder (With Permissions) */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#181330] border border-white/20 rounded-2xl p-5 shadow-2xl">
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
              ปลายทาง: <span className="text-cyan-300 font-mono">/{breadcrumbs.map((b) => b.name).join("/")}</span>
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
                  placeholder="เช่น เอกสารบัญชี, แผนกบุคคล, สัญญา"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Access Permission Type */}
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" /> สิทธิ์การเข้าถึง (Access Control)
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label
                    onClick={() => setNewFolderAccessType("public")}
                    className={`cursor-pointer p-2.5 rounded-xl border flex flex-col gap-1 transition-all ${
                      newFolderAccessType === "public"
                        ? "bg-blue-600/30 border-blue-500 text-white"
                        : "bg-black/20 border-white/10 text-slate-400 hover:bg-white/5"
                    }`}
                  >
                    <span className="font-semibold text-white flex items-center gap-1">
                      🌐 สาธารณะ (Public)
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight">
                      ทุกคนในระบบเข้าถึงได้
                    </span>
                  </label>

                  <label
                    onClick={() => setNewFolderAccessType("private")}
                    className={`cursor-pointer p-2.5 rounded-xl border flex flex-col gap-1 transition-all ${
                      newFolderAccessType === "private"
                        ? "bg-rose-600/30 border-rose-500 text-white"
                        : "bg-black/20 border-white/10 text-slate-400 hover:bg-white/5"
                    }`}
                  >
                    <span className="font-semibold text-white flex items-center gap-1">
                      🔒 ส่วนตัว (Private)
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight">
                      เฉพาะฉันและผู้ดูแลระบบ
                    </span>
                  </label>

                  <label
                    onClick={() => setNewFolderAccessType("role")}
                    className={`cursor-pointer p-2.5 rounded-xl border flex flex-col gap-1 transition-all ${
                      newFolderAccessType === "role"
                        ? "bg-indigo-600/30 border-indigo-500 text-white"
                        : "bg-black/20 border-white/10 text-slate-400 hover:bg-white/5"
                    }`}
                  >
                    <span className="font-semibold text-white flex items-center gap-1">
                      👥 ตามบทบาท (Roles)
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight">
                      เฉพาะบทบาทที่เลือก
                    </span>
                  </label>

                  <label
                    onClick={() => setNewFolderAccessType("department")}
                    className={`cursor-pointer p-2.5 rounded-xl border flex flex-col gap-1 transition-all ${
                      newFolderAccessType === "department"
                        ? "bg-emerald-600/30 border-emerald-500 text-white"
                        : "bg-black/20 border-white/10 text-slate-400 hover:bg-white/5"
                    }`}
                  >
                    <span className="font-semibold text-white flex items-center gap-1">
                      🏢 ตามแผนก (Dept)
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight">
                      เฉพาะคนในแผนก
                    </span>
                  </label>
                </div>
              </div>

              {/* Roles checkboxes if role-based */}
              {newFolderAccessType === "role" && (
                <div className="p-3 rounded-xl bg-black/30 border border-white/10 space-y-2">
                  <span className="text-[11px] font-medium text-indigo-300 block">
                    เลือกบทบาทที่อนุญาตให้เข้าถึง:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {AVAILABLE_ROLES.map((r) => {
                      const checked = newFolderAllowedRoles.includes(r);
                      return (
                        <label
                          key={r}
                          className="flex items-center gap-2 text-slate-300 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewFolderAllowedRoles((prev) => [...prev, r]);
                              } else {
                                setNewFolderAllowedRoles((prev) => prev.filter((item) => item !== r));
                              }
                            }}
                            className="rounded bg-black/40 border-white/20 text-indigo-500 focus:ring-0"
                          />
                          <span>{r}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Department input if department-based */}
              {newFolderAccessType === "department" && (
                <div className="p-3 rounded-xl bg-black/30 border border-white/10 space-y-1.5">
                  <label className="text-[11px] font-medium text-emerald-300 block">
                    ระบุชื่อแผนกที่อนุญาต (เช่น {user?.department || "IT System"}):
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น IT System, HR, Finance"
                    value={newFolderDept}
                    onChange={(e) => setNewFolderDept(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-black/50 border border-white/15 text-white"
                  />
                </div>
              )}

              {/* Permission level */}
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" /> ระดับการอนุญาต (Permission Level)
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setNewFolderPermLevel("read_write")}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                      newFolderPermLevel === "read_write"
                        ? "bg-blue-600/30 border-blue-500 text-white font-medium"
                        : "bg-black/20 border-white/10 text-slate-400"
                    }`}
                  >
                    <span>✏️ อ่านและเขียนได้</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewFolderPermLevel("read_only")}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                      newFolderPermLevel === "read_only"
                        ? "bg-amber-600/30 border-amber-500 text-white font-medium"
                        : "bg-black/20 border-white/10 text-slate-400"
                    }`}
                  >
                    <span>👁️ อ่านอย่างเดียว</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
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

      {/* Modal: Synology DSM Folder Properties & Permissions */}
      {showPermModal && permTargetFolder && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#181330] border border-white/20 rounded-2xl p-5 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Folder className="w-5 h-5 fill-amber-400/20" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">
                    คุณสมบัติ & สิทธิ์ของโฟลเดอร์
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {permTargetFolder.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPermModal(false)}
                className="cursor-pointer text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-white/10 mt-3 text-xs">
              <button
                onClick={() => setPermTab("permissions")}
                className={`cursor-pointer px-4 py-2 font-medium border-b-2 transition-all flex items-center gap-1.5 ${
                  permTab === "permissions"
                    ? "border-indigo-400 text-white"
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                สิทธิ์การเข้าถึง (Permissions)
              </button>
              <button
                onClick={() => setPermTab("general")}
                className={`cursor-pointer px-4 py-2 font-medium border-b-2 transition-all flex items-center gap-1.5 ${
                  permTab === "general"
                    ? "border-blue-400 text-white"
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                <Settings2 className="w-3.5 h-3.5 text-blue-400" />
                ข้อมูลทั่วไป (General)
              </button>
            </div>

            {permError && (
              <div className="mt-3 p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{permError}</span>
              </div>
            )}

            {permSuccess && (
              <div className="mt-3 p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{permSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSavePermissions} className="mt-4 space-y-4">
              {/* Tab: Permissions */}
              {permTab === "permissions" && (
                <div className="space-y-4">
                  {/* Read-Only Notice if user cannot manage */}
                  {permTargetFolder.currentUserCanManage === false && (
                    <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 shrink-0" />
                      <span>เฉพาะเจ้าของโฟลเดอร์หรือผู้ดูแลระบบที่สามารถแก้ไขสิทธิ์ได้ (โหมดดูข้อมูล)</span>
                    </div>
                  )}

                  {/* Access type options */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-2">
                      รูปแบบการเข้าถึง (Access Level)
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        disabled={permTargetFolder.currentUserCanManage === false}
                        onClick={() => setEditAccessType("public")}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          editAccessType === "public"
                            ? "bg-blue-600/30 border-blue-500 text-white"
                            : "bg-black/20 border-white/10 text-slate-400"
                        }`}
                      >
                        <div className="font-semibold text-white">🌐 สาธารณะ (Public)</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">ทุกคนในระบบเข้าถึงได้</div>
                      </button>

                      <button
                        type="button"
                        disabled={permTargetFolder.currentUserCanManage === false}
                        onClick={() => setEditAccessType("private")}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          editAccessType === "private"
                            ? "bg-rose-600/30 border-rose-500 text-white"
                            : "bg-black/20 border-white/10 text-slate-400"
                        }`}
                      >
                        <div className="font-semibold text-white">🔒 ส่วนตัว (Private)</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">เฉพาะผู้สร้างและ Admin</div>
                      </button>

                      <button
                        type="button"
                        disabled={permTargetFolder.currentUserCanManage === false}
                        onClick={() => setEditAccessType("role")}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          editAccessType === "role"
                            ? "bg-indigo-600/30 border-indigo-500 text-white"
                            : "bg-black/20 border-white/10 text-slate-400"
                        }`}
                      >
                        <div className="font-semibold text-white">👥 ตามบทบาท (Roles)</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">เฉพาะบทบาทที่กำหนด</div>
                      </button>

                      <button
                        type="button"
                        disabled={permTargetFolder.currentUserCanManage === false}
                        onClick={() => setEditAccessType("department")}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          editAccessType === "department"
                            ? "bg-emerald-600/30 border-emerald-500 text-white"
                            : "bg-black/20 border-white/10 text-slate-400"
                        }`}
                      >
                        <div className="font-semibold text-white">🏢 ตามแผนก (Dept)</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">เฉพาะบุคคลในแผนก</div>
                      </button>
                    </div>
                  </div>

                  {/* Roles selector */}
                  {editAccessType === "role" && (
                    <div className="p-3 rounded-xl bg-black/30 border border-white/10 space-y-2">
                      <span className="text-[11px] font-medium text-indigo-300 block">
                        บทบาทที่อนุญาตให้เข้าถึง:
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {AVAILABLE_ROLES.map((r) => {
                          const checked = editAllowedRoles.includes(r);
                          return (
                            <label
                              key={r}
                              className="flex items-center gap-2 text-slate-300 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                disabled={permTargetFolder.currentUserCanManage === false}
                                checked={checked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setEditAllowedRoles((prev) => [...prev, r]);
                                  } else {
                                    setEditAllowedRoles((prev) => prev.filter((item) => item !== r));
                                  }
                                }}
                                className="rounded bg-black/40 border-white/20 text-indigo-500 focus:ring-0"
                              />
                              <span>{r}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Department input */}
                  {editAccessType === "department" && (
                    <div className="p-3 rounded-xl bg-black/30 border border-white/10 space-y-1.5">
                      <label className="text-[11px] font-medium text-emerald-300 block">
                        ชื่อแผนกที่อนุญาตให้เข้าถึง:
                      </label>
                      <input
                        type="text"
                        disabled={permTargetFolder.currentUserCanManage === false}
                        required
                        value={editDept}
                        onChange={(e) => setEditDept(e.target.value)}
                        placeholder="เช่น IT System, HR, Finance"
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-black/50 border border-white/15 text-white"
                      />
                    </div>
                  )}

                  {/* Permission level */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      ระดับการอนุญาตในโฟลเดอร์นี้
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        disabled={permTargetFolder.currentUserCanManage === false}
                        onClick={() => setEditPermLevel("read_write")}
                        className={`p-2 rounded-xl border text-left transition-all ${
                          editPermLevel === "read_write"
                            ? "bg-blue-600/30 border-blue-500 text-white font-medium"
                            : "bg-black/20 border-white/10 text-slate-400"
                        }`}
                      >
                        <span>✏️ อ่านและเขียน (Read/Write)</span>
                      </button>
                      <button
                        type="button"
                        disabled={permTargetFolder.currentUserCanManage === false}
                        onClick={() => setEditPermLevel("read_only")}
                        className={`p-2 rounded-xl border text-left transition-all ${
                          editPermLevel === "read_only"
                            ? "bg-amber-600/30 border-amber-500 text-white font-medium"
                            : "bg-black/20 border-white/10 text-slate-400"
                        }`}
                      >
                        <span>👁️ อ่านอย่างเดียว (Read-Only)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: General */}
              {permTab === "general" && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      ชื่อโฟลเดอร์
                    </label>
                    <input
                      type="text"
                      disabled={permTargetFolder.currentUserCanManage === false}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/15 text-white"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-black/20 border border-white/10 space-y-2 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">เจ้าของ / ผู้สร้าง:</span>
                      <span className="text-white font-medium">{permTargetFolder.createdBy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">รหัสโฟลเดอร์:</span>
                      <span className="text-cyan-300 font-mono">{permTargetFolder.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">จำนวนไฟล์:</span>
                      <span className="text-white font-mono">{permTargetFolder.fileCount} ไฟล์</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">จำนวนโฟลเดอร์ย่อย:</span>
                      <span className="text-white font-mono">{permTargetFolder.subFolderCount} รายการ</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">วันที่สร้าง:</span>
                      <span className="text-slate-300">
                        {new Date(permTargetFolder.createdAt).toLocaleString("th-TH")}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowPermModal(false)}
                  className="cursor-pointer px-3.5 py-1.5 text-xs rounded-lg hover:bg-white/10 text-slate-300"
                >
                  ปิด
                </button>
                {permTargetFolder.currentUserCanManage !== false && (
                  <button
                    type="submit"
                    disabled={permLoading}
                    className="cursor-pointer px-4 py-1.5 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {permLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>บันทึกการตั้งค่าสิทธิ์</span>
                  </button>
                )}
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
