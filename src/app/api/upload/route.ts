import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { ensureDatabaseReady } from "@/core/database";
import { getSessionUser, checkFolderPermission } from "@/core/lib/auth";
import { createSystemNotification } from "@/core/lib/notifications";

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

const DANGEROUS_EXTENSIONS = new Set([
  ".html",
  ".htm",
  ".xhtml",
  ".php",
  ".phtml",
  ".php3",
  ".php4",
  ".php5",
  ".exe",
  ".bat",
  ".cmd",
  ".sh",
  ".bash",
  ".zsh",
  ".js",
  ".mjs",
  ".cgi",
  ".pl",
  ".jsp",
  ".asp",
  ".aspx",
  ".vbs",
  ".scr",
  ".jar",
]);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get("folderId");
    const category = searchParams.get("category");

    const sessionUser = await getSessionUser();
    const db = await ensureDatabaseReady();

    // If specific folder requested (not root and not all), verify read permission
    if (folderId && folderId !== "all" && folderId !== "root") {
      const folderRows = await db.query(`SELECT * FROM folders WHERE id = ?`, [folderId]);
      if (folderRows.length > 0) {
        const perm = checkFolderPermission(folderRows[0], sessionUser);
        if (!perm.canRead) {
          return NextResponse.json(
            { error: "คุณไม่มีสิทธิ์เข้าถึงโฟลเดอร์นี้", files: [] },
            { status: 403 }
          );
        }
      }
    }

    let sql = `SELECT id, filename, original_name as "originalName", mime_type as "mimeType", 
                      size_bytes as "sizeBytes", url, folder_id as "folderId", 
                      uploaded_by as "uploadedBy", uploaded_at as "uploadedAt",
                      is_trash as "isTrash", deleted_at as "deletedAt" 
               FROM files `;
    const params: any[] = [];

    if (folderId === "trash") {
      sql += ` WHERE (is_trash = true OR is_trash = 1) `;
    } else {
      sql += ` WHERE (is_trash = false OR is_trash = 0 OR is_trash IS NULL) `;
      if (folderId && folderId !== "all") {
        sql += ` AND folder_id = ? `;
        params.push(folderId);
      }
    }

    sql += ` ORDER BY uploaded_at DESC`;

    const rows = await db.query(sql, params);

    // If "all" was requested, filter out files in folders that the user cannot read
    let allowedRows = rows;
    if (folderId === "all" && sessionUser?.role !== "Super Admin" && sessionUser?.role !== "Admin") {
      const allFolders = await db.query(`SELECT * FROM folders`);
      const folderPermMap = new Map<string, boolean>();
      for (const f of allFolders) {
        folderPermMap.set(f.id, checkFolderPermission(f, sessionUser).canRead);
      }
      allowedRows = rows.filter((r: any) => {
        if (!r.folderId || r.folderId === "root") return true;
        return folderPermMap.get(r.folderId) ?? true;
      });
    }

    return NextResponse.json({ files: allowedRows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อนทำการอัปโหลดไฟล์" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const uploadedFiles = formData.getAll("files") as File[];
    const singleFile = formData.get("file") as File | null;
    const folderId = (formData.get("folderId") as string) || "root";

    const db = await ensureDatabaseReady();

    // Check folder write permissions
    if (folderId && folderId !== "root") {
      const folderRows = await db.query(`SELECT * FROM folders WHERE id = ?`, [folderId]);
      if (folderRows.length > 0) {
        const perm = checkFolderPermission(folderRows[0], sessionUser);
        if (!perm.canWrite) {
          return NextResponse.json(
            { error: "คุณไม่มีสิทธิ์อัปโหลดไฟล์ในโฟลเดอร์นี้ (สิทธิ์เปิดให้อ่านอย่างเดียว หรือไม่มีสิทธิ์การเข้าถึง)" },
            { status: 403 }
          );
        }
      }
    }

    const filesToProcess: File[] = [];
    if (uploadedFiles && uploadedFiles.length > 0) {
      filesToProcess.push(...uploadedFiles.filter((f) => f && f.name));
    } else if (singleFile && singleFile.name) {
      filesToProcess.push(singleFile);
    }

    if (filesToProcess.length === 0) {
      return NextResponse.json(
        { error: "ไม่พบไฟล์ที่ต้องการอัปโหลด" },
        { status: 400 }
      );
    }

    // Security validation: file size & dangerous extension checks
    for (const file of filesToProcess) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: `ไฟล์ ${file.name} มีขนาดเกินกำหนด (สูงสุด 100 MB ต่อไฟล์)` },
          { status: 400 }
        );
      }

      const ext = path.extname(file.name).toLowerCase();
      if (DANGEROUS_EXTENSIONS.has(ext)) {
        return NextResponse.json(
          {
            error: `ไฟล์นามสกุล "${ext}" ไม่อนุญาตให้อัปโหลดเนื่องจากเหตุผลด้านความปลอดภัยของระบบ (Blocked Executable/Script Extension)`,
          },
          { status: 400 }
        );
      }
    }

    const uploaderName = sessionUser.name;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const savedRecords = [];

    for (const file of filesToProcess) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = path.extname(file.name).toLowerCase() || "";
      const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_\-\u0E00-\u0E7F]/g, "_");
      const uniqueFilename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${baseName}${ext}`;
      const filePath = path.join(uploadDir, uniqueFilename);

      await fs.promises.writeFile(filePath, buffer);

      const id = `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const fileUrl = `/uploads/${uniqueFilename}`;

      await db.execute(
        `INSERT INTO files (id, filename, original_name, mime_type, size_bytes, url, folder_id, uploaded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          uniqueFilename,
          file.name,
          file.type || "application/octet-stream",
          file.size,
          fileUrl,
          folderId,
          uploaderName,
        ]
      );

      savedRecords.push({
        id,
        filename: uniqueFilename,
        originalName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        url: fileUrl,
        folderId,
        uploadedBy: uploaderName,
        uploadedAt: new Date().toISOString(),
      });
    }
 
    createSystemNotification({
      title: "อัปโหลดไฟล์สำเร็จ",
      message: `${sessionUser.name} อัปโหลด ${savedRecords.length} ไฟล์ เข้าสู่ File Station`,
      type: "success",
      link: "files",
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `อัปโหลดสำเร็จ ${savedRecords.length} ไฟล์`,
      files: savedRecords,
      file: savedRecords[0] || null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { id, action } = body;

    const db = await ensureDatabaseReady();

    if (action === "restore" && id) {
      await db.execute(
        "UPDATE files SET is_trash = 0, deleted_at = NULL WHERE id = ?",
        [id]
      );
      return NextResponse.json({ success: true, message: "กู้คืนไฟล์เรียบร้อยแล้ว" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อนทำการลบไฟล์" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const permanent = searchParams.get("permanent") === "true";
    const emptyTrash = searchParams.get("emptyTrash") === "true";

    const db = await ensureDatabaseReady();

    // 1. Empty entire trash
    if (emptyTrash) {
      const trashFiles = await db.query<{ id: string; filename: string }>(
        "SELECT id, filename FROM files WHERE (is_trash = true OR is_trash = 1)"
      );
      for (const file of trashFiles) {
        const filePath = path.join(process.cwd(), "public", "uploads", file.filename);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch {}
        }
      }
      await db.execute("DELETE FROM files WHERE (is_trash = true OR is_trash = 1)");
      return NextResponse.json({ success: true, message: "ล้างถังขยะเรียบร้อยแล้ว" });
    }

    if (!id) {
      return NextResponse.json({ error: "Missing file id" }, { status: 400 });
    }

    const rows = await db.query<{ filename: string; folder_id: string; uploaded_by: string; is_trash: any }>(
      "SELECT filename, folder_id, uploaded_by, is_trash FROM files WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 404 });
    }

    const file = rows[0];
    const isAlreadyInTrash = Boolean(file.is_trash && file.is_trash !== 0 && file.is_trash !== "0");

    // Check permission on parent folder
    if (file.folder_id && file.folder_id !== "root") {
      const folderRows = await db.query(`SELECT * FROM folders WHERE id = ?`, [file.folder_id]);
      if (folderRows.length > 0) {
        const perm = checkFolderPermission(folderRows[0], sessionUser);
        const isUploader = sessionUser.name && file.uploaded_by === sessionUser.name;
        if (!perm.canWrite && !isUploader && sessionUser.role !== "Super Admin" && sessionUser.role !== "Admin") {
          return NextResponse.json(
            { error: "คุณไม่มีสิทธิ์ลบไฟล์ในโฟลเดอร์นี้" },
            { status: 403 }
          );
        }
      }
    }

    // 2. Permanent Delete (if requested or already inside trash)
    if (permanent || isAlreadyInTrash) {
      const filePath = path.join(process.cwd(), "public", "uploads", file.filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch {}
      }
      await db.execute("DELETE FROM files WHERE id = ?", [id]);
      return NextResponse.json({ success: true, deletedId: id, permanent: true });
    }

    // 3. Soft Delete -> Move to Recycle Bin
    await db.execute(
      "UPDATE files SET is_trash = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );

    return NextResponse.json({ success: true, deletedId: id, inTrash: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
