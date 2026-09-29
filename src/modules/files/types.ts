export interface FileRecord {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  folderId?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export type FolderAccessType = "public" | "private" | "role" | "department";
export type FolderPermissionLevel = "read_write" | "read_only";

export interface FolderItem {
  id: string;
  name: string;
  parentId: string;
  ownerId?: string;
  accessType?: FolderAccessType;
  allowedRoles?: string[];
  allowedUsers?: string[];
  department?: string;
  permissionLevel?: FolderPermissionLevel;
  createdBy: string;
  createdAt: string;
  fileCount: number;
  subFolderCount: number;
  currentUserCanWrite?: boolean;
  currentUserCanManage?: boolean;
}

export type FileCategory = "all" | "images" | "documents" | "archives" | "others";

