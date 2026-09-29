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

export interface FolderItem {
  id: string;
  name: string;
  parentId: string;
  createdBy: string;
  createdAt: string;
  fileCount: number;
  subFolderCount: number;
}

export type FileCategory = "all" | "images" | "documents" | "archives" | "others";
