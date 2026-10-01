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
  ChevronRight,
  ArrowLeft,
  Eye,
  RefreshCw,
  HardDrive,
  Share2,
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
  MoreVertical,
  RotateCcw,
} from "lucide-react";
import { FileRecord, FolderItem, FileCategory, FolderAccessType, FolderPermissionLevel } from "../types";
import { useAuth } from "@/core/context/AuthContext";
import {
  ModuleContainer,
  ModuleToolbar,
  ModuleButton,
  ModuleContextMenu,
  ModuleFooter,
  ModuleModal,
} from "@/core/components/ui/ModuleLayout";
import { formatBytes, formatThaiDateTime } from "@/core/lib";

const AVAILABLE_ROLES = ["Super Admin", "Admin", "Manager", "Member"];

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

  // Right-click context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: "folder" | "file";
    item: FolderItem | FileRecord;
  } | null>(null);

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
    setContextMenu(null);
  };

  // Navigate to breadcrumb
  const handleNavigateBreadcrumb = (index: number) => {
    const target = breadcrumbs[index];
    const newCrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newCrumbs);
    setCurrentFolderId(target.id);
    setSelectedFileId(null);
    setSelectedFolderId(null);
    setContextMenu(null);
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
    setContextMenu(null);
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

  // Restore file
  const handleRestoreFile = async (id: string) => {
    try {
      const res = await fetch("/api/upload", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "restore" }),
      });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== id));
        if (selectedFileId === id) setSelectedFileId(null);
      }
    } catch (e) {
      console.error("Restore file error:", e);
    }
  };

  // Restore folder
  const handleRestoreFolder = async (id: string) => {
    try {
      const res = await fetch("/api/folders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "restore" }),
      });
      if (res.ok) {
        setFolders((prev) => prev.filter((f) => f.id !== id));
        if (selectedFolderId === id) setSelectedFolderId(null);
      }
    } catch (e) {
      console.error("Restore folder error:", e);
    }
  };

  // Empty entire trash
  const handleEmptyTrash = async () => {
    if (
      !confirm(
        "คุณต้องการล้างไฟล์และโฟลเดอร์ทั้งหมดในถังขยะอย่างถาวรใช่หรือไม่? (การกระทำนี้ไม่สามารถย้อนกลับได้)"
      )
    ) {
      return;
    }
    try {
      await fetch("/api/upload?emptyTrash=true", { method: "DELETE" });
      await fetch("/api/folders?emptyTrash=true", { method: "DELETE" });
      setFiles([]);
      setFolders([]);
      setSelectedFileId(null);
      setSelectedFolderId(null);
    } catch (e) {
      console.error("Empty trash error:", e);
    }
  };

  // Delete folder (supports soft delete & permanent delete)
  const handleDeleteFolder = async (id: string, name: string, forcePermanent = false) => {
    const isTrash = currentFolderId === "trash" || forcePermanent;
    const confirmMsg = isTrash
      ? `คุณต้องการลบโฟลเดอร์ "${name}" และไฟล์ทั้งหมดข้างในอย่างถาวรหรือไม่?`
      : `คุณต้องการย้ายโฟลเดอร์ "${name}" ไปยังถังขยะหรือไม่?`;

    if (!confirm(confirmMsg)) return;

    try {
      const url = isTrash ? `/api/folders?id=${id}&permanent=true` : `/api/folders?id=${id}`;
      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "ไม่สามารถลบโฟลเดอร์ได้");
        return;
      }
      setFolders((prev) => prev.filter((f) => f.id !== id));
      setAllFolders((prev) => prev.filter((f) => f.id !== id));
      if (selectedFolderId === id) setSelectedFolderId(null);

      if (currentFolderId === id) {
        handleGoBack();
      } else {
        loadData(currentFolderId);
      }
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

    if (isReadOnlyCurrentFolder || currentFolderId === "trash") {
      alert("ไม่สามารถอัปโหลดไฟล์ในตำแหน่งนี้ได้");
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

  // Delete file (supports soft delete & permanent delete)
  const handleDeleteFile = async (id: string, name: string, forcePermanent = false) => {
    const isTrash = currentFolderId === "trash" || forcePermanent;
    const confirmMsg = isTrash
      ? `คุณต้องการลบไฟล์ "${name}" อย่างถาวรหรือไม่? (ไม่สามารถกู้คืนได้)`
      : `คุณต้องการย้ายไฟล์ "${name}" ไปยังถังขยะหรือไม่?`;

    if (!confirm(confirmMsg)) return;

    try {
      const url = isTrash ? `/api/upload?id=${id}&permanent=true` : `/api/upload?id=${id}`;
      const res = await fetch(url, { method: "DELETE" });
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

  // Helper badge render for folder permissions (Clean & Subtle)
  const renderFolderPermissionBadge = (fld: FolderItem) => {
    const access = fld.accessType || "public";
    const isReadOnly = fld.permissionLevel === "read_only";

    if (access === "public" && !isReadOnly) return null;

    return (
      <div className="flex items-center gap-1 mt-1">
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

  // Context Menu Items builder
  const getContextMenuItems = () => {
    if (!contextMenu) return [];

    if (contextMenu.type === "folder") {
      const fld = contextMenu.item as FolderItem;
      if (currentFolderId === "trash") {
        return [
          {
            label: "กู้คืนโฟลเดอร์ (Restore)",
            icon: RotateCcw,
            onClick: () => handleRestoreFolder(fld.id),
          },
          { divider: true as const },
          {
            label: "ลบถาวร (Delete Permanently)",
            icon: Trash2,
            danger: true,
            onClick: () => handleDeleteFolder(fld.id, fld.name, true),
          },
        ];
      }
      return [
        {
          label: "เปิดโฟลเดอร์ (Open)",
          icon: FolderOpen,
          onClick: () => handleOpenFolder(fld),
        },
        {
          label: "สิทธิ์ & คุณสมบัติ (Permissions)",
          icon: Shield,
          onClick: () => handleOpenPermissions(fld),
        },
        { divider: true as const },
        {
          label: "ลบโฟลเดอร์ (Delete)",
          icon: Trash2,
          danger: true,
          onClick: () => handleDeleteFolder(fld.id, fld.name),
        },
      ];
    } else {
      const file = contextMenu.item as FileRecord;
      if (currentFolderId === "trash") {
        return [
          {
            label: "กู้คืนไฟล์ (Restore)",
            icon: RotateCcw,
            onClick: () => handleRestoreFile(file.id),
          },
          { divider: true as const },
          {
            label: "ลบถาวร (Delete Permanently)",
            icon: Trash2,
            danger: true,
            onClick: () => handleDeleteFile(file.id, file.originalName, true),
          },
        ];
      }
      const isImg = file.mimeType.startsWith("image/");
      return [
        ...(isImg
          ? [
              {
                label: "ดูตัวอย่าง (Preview)",
                icon: Eye,
                onClick: () => setPreviewImage(file.url),
              },
            ]
          : []),
        {
          label: "ดาวน์โหลด (Download)",
          icon: Download,
          onClick: () => {
            const a = document.createElement("a");
            a.href = file.url;
            a.download = file.originalName;
            a.click();
          },
        },
        {
          label: "แชร์ลิงก์ (Copy Link)",
          icon: Share2,
          onClick: () => handleCopyLink(file),
        },
        { divider: true as const },
        {
          label: "ลบไฟล์ (Delete)",
          icon: Trash2,
          danger: true,
          onClick: () => handleDeleteFile(file.id, file.originalName),
        },
      ];
    }
  };

  return (
    <ModuleContainer
      onContextMenu={(e) => {
        // If right clicked on empty area, prevent default and close context menu
        if (e.target === e.currentTarget) {
          e.preventDefault();
          setContextMenu(null);
        }
      }}
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

      {/* Standard Unified Module Toolbar */}
      <ModuleToolbar
        leftActions={
          currentFolderId === "trash" ? (
            <ModuleButton
              variant="danger"
              icon={Trash2}
              onClick={handleEmptyTrash}
              title="ล้างไฟล์และโฟลเดอร์ทั้งหมดในถังขยะอย่างถาวร"
            >
              ล้างถังขยะ (Empty Trash)
            </ModuleButton>
          ) : (
            <>
              <ModuleButton
                variant="primary"
                icon={UploadCloud}
                disabled={isUploading || isReadOnlyCurrentFolder}
                onClick={() => fileInputRef.current?.click()}
                title={isReadOnlyCurrentFolder ? "โฟลเดอร์นี้เปิดให้อ่านอย่างเดียว" : "อัปโหลดไฟล์"}
              >
                {isUploading ? uploadProgress || "กำลังอัปโหลด..." : "อัปโหลด (Upload)"}
              </ModuleButton>

              <ModuleButton
                variant="secondary"
                icon={FolderPlus}
                disabled={isReadOnlyCurrentFolder}
                onClick={() => {
                  setFolderError(null);
                  setNewFolderName("");
                  setNewFolderAccessType("public");
                  setNewFolderAllowedRoles(AVAILABLE_ROLES);
                  setNewFolderDept(user?.department || "");
                  setNewFolderPermLevel("read_write");
                  setShowFolderModal(true);
                }}
                title={isReadOnlyCurrentFolder ? "โฟลเดอร์นี้เปิดให้อ่านอย่างเดียว" : "สร้างโฟลเดอร์ใหม่"}
              >
                สร้างโฟลเดอร์
              </ModuleButton>
            </>
          )
        }
        selectedActions={
          currentFolderId === "trash" ? (
            selectedFolder ? (
              <>
                <ModuleButton
                  variant="primary"
                  icon={RotateCcw}
                  onClick={() => handleRestoreFolder(selectedFolder.id)}
                >
                  กู้คืนโฟลเดอร์
                </ModuleButton>
                <ModuleButton
                  variant="danger"
                  icon={Trash2}
                  onClick={() => handleDeleteFolder(selectedFolder.id, selectedFolder.name, true)}
                >
                  ลบถาวร
                </ModuleButton>
              </>
            ) : selectedFile ? (
              <>
                <ModuleButton
                  variant="primary"
                  icon={RotateCcw}
                  onClick={() => handleRestoreFile(selectedFile.id)}
                >
                  กู้คืนไฟล์
                </ModuleButton>
                <ModuleButton
                  variant="danger"
                  icon={Trash2}
                  onClick={() => handleDeleteFile(selectedFile.id, selectedFile.originalName, true)}
                >
                  ลบถาวร
                </ModuleButton>
              </>
            ) : null
          ) : selectedFolder ? (
            <>
              <ModuleButton
                variant="secondary"
                icon={Shield}
                onClick={() => handleOpenPermissions(selectedFolder)}
              >
                สิทธิ์ & คุณสมบัติ
              </ModuleButton>
              <ModuleButton
                variant="danger"
                icon={Trash2}
                onClick={() => handleDeleteFolder(selectedFolder.id, selectedFolder.name)}
              >
                ลบ
              </ModuleButton>
            </>
          ) : selectedFile ? (
            <>
              <a
                href={selectedFile.url}
                download={selectedFile.originalName}
                className="cursor-pointer px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 flex items-center gap-1.5 transition-colors border border-white/10 text-xs"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>ดาวน์โหลด</span>
              </a>

              <ModuleButton
                variant="secondary"
                icon={Share2}
                onClick={() => handleCopyLink(selectedFile)}
              >
                {copiedId === selectedFile.id ? "คัดลอกแล้ว!" : "แชร์ลิงก์"}
              </ModuleButton>

              <ModuleButton
                variant="danger"
                icon={Trash2}
                onClick={() => handleDeleteFile(selectedFile.id, selectedFile.originalName)}
              >
                ลบ
              </ModuleButton>
            </>
          ) : currentFolderInfo ? (
            <ModuleButton
              variant="ghost"
              icon={Shield}
              onClick={() => handleOpenPermissions(currentFolderInfo)}
            >
              สิทธิ์โฟลเดอร์นี้
            </ModuleButton>
          ) : null
        }
        search={search}
        onSearchChange={setSearch}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={() => loadData(currentFolderId)}
        isRefreshing={isLoading}
      />

      {/* Synology Breadcrumb Path Bar */}
      <div className="px-4 py-1.5 border-b border-white/5 bg-black/20 flex items-center justify-between gap-1.5 text-xs text-slate-400 shrink-0">
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
          <span className="shrink-0 text-slate-400">DCMS Station</span>

          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.id}>
              <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
              <button
                onClick={() => handleNavigateBreadcrumb(idx)}
                className={`cursor-pointer hover:text-cyan-300 font-medium transition-colors truncate max-w-[140px] ${
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
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-200 text-xs flex items-center justify-between shrink-0">
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
              setSelectedFileId(null);
              setSelectedFolderId(null);
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
                <div
                  key={fld.id}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setContextMenu({
                      x: e.clientX,
                      y: e.clientY,
                      type: "folder",
                      item: fld,
                    });
                  }}
                  className={`group flex items-center justify-between px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                    currentFolderId === fld.id
                      ? "bg-blue-600/30 text-white border border-blue-500/40"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <button
                    onClick={() => {
                      setCurrentFolderId(fld.id);
                      setBreadcrumbs([
                        { id: "root", name: "uploads" },
                        { id: fld.id, name: fld.name },
                      ]);
                      setCategory("all");
                      setSelectedFileId(null);
                      setSelectedFolderId(null);
                    }}
                    className="flex-1 flex items-center gap-1.5 truncate text-left cursor-pointer"
                  >
                    {fld.accessType === "private" ? (
                      <Lock className="w-3 h-3 text-rose-400 shrink-0" />
                    ) : (
                      <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                    <span className="truncate">{fld.name}</span>
                  </button>

                  <span className="text-[10px] text-slate-500 font-mono">
                    {fld.fileCount}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-white/10 my-2" />

          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
            หมวดหมู่ (Categories)
          </div>

          <button
            onClick={() => {
              setCategory("images");
              setSelectedFileId(null);
              setSelectedFolderId(null);
            }}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
              category === "images"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-300 hover:bg-white/5"
            }`}
          >
            <ImageIcon className="w-4 h-4 text-purple-400" />
            <span>รูปภาพ (Photos)</span>
          </button>

          <button
            onClick={() => {
              setCategory("documents");
              setSelectedFileId(null);
              setSelectedFolderId(null);
            }}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
              category === "documents"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-300 hover:bg-white/5"
            }`}
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span>เอกสาร (Documents)</span>
          </button>

          <button
            onClick={() => {
              setCategory("archives");
              setSelectedFileId(null);
              setSelectedFolderId(null);
            }}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
              category === "archives"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-300 hover:bg-white/5"
            }`}
          >
            <FileArchive className="w-4 h-4 text-amber-400" />
            <span>ไฟล์บีบอัด (Archives)</span>
          </button>

          {/* Recycle Bin (ถังขยะ) */}
          <button
            onClick={() => {
              setCurrentFolderId("trash");
              setBreadcrumbs([{ id: "trash", name: "ถังขยะ (Recycle Bin)" }]);
              setCategory("all");
              setSelectedFileId(null);
              setSelectedFolderId(null);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
              currentFolderId === "trash"
                ? "bg-rose-600/30 text-white border border-rose-500/40 shadow"
                : "text-slate-400 hover:text-rose-300 hover:bg-white/5"
            }`}
          >
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
              <span>ถังขยะ (Recycle Bin)</span>
            </div>
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
        <div
          onClick={() => {
            setSelectedFileId(null);
            setSelectedFolderId(null);
            setContextMenu(null);
          }}
          className="flex-1 overflow-auto p-4 flex flex-col justify-between"
        >
          <div>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mb-2" />
                กำลังโหลด File Station...
              </div>
            ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
              <div
                onClick={(e) => {
                  e.stopPropagation();
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
              /* Clean Synology DSM Grid View (NO Cluttered Trash Icons on Cards!) */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {/* 1. Folders in current directory */}
                {category === "all" &&
                  filteredFolders.map((fld) => {
                    const isSelected = selectedFolderId === fld.id;

                    return (
                      <div
                        key={fld.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFolderId(fld.id);
                          setSelectedFileId(null);
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          handleOpenFolder(fld);
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedFolderId(fld.id);
                          setSelectedFileId(null);
                          setContextMenu({
                            x: e.clientX,
                            y: e.clientY,
                            type: "folder",
                            item: fld,
                          });
                        }}
                        className={`group relative p-3 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? "bg-amber-500/15 border-amber-400 shadow-md ring-1 ring-amber-400/30"
                            : "bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.05]"
                        }`}
                      >
                        {/* Folder Thumbnail Box */}
                        <div className="w-full h-24 rounded-lg bg-black/30 border border-white/5 flex flex-col items-center justify-center mb-2 group-hover:scale-105 transition-transform relative">
                          <Folder className="w-11 h-11 text-amber-400 fill-amber-400/20 drop-shadow" />
                          <span className="text-[10px] text-amber-200/80 font-mono mt-1">
                            {fld.fileCount} ไฟล์
                          </span>

                          {/* Subtle Lock Indicator if private */}
                          {fld.accessType === "private" && (
                            <div className="absolute top-2 right-2">
                              <span title="โฟลเดอร์ส่วนตัว" className="p-1 rounded bg-rose-500/30 text-rose-300 inline-block">
                                <Lock className="w-3 h-3" />
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Title and Badge only */}
                        <div className="min-w-0">
                          <div
                            className="text-xs font-semibold text-white truncate text-center"
                            title={fld.name}
                          >
                            {fld.name}
                          </div>
                          {renderFolderPermissionBadge(fld)}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFileId(file.id);
                        setSelectedFolderId(null);
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        if (isImage) setPreviewImage(file.url);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedFileId(file.id);
                        setSelectedFolderId(null);
                        setContextMenu({
                          x: e.clientX,
                          y: e.clientY,
                          type: "file",
                          item: file,
                        });
                      }}
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
                        <div className="text-[10px] text-slate-400 mt-0.5 flex justify-between items-center">
                          <span>{formatBytes(file.sizeBytes)}</span>
                          <span className="truncate max-w-[70px]">{file.uploadedBy}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Clean Synology DSM List View */
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="py-2 px-3">ชื่อ</th>
                      <th className="py-2 px-3">สิทธิ์</th>
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
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFolderId(fld.id);
                            setSelectedFileId(null);
                          }}
                          onDoubleClick={() => handleOpenFolder(fld)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedFolderId(fld.id);
                            setSelectedFileId(null);
                            setContextMenu({
                              x: e.clientX,
                              y: e.clientY,
                              type: "folder",
                              item: fld,
                            });
                          }}
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
                          <td className="py-2 px-3">{renderFolderPermissionBadge(fld) || "-"}</td>
                          <td className="py-2 px-3 text-slate-400 font-mono">
                            {fld.fileCount} รายการ
                          </td>
                          <td className="py-2 px-3 text-slate-300">{fld.createdBy}</td>
                          <td className="py-2 px-3 text-slate-400">
                            {formatThaiDateTime(fld.createdAt, "short")}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenPermissions(fld);
                                }}
                                className="cursor-pointer p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                                title="ตั้งค่าสิทธิ์"
                              >
                                <Shield className="w-3.5 h-3.5" />
                              </button>
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
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFileId(file.id);
                            setSelectedFolderId(null);
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedFileId(file.id);
                            setSelectedFolderId(null);
                            setContextMenu({
                              x: e.clientX,
                              y: e.clientY,
                              type: "file",
                              item: file,
                            });
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
                            {file.mimeType.split("/")[1] || file.mimeType}
                          </td>
                          <td className="py-2 px-3 text-slate-300 font-mono">
                            {formatBytes(file.sizeBytes)}
                          </td>
                          <td className="py-2 px-3 text-slate-300">{file.uploadedBy}</td>
                          <td className="py-2 px-3 text-slate-400">
                            {formatThaiDateTime(file.uploadedAt, "short")}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <a
                                href={file.url}
                                download={file.originalName}
                                onClick={(e) => e.stopPropagation()}
                                className="cursor-pointer p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                                title="ดาวน์โหลด"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteFile(file.id, file.originalName);
                                }}
                                className="cursor-pointer p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                                title="ลบไฟล์"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Standard Unified Footer Status Bar */}
      <ModuleFooter
        leftContent={`${filteredFolders.length} โฟลเดอร์, ${filteredFiles.length} ไฟล์`}
        selectedText={
          selectedFolder
            ? `เลือกโฟลเดอร์: ${selectedFolder.name}`
            : selectedFile
            ? `เลือกไฟล์: ${selectedFile.originalName} • ${formatBytes(selectedFile.sizeBytes)}`
            : null
        }
      />

      {/* Synology DSM Floating Context Menu */}
      {contextMenu && (
        <ModuleContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={getContextMenuItems()}
        />
      )}

      {/* Modal: Create New Folder (With Permissions) */}
      <ModuleModal
        isOpen={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        title="สร้างโฟลเดอร์ใหม่"
        icon={FolderPlus}
        subtitle={`ปลายทาง: /${breadcrumbs.map((b) => b.name).join("/")}`}
        maxWidth="max-w-md"
      >
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
              placeholder="เช่น เอกสารสัญญา, บัญชี, รายงาน"
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
                className={`cursor-pointer p-2 rounded-xl border flex flex-col gap-0.5 transition-all ${
                  newFolderAccessType === "public"
                    ? "bg-blue-600/30 border-blue-500 text-white"
                    : "bg-black/20 border-white/10 text-slate-400 hover:bg-white/5"
                }`}
              >
                <span className="font-semibold text-white">🌐 สาธารณะ (Public)</span>
                <span className="text-[10px] text-slate-400">ทุกคนในระบบเข้าถึงได้</span>
              </label>

              <label
                onClick={() => setNewFolderAccessType("private")}
                className={`cursor-pointer p-2 rounded-xl border flex flex-col gap-0.5 transition-all ${
                  newFolderAccessType === "private"
                    ? "bg-rose-600/30 border-rose-500 text-white"
                    : "bg-black/20 border-white/10 text-slate-400 hover:bg-white/5"
                }`}
              >
                <span className="font-semibold text-white">🔒 ส่วนตัว (Private)</span>
                <span className="text-[10px] text-slate-400">เฉพาะฉันและผู้ดูแล</span>
              </label>

              <label
                onClick={() => setNewFolderAccessType("role")}
                className={`cursor-pointer p-2 rounded-xl border flex flex-col gap-0.5 transition-all ${
                  newFolderAccessType === "role"
                    ? "bg-indigo-600/30 border-indigo-500 text-white"
                    : "bg-black/20 border-white/10 text-slate-400 hover:bg-white/5"
                }`}
              >
                <span className="font-semibold text-white">👥 ตามบทบาท (Roles)</span>
                <span className="text-[10px] text-slate-400">เฉพาะบทบาทที่เลือก</span>
              </label>

              <label
                onClick={() => setNewFolderAccessType("department")}
                className={`cursor-pointer p-2 rounded-xl border flex flex-col gap-0.5 transition-all ${
                  newFolderAccessType === "department"
                    ? "bg-emerald-600/30 border-emerald-500 text-white"
                    : "bg-black/20 border-white/10 text-slate-400 hover:bg-white/5"
                }`}
              >
                <span className="font-semibold text-white">🏢 ตามแผนก (Dept)</span>
                <span className="text-[10px] text-slate-400">เฉพาะคนในแผนก</span>
              </label>
            </div>
          </div>

          {/* Roles checkboxes if role-based */}
          {newFolderAccessType === "role" && (
            <div className="p-3 rounded-xl bg-black/30 border border-white/10 space-y-2">
              <span className="text-[11px] font-medium text-indigo-300 block">
                เลือกบทบาทที่อนุญาต:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {AVAILABLE_ROLES.map((r) => (
                  <label key={r} className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newFolderAllowedRoles.includes(r)}
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
                ))}
              </div>
            </div>
          )}

          {/* Department input if department-based */}
          {newFolderAccessType === "department" && (
            <div className="p-3 rounded-xl bg-black/30 border border-white/10 space-y-1.5">
              <label className="text-[11px] font-medium text-emerald-300 block">
                ระบุชื่อแผนกที่อนุญาต:
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
              <Sliders className="w-3.5 h-3.5 text-amber-400" /> ระดับการอนุญาต
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setNewFolderPermLevel("read_write")}
                className={`p-2 rounded-xl border text-left transition-all ${
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
                className={`p-2 rounded-xl border text-left transition-all ${
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
      </ModuleModal>

      {/* Modal: Synology DSM Folder Properties & Permissions */}
      {permTargetFolder && (
        <ModuleModal
          isOpen={showPermModal}
          onClose={() => setShowPermModal(false)}
          title="คุณสมบัติ & สิทธิ์ของโฟลเดอร์"
          icon={Folder}
          subtitle={permTargetFolder.name}
          maxWidth="max-w-lg"
        >
          {/* Modal Tabs */}
          <div className="flex border-b border-white/10 text-xs">
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
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-2">
                    รูปแบบการเข้าถึง (Access Level)
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
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
                      บทบาทที่อนุญาต:
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {AVAILABLE_ROLES.map((r) => (
                        <label key={r} className="flex items-center gap-2 text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editAllowedRoles.includes(r)}
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
                      ))}
                    </div>
                  </div>
                )}

                {/* Department input */}
                {editAccessType === "department" && (
                  <div className="p-3 rounded-xl bg-black/30 border border-white/10 space-y-1.5">
                    <label className="text-[11px] font-medium text-emerald-300 block">
                      ชื่อแผนกที่อนุญาต:
                    </label>
                    <input
                      type="text"
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
              <button
                type="submit"
                disabled={permLoading}
                className="cursor-pointer px-4 py-1.5 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 disabled:opacity-50"
              >
                {permLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>บันทึกการตั้งค่าสิทธิ์</span>
              </button>
            </div>
          </form>
        </ModuleModal>
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
    </ModuleContainer>
  );
}
