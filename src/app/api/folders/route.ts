import { NextResponse } from "next/server";
import { ensureDatabaseReady } from "@/core/database";
import { cookies } from "next/headers";
import fs from "fs";
import path from "path";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get("parentId") || "root";

    const db = await ensureDatabaseReady();
    const folders = await db.query(
      `SELECT id, name, parent_id as "parentId", created_by as "createdBy", created_at as "createdAt"
       FROM folders 
       WHERE parent_id = ? 
       ORDER BY name ASC`,
      [parentId]
    );

    // Get item counts for each folder
    const enrichedFolders = await Promise.all(
      folders.map(async (f: any) => {
        const fileCountRes = await db.query<{ count: number | string }>(
          `SELECT COUNT(*) as count FROM files WHERE folder_id = ?`,
          [f.id]
        );
        const subFolderCountRes = await db.query<{ count: number | string }>(
          `SELECT COUNT(*) as count FROM folders WHERE parent_id = ?`,
          [f.id]
        );

        return {
          ...f,
          fileCount: Number(fileCountRes[0]?.count || 0),
          subFolderCount: Number(subFolderCountRes[0]?.count || 0),
        };
      })
    );

    return NextResponse.json({ folders: enrichedFolders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, parentId = "root" } = body;

    const trimmedName = (name || "").trim().replace(/[\\/:*?"<>|]/g, "_");
    if (!trimmedName) {
      return NextResponse.json(
        { error: "กรุณาระบุชื่อโฟลเดอร์ที่ถูกต้อง" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("dcms_session");
    let creatorName = "Admin";
    if (sessionCookie?.value) {
      try {
        const session = JSON.parse(sessionCookie.value);
        if (session.name) creatorName = session.name;
      } catch {}
    }

    const db = await ensureDatabaseReady();

    // Check duplicate in same parent
    const existing = await db.query(
      `SELECT id FROM folders WHERE parent_id = ? AND LOWER(name) = LOWER(?)`,
      [parentId, trimmedName]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: `โฟลเดอร์ชื่อ "${trimmedName}" มีอยู่แล้วในตำแหน่งนี้` },
        { status: 409 }
      );
    }

    const id = `fld-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    await db.execute(
      `INSERT INTO folders (id, name, parent_id, created_by)
       VALUES (?, ?, ?, ?)`,
      [id, trimmedName, parentId, creatorName]
    );

    return NextResponse.json({
      success: true,
      folder: {
        id,
        name: trimmedName,
        parentId,
        createdBy: creatorName,
        createdAt: new Date().toISOString(),
        fileCount: 0,
        subFolderCount: 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || id === "root") {
      return NextResponse.json({ error: "ไม่สามารถลบโฟลเดอร์หลักได้" }, { status: 400 });
    }

    const db = await ensureDatabaseReady();

    // Find all files inside this folder to delete physical files
    const files = await db.query<{ filename: string }>(
      `SELECT filename FROM files WHERE folder_id = ?`,
      [id]
    );

    for (const f of files) {
      const filePath = path.join(process.cwd(), "public", "uploads", f.filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch {}
      }
    }

    // Delete files records
    await db.execute(`DELETE FROM files WHERE folder_id = ?`, [id]);

    // Delete subfolders recursively
    await db.execute(`DELETE FROM folders WHERE parent_id = ?`, [id]);

    // Delete the folder itself
    await db.execute(`DELETE FROM folders WHERE id = ?`, [id]);

    return NextResponse.json({ success: true, deletedFolderId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
