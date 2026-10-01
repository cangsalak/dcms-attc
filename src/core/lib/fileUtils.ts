/**
 * File Utilities & Helper Library (DCMS Core)
 * ฟังก์ชันสำหรับจัดการไฟล์ ขนาดไฟล์ และนามสกุลไฟล์
 */

/**
 * ฟอร์แมตขนาดไฟล์ bytes ให้เป็นข้อความที่อ่านง่าย (KB, MB, GB, TB)
 * ตัวอย่าง: formatBytes(1048576) -> "1 MB"
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (!+bytes || bytes <= 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
  return `${val} ${sizes[i]}`;
}

/**
 * ดึงนามสกุลไฟล์ เช่น "report.pdf" -> "pdf"
 */
export function getFileExtension(filename: string): string {
  if (!filename) return "";
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

/**
 * สกัดประเภทไฟล์ (หมวดหมู่) ตาม mime type หรือนามสกุล
 */
export function getFileCategory(mimeType: string, filename: string = ""): "image" | "document" | "archive" | "audio" | "video" | "code" | "other" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (
    mimeType.includes("pdf") ||
    mimeType.includes("word") ||
    mimeType.includes("excel") ||
    mimeType.includes("sheet") ||
    mimeType.includes("document") ||
    mimeType.includes("presentation") ||
    mimeType.includes("text/plain")
  ) {
    return "document";
  }
  if (
    mimeType.includes("zip") ||
    mimeType.includes("tar") ||
    mimeType.includes("rar") ||
    mimeType.includes("7z") ||
    mimeType.includes("compressed")
  ) {
    return "archive";
  }
  const ext = getFileExtension(filename);
  if (["js", "ts", "tsx", "jsx", "html", "css", "json", "py", "sql", "sh"].includes(ext)) {
    return "code";
  }
  return "other";
}
