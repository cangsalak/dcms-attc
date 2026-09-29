import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { ensureDatabaseReady } from "@/core/database";
import { getSessionUser, checkFolderPermission } from "@/core/lib/auth";

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
                      uploaded_by as "uploadedBy", uploaded_at as "uploadedAt" 
               FROM files `;
    const params: any[] = [];

    if (folderId && folderId !== "all") {
      sql += ` WHERE folder_id = ? `;
      params.push(folderId);
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
    const formData = await req.formData();
    const uploadedFiles = formData.getAll("files") as File[];
    const singleFile = formData.get("file") as File | null;
    const folderId = (formData.get("folderId") as string) || "root";

    const sessionUser = await getSessionUser();
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

    const uploaderName = sessionUser?.name || "Admin";

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const savedRecords = [];

    for (const file of filesToProcess) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = path.extname(file.name) || "";
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

    return NextResponse.json({
      success: true,
      message: `อัปโหลดสำเร็จ ${savedRecords.length} ไฟล์`,
      files: savedRecords,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing file id" }, { status: 400 });
    }

    const sessionUser = await getSessionUser();
    const db = await ensureDatabaseReady();
    const rows = await db.query<{ filename: string; folder_id: string; uploaded_by: string }>(
      "SELECT filename, folder_id, uploaded_by FROM files WHERE id = ?",
      [id]
    );

    if (rows.length > 0) {
      const file = rows[0];

      // Check permission on parent folder
      if (file.folder_id && file.folder_id !== "root") {
        const folderRows = await db.query(`SELECT * FROM folders WHERE id = ?`, [file.folder_id]);
        if (folderRows.length > 0) {
          const perm = checkFolderPermission(folderRows[0], sessionUser);
          const isUploader = sessionUser?.name && file.uploaded_by === sessionUser.name;
          if (!perm.canWrite && !isUploader && sessionUser?.role !== "Super Admin" && sessionUser?.role !== "Admin") {
            return NextResponse.json(
              { error: "คุณไม่มีสิทธิ์ลบไฟล์ในโฟลเดอร์นี้" },
              { status: 403 }
            );
          }
        }
      }

      const filePath = path.join(process.cwd(), "public", "uploads", file.filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch {}
      }

      await db.execute("DELETE FROM files WHERE id = ?", [id]);
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
