import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { ensureDatabaseReady } from "@/core/database";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const db = await ensureDatabaseReady();
    const rows = await db.query(
      `SELECT id, filename, original_name as "originalName", mime_type as "mimeType", 
              size_bytes as "sizeBytes", url, uploaded_by as "uploadedBy", 
              uploaded_at as "uploadedAt" 
       FROM files ORDER BY uploaded_at DESC`
    );
    return NextResponse.json({ files: rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const uploadedFiles = formData.getAll("files") as File[];
    const singleFile = formData.get("file") as File | null;

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

    // Get current user from session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("dcms_session");
    let uploaderName = "System / Guest";
    if (sessionCookie?.value) {
      try {
        const session = JSON.parse(sessionCookie.value);
        if (session.name) uploaderName = session.name;
      } catch {}
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const db = await ensureDatabaseReady();
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
        `INSERT INTO files (id, filename, original_name, mime_type, size_bytes, url, uploaded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          uniqueFilename,
          file.name,
          file.type || "application/octet-stream",
          file.size,
          fileUrl,
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

    const db = await ensureDatabaseReady();
    const rows = await db.query<{ filename: string }>(
      "SELECT filename FROM files WHERE id = ?",
      [id]
    );

    if (rows.length > 0) {
      const filename = rows[0].filename;
      const filePath = path.join(process.cwd(), "public", "uploads", filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.error("Failed to delete physical file:", e);
        }
      }
    }

    await db.execute("DELETE FROM files WHERE id = ?", [id]);

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
