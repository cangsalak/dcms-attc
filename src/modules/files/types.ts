export interface FileRecord {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

export type FileCategory = "all" | "images" | "documents" | "archives" | "others";
